from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Approval, AgentDecision, TransferOrder, PurchaseOrder, Inventory, InventoryTransaction,
    ShortageEvent, SurplusEvent, User, SeverityEnum, POStatusEnum, TransferStatusEnum
)
from app.schemas.schemas import ApprovalResponse, ApprovalDecisionRequest
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_action

router = APIRouter()

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Approval).filter(Approval.org_id == current_user.org_id)
    if status:
        query = query.filter(Approval.status == status)
    return query.order_by(Approval.requested_at.desc()).all()

@router.post("/{approval_id}/decide", response_model=ApprovalResponse)
def decide_approval(
    approval_id: str,
    decision_req: ApprovalDecisionRequest,
    current_user: User = Depends(require_roles("ADMIN", "PROCUREMENT_MANAGER", "PROJECT_MANAGER")),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id,
        Approval.org_id == current_user.org_id
    ).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Approval is already in {approval.status} status.")

    now = datetime.utcnow()
    approval.status = decision_req.status
    approval.decided_at = now
    approval.decided_by = current_user.full_name
    approval.comments = decision_req.comments

    # Update associated agent decision
    agent_dec = approval.decision
    if agent_dec:
        agent_dec.action_status = "EXECUTED" if decision_req.status == "APPROVED" else decision_req.status
        agent_dec.user_approved_by = current_user.full_name

    # If APPROVED, execute the physical redistribution or order
    if decision_req.status == "APPROVED":
        details = approval.details or {}
        qty = details.get("quantity", 0.0)
        from_p = details.get("from_project_id")
        to_p = details.get("to_project_id")
        mat_id = details.get("material_id")

        if from_p and to_p and mat_id and qty > 0:
            # 1. Create Transfer Order
            transfer_num = f"TO-{now.strftime('%Y%m%d')}-01"
            transfer = TransferOrder(
                org_id=current_user.org_id,
                transfer_number=transfer_num,
                from_project_id=from_p,
                to_project_id=to_p,
                material_id=mat_id,
                quantity=qty,
                transport_cost=details.get("transport_cost", 0.0),
                handling_cost=details.get("handling_cost", 0.0),
                total_cost=approval.estimated_cost,
                estimated_days=details.get("estimated_days", 2),
                status=TransferStatusEnum.APPROVED.value,
                approval_id=approval.id
            )
            db.add(transfer)

            # 2. Adjust Inventory at Source Project (reserve/deduct)
            source_inv = db.query(Inventory).filter(
                Inventory.org_id == current_user.org_id,
                Inventory.project_id == from_p,
                Inventory.material_id == mat_id
            ).first()
            if source_inv:
                source_inv.current_quantity = max(0.0, source_inv.current_quantity - qty)
                source_inv.last_updated = now
                tx_out = InventoryTransaction(
                    org_id=current_user.org_id,
                    inventory_id=source_inv.id,
                    transaction_type="TRANSFER_OUT",
                    quantity=qty,
                    reference_id=transfer_num,
                    notes=f"Approved transfer to {to_p}"
                )
                db.add(tx_out)

            # 3. Adjust Inventory at Destination Project (mark incoming)
            dest_inv = db.query(Inventory).filter(
                Inventory.org_id == current_user.org_id,
                Inventory.project_id == to_p,
                Inventory.material_id == mat_id
            ).first()
            if dest_inv:
                dest_inv.incoming_quantity += qty
                dest_inv.last_updated = now
                tx_in = InventoryTransaction(
                    org_id=current_user.org_id,
                    inventory_id=dest_inv.id,
                    transaction_type="TRANSFER_INCOMING",
                    quantity=qty,
                    reference_id=transfer_num,
                    notes=f"In-transit arrival from {from_p}"
                )
                db.add(tx_in)

            # 4. Resolve Shortage Event
            shortage = db.query(ShortageEvent).filter(
                ShortageEvent.org_id == current_user.org_id,
                ShortageEvent.project_id == to_p,
                ShortageEvent.material_id == mat_id,
                ShortageEvent.status == "OPEN"
            ).first()
            if shortage:
                shortage.status = "RESOLVED"
                shortage.resolved_at = now

            # 5. Update Surplus Event
            surplus = db.query(SurplusEvent).filter(
                SurplusEvent.org_id == current_user.org_id,
                SurplusEvent.project_id == from_p,
                SurplusEvent.material_id == mat_id,
                SurplusEvent.status == "ACTIVE"
            ).first()
            if surplus:
                surplus.surplus_quantity = max(0.0, surplus.surplus_quantity - qty)
                if surplus.surplus_quantity <= 0:
                    surplus.status = "ALLOCATED"

    db.commit()
    db.refresh(approval)

    log_action(
        db, current_user.org_id, f"DECIDE_APPROVAL_{decision_req.status}", "Approval", approval.id,
        user_id=current_user.id, user_name=current_user.full_name,
        new_value={"status": decision_req.status, "comments": decision_req.comments}
    )

    return approval
