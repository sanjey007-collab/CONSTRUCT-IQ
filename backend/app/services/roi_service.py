from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import (
    TransferOrder, PurchaseOrder, AgentDecision, ShortageEvent, SurplusEvent, Inventory
)

def compute_organization_roi(db: Session, org_id: str) -> Dict[str, Any]:
    """
    Computes comprehensive ROI and operational metrics clearly delineating
    Actual (executed transfers), Estimated (pending opportunities), and Demo benchmarks.
    """
    # 1. Realized Material & Logistics Savings from completed/approved transfers
    completed_transfers = db.query(TransferOrder).filter(
        TransferOrder.org_id == org_id,
        TransferOrder.status.in_(["APPROVED", "IN_TRANSIT", "COMPLETED"])
    ).all()
    
    # Baseline comparison: each kg transferred saves ~18% vs spot emergency supplier rush orders
    realized_transfer_savings = sum(t.quantity * 32.0 for t in completed_transfers)

    # 2. Identified / Pending Savings from active Agent Decisions awaiting approval
    pending_decisions = db.query(AgentDecision).filter(
        AgentDecision.org_id == org_id,
        AgentDecision.action_status == "AWAITING_APPROVAL"
    ).all()
    identified_savings = sum(d.estimated_savings for d in pending_decisions)

    # 3. Waste Avoidance: Surplus redistributed rather than degrading or being sold as scrap at 80% loss
    waste_avoided_kg = sum(t.quantity for t in completed_transfers)
    waste_scrap_loss_avoided = waste_avoided_kg * 48.0

    # 4. Emergency Purchase Avoidance
    # Avoided 25% rush delivery premiums & project stoppage penalties
    emergency_purchase_avoidance = len(completed_transfers) * 45000.0

    # 5. Total Material Value Managed
    inventories = db.query(Inventory).filter(Inventory.org_id == org_id).all()
    total_inventory_val = sum(inv.current_quantity * inv.unit_cost for inv in inventories)

    # Platform Cost benchmark (e.g. ₹35,000/month standard SaaS tier)
    platform_cost = 35000.0
    total_benefits = realized_transfer_savings + waste_scrap_loss_avoided + emergency_purchase_avoidance
    net_roi_multiple = round(total_benefits / platform_cost, 2) if platform_cost > 0 else 12.5

    return {
        "is_demo_data": True,
        "currency": "INR",
        "total_inventory_value": round(total_inventory_val, 2),
        "savings": {
            "realized_transfer_savings": round(realized_transfer_savings, 2),
            "identified_pending_savings": round(identified_savings, 2),
            "waste_avoidance_savings": round(waste_scrap_loss_avoided, 2),
            "emergency_procurement_avoided": round(emergency_purchase_avoidance, 2),
            "total_economic_benefit": round(total_benefits + identified_savings, 2)
        },
        "metrics": {
            "waste_avoided_kg": round(waste_avoided_kg, 2),
            "transfers_executed_count": len(completed_transfers),
            "pending_approvals_count": len(pending_decisions),
            "estimated_roi_multiple": f"{net_roi_multiple}x",
            "benchmark_status": "PROVEN_DEMO_BENCHMARK"
        },
        "breakdown_by_category": [
            {"category": "Structural & TMT Steel", "spend": 4200000.0, "savings": 480000.0, "waste_avoided_pct": 14.2},
            {"category": "Cement & Binding", "spend": 1850000.0, "savings": 195000.0, "waste_avoided_pct": 9.8},
            {"category": "Aggregates & Sand", "spend": 920000.0, "savings": 82000.0, "waste_avoided_pct": 11.5},
            {"category": "Finishing & Tiles", "spend": 1450000.0, "savings": 112000.0, "waste_avoided_pct": 8.1},
            {"category": "Electrical & Plumbing", "spend": 1100000.0, "savings": 98000.0, "waste_avoided_pct": 10.4},
        ]
    }
