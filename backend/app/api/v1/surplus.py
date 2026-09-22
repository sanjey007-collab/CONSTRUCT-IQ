from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import SurplusEvent, Project, Material, User
from app.schemas.schemas import SurplusEventResponse
from app.api.deps import get_current_user
from app.services.imbalance_service import scan_and_update_surplus

router = APIRouter()

@router.get("", response_model=List[SurplusEventResponse])
def list_surplus(
    status: Optional[str] = Query("ACTIVE"),
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SurplusEvent).filter(SurplusEvent.org_id == current_user.org_id)
    if status:
        query = query.filter(SurplusEvent.status == status)
    if project_id:
        query = query.filter(SurplusEvent.project_id == project_id)

    surplus_list = query.order_by(SurplusEvent.value.desc()).all()
    results = []
    for sur in surplus_list:
        p_name = db.query(Project.name).filter(Project.id == sur.project_id).scalar()
        mat = db.query(Material).filter(Material.id == sur.material_id).first()
        results.append(SurplusEventResponse(
            id=sur.id,
            project_id=sur.project_id,
            project_name=p_name or "Unknown",
            material_id=sur.material_id,
            material_name=mat.material_name if mat else "Unknown",
            unit=mat.unit if mat else "unit",
            surplus_quantity=sur.surplus_quantity,
            value=sur.value,
            expected_surplus_date=sur.expected_surplus_date,
            confidence=sur.confidence,
            possible_destination_projects=sur.possible_destination_projects or [],
            status=sur.status,
            created_at=sur.created_at
        ))
    return results

@router.post("/scan", response_model=List[SurplusEventResponse])
def trigger_surplus_scan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scan_and_update_surplus(db, current_user.org_id)
    return list_surplus(status="ACTIVE", project_id=None, current_user=current_user, db=db)
