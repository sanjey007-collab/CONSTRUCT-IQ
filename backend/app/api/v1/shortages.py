from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import ShortageEvent, Project, Material, User
from app.schemas.schemas import ShortageEventResponse
from app.api.deps import get_current_user
from app.services.imbalance_service import scan_and_update_shortages

router = APIRouter()

@router.get("", response_model=List[ShortageEventResponse])
def list_shortages(
    status: Optional[str] = Query("OPEN"),
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ShortageEvent).filter(ShortageEvent.org_id == current_user.org_id)
    if status:
        query = query.filter(ShortageEvent.status == status)
    if project_id:
        query = query.filter(ShortageEvent.project_id == project_id)

    shortages = query.order_by(ShortageEvent.days_until_shortage.asc()).all()
    results = []
    for s in shortages:
        p_name = db.query(Project.name).filter(Project.id == s.project_id).scalar()
        mat = db.query(Material).filter(Material.id == s.material_id).first()
        results.append(ShortageEventResponse(
            id=s.id,
            project_id=s.project_id,
            project_name=p_name or "Unknown",
            material_id=s.material_id,
            material_name=mat.material_name if mat else "Unknown",
            unit=mat.unit if mat else "unit",
            required_quantity=s.required_quantity,
            available_quantity=s.available_quantity,
            shortage_quantity=s.shortage_quantity,
            required_by_date=s.required_by_date,
            days_until_shortage=s.days_until_shortage,
            estimated_financial_impact=s.estimated_financial_impact,
            schedule_risk=s.schedule_risk,
            severity=s.severity,
            status=s.status,
            created_at=s.created_at
        ))
    return results

@router.post("/scan", response_model=List[ShortageEventResponse])
def trigger_shortage_scan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scan_and_update_shortages(db, current_user.org_id)
    return list_shortages(status="OPEN", project_id=None, current_user=current_user, db=db)
