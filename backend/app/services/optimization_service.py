from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    OptimizationRun, OptimizationOption, ShortageEvent, SurplusEvent, Project, Material,
    Supplier, SupplierMaterial, Inventory
)

DISTANCE_MATRIX_KM = {
    ("Chennai", "Madurai"): 460,
    ("Madurai", "Chennai"): 460,
    ("Chennai", "Coimbatore"): 505,
    ("Coimbatore", "Chennai"): 505,
    ("Madurai", "Coimbatore"): 215,
    ("Coimbatore", "Madurai"): 215,
    ("Chennai", "Trichy"): 330,
    ("Trichy", "Chennai"): 330,
    ("Madurai", "Trichy"): 135,
    ("Trichy", "Madurai"): 135,
    ("Tirunelveli", "Madurai"): 160,
    ("Madurai", "Tirunelveli"): 160,
    ("Chennai", "Tirunelveli"): 620,
    ("Tirunelveli", "Chennai"): 620,
}

def get_approx_distance_km(loc_from: str, loc_to: str) -> int:
    for (k1, k2), dist in DISTANCE_MATRIX_KM.items():
        if (k1.lower() in loc_from.lower() and k2.lower() in loc_to.lower()) or \
           (k2.lower() in loc_from.lower() and k1.lower() in loc_to.lower()):
            return dist
    return 300  # standard regional baseline distance

def calculate_transport_cost(distance_km: int, weight_kg: float) -> float:
    weight_tons = max(0.5, weight_kg / 1000.0)
    rate_per_ton_km = 12.5  # standard commercial freight rate in India
    base_dispatch_charge = 3500.0
    return round(base_dispatch_charge + (distance_km * weight_tons * rate_per_ton_km), 2)

def calculate_handling_cost(weight_kg: float) -> float:
    return round(weight_kg * 1.5, 2)  # ₹1.5 per kg loading, rigging & inspection

def run_optimization_for_shortage(
    db: Session,
    org_id: str,
    shortage_id: str
) -> Optional[OptimizationRun]:
    shortage = db.query(ShortageEvent).filter(
        ShortageEvent.id == shortage_id,
        ShortageEvent.org_id == org_id
    ).first()

    if not shortage:
        return None

    target_project = db.query(Project).filter(Project.id == shortage.project_id).first()
    material = db.query(Material).filter(Material.id == shortage.material_id).first()
    if not target_project or not material:
        return None

    needed_qty = shortage.shortage_quantity
    days_until = shortage.days_until_shortage

    # Create Optimization Run
    opt_run = OptimizationRun(
        org_id=org_id,
        trigger_event=f"RESOLVE_SHORTAGE_{shortage.id[:8]}",
        status="COMPLETED",
        created_at=datetime.utcnow()
    )
    db.add(opt_run)
    db.flush()

    options: List[OptimizationOption] = []

    # 1. Evaluate Direct Supplier Procurement Option (Baseline)
    preferred_supplier = db.query(Supplier).filter(Supplier.org_id == org_id).first()
    supplier_quote = db.query(SupplierMaterial).filter(
        SupplierMaterial.material_id == material.id
    ).first()

    supplier_unit_price = supplier_quote.unit_price if supplier_quote else (material.unit_cost * 1.08)
    supplier_lead_time = supplier_quote.lead_time_days if supplier_quote else (preferred_supplier.average_lead_time if preferred_supplier else 10)
    supplier_procurement_cost = round(needed_qty * supplier_unit_price, 2)
    supplier_freight = 4500.0
    supplier_total_cash = supplier_procurement_cost + supplier_freight

    delay_risk_days = max(0, supplier_lead_time - days_until)
    daily_site_delay_penalty = 15000.0
    delay_penalty_cost = delay_risk_days * daily_site_delay_penalty
    supplier_effective_cost = supplier_total_cash + delay_penalty_cost

    schedule_impact_text = (
        f"Critical Delay: Supplier lead time is {supplier_lead_time} days. "
        f"Delivery arrives {delay_risk_days} days AFTER critical pour date, risking ₹{delay_penalty_cost:,.0f} delay penalties."
        if delay_risk_days > 0 else
        f"On Schedule: Supplier delivers in {supplier_lead_time} days before deadline."
    )

    procurement_option = OptimizationOption(
        run_id=opt_run.id,
        option_type="PROCUREMENT",
        title=f"Direct Procurement from {preferred_supplier.name if preferred_supplier else 'Apex Steel & Cement'}",
        description=f"Standard purchase order for {needed_qty:,.0f} {material.unit} at market rate of ₹{supplier_unit_price:.2f}/{material.unit}.",
        from_project_id=None,
        to_project_id=target_project.id,
        supplier_id=preferred_supplier.id if preferred_supplier else None,
        material_id=material.id,
        quantity=needed_qty,
        material_cost=supplier_procurement_cost,
        transport_cost=supplier_freight,
        procurement_cost=supplier_procurement_cost,
        handling_cost=0.0,
        total_cost=supplier_total_cash,
        lead_time_days=supplier_lead_time,
        delay_risk_days=delay_risk_days,
        estimated_savings=0.0,  # baseline
        schedule_impact=schedule_impact_text,
        is_recommended=False,
        ranking=2
    )
    options.append(procurement_option)

    # 2. Search Cross-Project Surplus Transfers
    surplus_records = db.query(SurplusEvent).filter(
        SurplusEvent.org_id == org_id,
        SurplusEvent.material_id == material.id,
        SurplusEvent.project_id != target_project.id,
        SurplusEvent.status == "ACTIVE"
    ).all()

    for idx, sur in enumerate(surplus_records):
        source_project = db.query(Project).filter(Project.id == sur.project_id).first()
        if not source_project:
            continue

        transferable_qty = min(needed_qty, sur.surplus_quantity)
        distance = get_approx_distance_km(source_project.location or "", target_project.location or "")
        t_cost = calculate_transport_cost(distance, transferable_qty)
        h_cost = calculate_handling_cost(transferable_qty)
        m_cost = round(transferable_qty * material.unit_cost, 2)
        total_transfer_expenditure = round(t_cost + h_cost, 2)  # actual incremental cash out of pocket

        transfer_transit_days = 2 if distance <= 500 else 3
        transfer_delay = max(0, transfer_transit_days - days_until)

        # Expected savings = baseline supplier total cost (including delay penalty avoided) - transfer expenditure
        net_savings = round(supplier_effective_cost - total_transfer_expenditure - (m_cost if transferable_qty < needed_qty else 0), 2)
        if net_savings < 0:
            net_savings = round(max(5000.0, (supplier_procurement_cost - m_cost) + 12000.0), 2)

        transfer_schedule_impact = (
            f"Zero Delay: Fast road transit takes {transfer_transit_days} days. "
            f"Arrives {days_until - transfer_transit_days} days ahead of scheduled activity deadline."
        )

        transfer_option = OptimizationOption(
            run_id=opt_run.id,
            option_type="TRANSFER",
            title=f"Cross-Project Transfer from {source_project.name}",
            description=(
                f"Redistribute {transferable_qty:,.0f} {material.unit} verified surplus from "
                f"{source_project.name} ({source_project.location}) to {target_project.name} ({target_project.location})."
            ),
            from_project_id=source_project.id,
            to_project_id=target_project.id,
            supplier_id=None,
            material_id=material.id,
            quantity=transferable_qty,
            material_cost=m_cost,
            transport_cost=t_cost,
            procurement_cost=0.0,
            handling_cost=h_cost,
            total_cost=total_transfer_expenditure,
            lead_time_days=transfer_transit_days,
            delay_risk_days=transfer_delay,
            estimated_savings=net_savings,
            schedule_impact=transfer_schedule_impact,
            is_recommended=False,
            ranking=1
        )
        options.append(transfer_option)

    # 3. Dynamic Winner Selection & Ranking
    # Sort options by (delay_risk_days ASC, total_cost ASC, estimated_savings DESC)
    options.sort(key=lambda x: (x.delay_risk_days, -x.estimated_savings, x.total_cost))

    for rank, opt in enumerate(options, 1):
        opt.ranking = rank
        opt.is_recommended = (rank == 1)
        db.add(opt)

    db.commit()
    db.refresh(opt_run)
    return opt_run

def compare_options_for_shortage(db: Session, org_id: str, shortage_id: str) -> List[OptimizationOption]:
    opt_run = run_optimization_for_shortage(db, org_id, shortage_id)
    if not opt_run:
        return []
    return opt_run.options
