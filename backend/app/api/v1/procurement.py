from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import PurchaseOrder, Project, Supplier, Material, User, POStatusEnum
from app.schemas.schemas import PurchaseOrderResponse, PurchaseOrderCreate
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_action

router = APIRouter()

@router.get("/orders", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(PurchaseOrder).filter(PurchaseOrder.org_id == current_user.org_id).order_by(PurchaseOrder.order_date.desc()).all()
    results = []
    for po in orders:
        p_name = db.query(Project.name).filter(Project.id == po.project_id).scalar()
        s_name = db.query(Supplier.name).filter(Supplier.id == po.supplier_id).scalar()
        m_name = db.query(Material.material_name).filter(Material.id == po.material_id).scalar()
        results.append(PurchaseOrderResponse(
            id=po.id,
            po_number=po.po_number,
            project_id=po.project_id,
            project_name=p_name,
            supplier_id=po.supplier_id,
            supplier_name=s_name,
            material_id=po.material_id,
            material_name=m_name,
            quantity=po.quantity,
            unit_price=po.unit_price,
            total_cost=po.total_cost,
            order_date=po.order_date,
            expected_delivery_date=po.expected_delivery_date,
            status=po.status,
            created_by=po.created_by,
            approved_by=po.approved_by,
            notes=po.notes
        ))
    return results

@router.post("/orders", response_model=PurchaseOrderResponse)
def create_purchase_order(
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(require_roles("ADMIN", "PROCUREMENT_MANAGER")),
    db: Session = Depends(get_db)
):
    po_num = f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    total = round(po_in.quantity * po_in.unit_price, 2)
    po = PurchaseOrder(
        org_id=current_user.org_id,
        po_number=po_num,
        project_id=po_in.project_id,
        supplier_id=po_in.supplier_id,
        material_id=po_in.material_id,
        quantity=po_in.quantity,
        unit_price=po_in.unit_price,
        total_cost=total,
        expected_delivery_date=po_in.expected_delivery_date,
        status=POStatusEnum.APPROVED.value,
        created_by=current_user.full_name,
        notes=po_in.notes
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    log_action(db, current_user.org_id, "CREATE_PURCHASE_ORDER", "PurchaseOrder", po.id, user_id=current_user.id, user_name=current_user.full_name)
    return list_purchase_orders(current_user=current_user, db=db)[0]
