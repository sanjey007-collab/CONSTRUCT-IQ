from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.entities import Project, Site, ScheduleActivity, Inventory, ShortageEvent, SurplusEvent, User
from app.schemas.schemas import ProjectResponse, ProjectDetailResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.org_id == current_user.org_id).all()
    return projects

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(
        Project.id == project_id,
        Project.org_id == current_user.org_id
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")

    activities = db.query(ScheduleActivity).filter(ScheduleActivity.project_id == project_id).all()
    inv_items = db.query(Inventory).filter(Inventory.project_id == project_id).all()
    total_val = sum(i.current_quantity * i.unit_cost for i in inv_items)
    shortages_c = db.query(ShortageEvent).filter(
        ShortageEvent.project_id == project_id,
        ShortageEvent.status == "OPEN"
    ).count()
    surplus_c = db.query(SurplusEvent).filter(
        SurplusEvent.project_id == project_id,
        SurplusEvent.status == "ACTIVE"
    ).count()

    return ProjectDetailResponse(
        id=proj.id,
        org_id=proj.org_id,
        name=proj.name,
        code=proj.code,
        client=proj.client,
        location=proj.location,
        start_date=proj.start_date,
        expected_completion_date=proj.expected_completion_date,
        status=proj.status,
        budget=proj.budget,
        project_manager=proj.project_manager,
        site_manager=proj.site_manager,
        sites=proj.sites,
        created_at=proj.created_at,
        schedule_activities=activities,
        inventory_count=len(inv_items),
        shortages_count=shortages_c,
        surplus_count=surplus_c,
        total_inventory_value=round(total_val, 2)
    )
