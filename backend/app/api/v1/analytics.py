from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.entities import (
    Project, Inventory, ShortageEvent, SurplusEvent, PurchaseOrder,
    Approval, AgentDecision, TransferOrder, User
)
from app.schemas.schemas import DashboardKpis
from app.api.deps import get_current_user
from app.services.roi_service import compute_organization_roi

router = APIRouter()

@router.get("/dashboard", response_model=DashboardKpis)
def get_dashboard_kpis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.org_id
    active_projects_count = db.query(Project).filter(
        Project.org_id == org_id,
        Project.status == "ACTIVE"
    ).count()

    inventories = db.query(Inventory).filter(Inventory.org_id == org_id).all()
    total_inv_val = sum(i.current_quantity * i.unit_cost for i in inventories)

    shortages_count = db.query(ShortageEvent).filter(
        ShortageEvent.org_id == org_id,
        ShortageEvent.status == "OPEN"
    ).count()

    surplus_count = db.query(SurplusEvent).filter(
        SurplusEvent.org_id == org_id,
        SurplusEvent.status == "ACTIVE"
    ).count()

    pending_pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.org_id == org_id,
        PurchaseOrder.status.in_(["DRAFT", "PENDING_APPROVAL", "APPROVED", "ORDERED"])
    ).all()
    proc_exposure = sum(p.total_cost for p in pending_pos)

    pending_decisions = db.query(AgentDecision).filter(
        AgentDecision.org_id == org_id,
        AgentDecision.action_status == "AWAITING_APPROVAL"
    ).all()
    identified_savings = sum(d.estimated_savings for d in pending_decisions)

    completed_transfers = db.query(TransferOrder).filter(
        TransferOrder.org_id == org_id,
        TransferOrder.status.in_(["APPROVED", "IN_TRANSIT", "COMPLETED"])
    ).all()
    realized_savings = sum(t.quantity * 32.0 for t in completed_transfers)
    waste_avoided = sum(t.quantity for t in completed_transfers)

    pending_approvals = db.query(Approval).filter(
        Approval.org_id == org_id,
        Approval.status == "PENDING"
    ).count()

    return DashboardKpis(
        active_projects=active_projects_count,
        total_inventory_value=round(total_inv_val, 2),
        predicted_shortages_count=shortages_count,
        potential_surplus_count=surplus_count,
        procurement_exposure=round(proc_exposure, 2),
        estimated_savings_identified=round(identified_savings, 2),
        estimated_savings_realized=round(realized_savings, 2),
        waste_avoided_kg=round(waste_avoided, 2),
        actions_awaiting_approval=pending_approvals,
        is_demo_data=True
    )

@router.get("/roi")
def get_roi_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return compute_organization_roi(db, current_user.org_id)
