from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import OptimizationRun, OptimizationOption, Project, Material, Supplier, User
from app.schemas.schemas import OptimizationOptionResponse, OptimizationRunResponse
from app.api.deps import get_current_user
from app.services.optimization_service import run_optimization_for_shortage

router = APIRouter()

@router.get("/compare/{shortage_id}", response_model=OptimizationRunResponse)
def compare_shortage_options(
    shortage_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    opt_run = run_optimization_for_shortage(db, current_user.org_id, shortage_id)
    if not opt_run:
        raise HTTPException(status_code=404, detail="Could not calculate options for shortage.")

    formatted_options = []
    for opt in opt_run.options:
        from_name = db.query(Project.name).filter(Project.id == opt.from_project_id).scalar() if opt.from_project_id else None
        to_name = db.query(Project.name).filter(Project.id == opt.to_project_id).scalar() if opt.to_project_id else None
        sup_name = db.query(Supplier.name).filter(Supplier.id == opt.supplier_id).scalar() if opt.supplier_id else None
        mat_name = db.query(Material.material_name).filter(Material.id == opt.material_id).scalar() if opt.material_id else None

        formatted_options.append(OptimizationOptionResponse(
            id=opt.id,
            run_id=opt.run_id,
            option_type=opt.option_type,
            title=opt.title,
            description=opt.description,
            from_project_id=opt.from_project_id,
            from_project_name=from_name,
            to_project_id=opt.to_project_id,
            to_project_name=to_name,
            supplier_id=opt.supplier_id,
            supplier_name=sup_name,
            material_id=opt.material_id,
            material_name=mat_name,
            quantity=opt.quantity,
            material_cost=opt.material_cost,
            transport_cost=opt.transport_cost,
            procurement_cost=opt.procurement_cost,
            handling_cost=opt.handling_cost,
            total_cost=opt.total_cost,
            lead_time_days=opt.lead_time_days,
            delay_risk_days=opt.delay_risk_days,
            estimated_savings=opt.estimated_savings,
            schedule_impact=opt.schedule_impact,
            is_recommended=opt.is_recommended,
            ranking=opt.ranking
        ))

    return OptimizationRunResponse(
        id=opt_run.id,
        trigger_event=opt_run.trigger_event,
        status=opt_run.status,
        created_at=opt_run.created_at,
        options=formatted_options
    )
