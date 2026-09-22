from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import (
    ShortageEvent, SurplusEvent, Inventory, Material, Project, ProjectRequirement,
    ScheduleActivity, SeverityEnum
)

def scan_and_update_shortages(db: Session, org_id: str) -> List[ShortageEvent]:
    """
    Scans upcoming project requirements against current available and incoming inventory.
    Generates and updates ShortageEvent records.
    """
    now = datetime.utcnow()
    requirements = db.query(ProjectRequirement)\
        .join(Project, ProjectRequirement.project_id == Project.id)\
        .join(Material, ProjectRequirement.material_id == Material.id)\
        .filter(
            ProjectRequirement.org_id == org_id,
            ProjectRequirement.status.in_(["UNMET", "PARTIAL"]),
            Project.status == "ACTIVE"
        ).all()

    shortages = []

    for req in requirements:
        material = db.query(Material).filter(Material.id == req.material_id).first()
        inventory = db.query(Inventory).filter(
            Inventory.org_id == org_id,
            Inventory.project_id == req.project_id,
            Inventory.material_id == req.material_id
        ).first()

        available = inventory.available_quantity if inventory else 0.0
        incoming = inventory.incoming_quantity if inventory else 0.0
        total_effective = available + incoming

        if total_effective < req.required_quantity:
            shortage_qty = round(req.required_quantity - total_effective, 2)
            days_until = max(0, (req.required_by_date - now).days)
            
            # Severity logic
            if days_until <= 7 or shortage_qty >= 1000:
                severity = SeverityEnum.CRITICAL.value
                schedule_risk = "High Schedule Risk: 3-5 days critical activity stoppage"
            elif days_until <= 14:
                severity = SeverityEnum.HIGH.value
                schedule_risk = "Moderate Schedule Risk: 1-2 days buffer compression"
            elif days_until <= 30:
                severity = SeverityEnum.MEDIUM.value
                schedule_risk = "Low Risk: procurement window open"
            else:
                severity = SeverityEnum.LOW.value
                schedule_risk = "Informational: future planning horizon"

            financial_impact = round(shortage_qty * (material.unit_cost if material else 50.0) * 1.25, 2)

            # Check if event already exists
            event = db.query(ShortageEvent).filter(
                ShortageEvent.org_id == org_id,
                ShortageEvent.project_id == req.project_id,
                ShortageEvent.material_id == req.material_id,
                ShortageEvent.status == "OPEN"
            ).first()

            if not event:
                event = ShortageEvent(
                    org_id=org_id,
                    project_id=req.project_id,
                    material_id=req.material_id,
                    required_quantity=req.required_quantity,
                    available_quantity=total_effective,
                    shortage_quantity=shortage_qty,
                    required_by_date=req.required_by_date,
                    days_until_shortage=days_until,
                    estimated_financial_impact=financial_impact,
                    schedule_risk=schedule_risk,
                    severity=severity,
                    status="OPEN"
                )
                db.add(event)
            else:
                event.required_quantity = req.required_quantity
                event.available_quantity = total_effective
                event.shortage_quantity = shortage_qty
                event.days_until_shortage = days_until
                event.estimated_financial_impact = financial_impact
                event.schedule_risk = schedule_risk
                event.severity = severity

            shortages.append(event)

    db.commit()
    return shortages

def scan_and_update_surplus(db: Session, org_id: str) -> List[SurplusEvent]:
    """
    Scans project inventories to identify materials where projected inventory exceeds
    the required quantity plus the required safety stock.
    """
    now = datetime.utcnow()
    horizon_30d = now + timedelta(days=30)
    inventories = db.query(Inventory)\
        .join(Project, Inventory.project_id == Project.id)\
        .join(Material, Inventory.material_id == Material.id)\
        .filter(
            Inventory.org_id == org_id,
            Project.status == "ACTIVE"
        ).all()

    surplus_list = []

    for inv in inventories:
        material = inv.material
        if not material:
            continue

        available = inv.available_quantity
        if available <= material.safety_stock:
            continue

        # Calculate upcoming requirement for this project within 30 days
        future_req = db.query(func.sum(ProjectRequirement.required_quantity))\
            .filter(
                ProjectRequirement.org_id == org_id,
                ProjectRequirement.project_id == inv.project_id,
                ProjectRequirement.material_id == inv.material_id,
                ProjectRequirement.required_by_date <= horizon_30d,
                ProjectRequirement.status.in_(["UNMET", "PARTIAL"])
            ).scalar() or 0.0

        surplus_buffer = future_req + material.safety_stock
        if available > surplus_buffer:
            surplus_qty = round(available - surplus_buffer, 2)
            if surplus_qty > 50:  # Minimum threshold for actionable surplus
                val = round(surplus_qty * material.unit_cost, 2)

                # Identify potential destination projects in org needing this material
                dest_projects = []
                dest_reqs = db.query(ProjectRequirement)\
                    .join(Project, ProjectRequirement.project_id == Project.id)\
                    .filter(
                        ProjectRequirement.org_id == org_id,
                        ProjectRequirement.project_id != inv.project_id,
                        ProjectRequirement.material_id == inv.material_id,
                        ProjectRequirement.status.in_(["UNMET", "PARTIAL"])
                    ).all()

                for d in dest_reqs:
                    dest_projects.append({
                        "project_id": d.project_id,
                        "project_name": d.activity.project.name if d.activity else "Active Project",
                        "needed_quantity": d.required_quantity,
                        "required_by": d.required_by_date.strftime("%Y-%m-%d")
                    })

                event = db.query(SurplusEvent).filter(
                    SurplusEvent.org_id == org_id,
                    SurplusEvent.project_id == inv.project_id,
                    SurplusEvent.material_id == inv.material_id,
                    SurplusEvent.status == "ACTIVE"
                ).first()

                if not event:
                    event = SurplusEvent(
                        org_id=org_id,
                        project_id=inv.project_id,
                        material_id=inv.material_id,
                        surplus_quantity=surplus_qty,
                        value=val,
                        expected_surplus_date=now + timedelta(days=1),
                        confidence=0.96,
                        possible_destination_projects=dest_projects,
                        status="ACTIVE"
                    )
                    db.add(event)
                else:
                    event.surplus_quantity = surplus_qty
                    event.value = val
                    event.possible_destination_projects = dest_projects

                surplus_list.append(event)

    db.commit()
    return surplus_list
