from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Material, User
from app.schemas.schemas import MaterialResponse, MaterialCreate
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_action

router = APIRouter()

@router.get("", response_model=List[MaterialResponse])
def list_materials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    materials = db.query(Material).filter(Material.org_id == current_user.org_id).all()
    return materials

@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mat = db.query(Material).filter(
        Material.id == material_id,
        Material.org_id == current_user.org_id
    ).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found.")
    return mat

@router.post("", response_model=MaterialResponse)
def create_material(
    mat_in: MaterialCreate,
    current_user: User = Depends(require_roles("ADMIN", "PROCUREMENT_MANAGER")),
    db: Session = Depends(get_db)
):
    mat = Material(
        org_id=current_user.org_id,
        material_name=mat_in.material_name,
        category=mat_in.category,
        unit=mat_in.unit,
        unit_cost=mat_in.unit_cost,
        minimum_stock=mat_in.minimum_stock,
        safety_stock=mat_in.safety_stock,
        lead_time_days=mat_in.lead_time_days,
        compatible_material_group=mat_in.compatible_material_group,
        is_safety_critical=mat_in.is_safety_critical
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    log_action(db, current_user.org_id, "CREATE_MATERIAL", "Material", mat.id, user_id=current_user.id, user_name=current_user.full_name)
    return mat
