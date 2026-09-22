from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import (
    Material, Inventory, ConsumptionRecord, ScheduleActivity, ProjectRequirement, Project
)
from app.schemas.schemas import ForecastItem, MaterialForecastResponse

def calculate_average_daily_consumption(
    db: Session,
    org_id: str,
    project_id: str,
    material_id: str,
    lookback_days: int = 30
) -> float:
    """Calculates historical daily consumption rate for a material on a project."""
    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    total = db.query(func.sum(ConsumptionRecord.quantity_consumed))\
        .filter(
            ConsumptionRecord.org_id == org_id,
            ConsumptionRecord.project_id == project_id,
            ConsumptionRecord.material_id == material_id,
            ConsumptionRecord.date >= cutoff
        ).scalar()
    
    if not total or total <= 0:
        # Fallback to material minimum daily rate if no history recorded yet
        material = db.query(Material).filter(Material.id == material_id).first()
        return (material.safety_stock / 15.0) if material else 10.0
    
    return float(total) / float(lookback_days)

def get_activity_demand_factor(
    db: Session,
    org_id: str,
    project_id: str,
    material_id: str,
    horizon_days: int
) -> float:
    """
    Computes an activity multiplier based on active schedule activities requiring this material
    within the upcoming horizon window.
    """
    now = datetime.utcnow()
    horizon_date = now + timedelta(days=horizon_days)

    active_count = db.query(ScheduleActivity)\
        .join(ProjectRequirement, ScheduleActivity.id == ProjectRequirement.activity_id)\
        .filter(
            ScheduleActivity.org_id == org_id,
            ScheduleActivity.project_id == project_id,
            ProjectRequirement.material_id == material_id,
            ScheduleActivity.start_date <= horizon_date,
            ScheduleActivity.end_date >= now,
            ScheduleActivity.status != "COMPLETED"
        ).count()

    if active_count == 0:
        return 0.85  # baseline maintenance consumption
    elif active_count == 1:
        return 1.15  # normal construction load
    elif active_count == 2:
        return 1.45  # high concurrent activity load
    else:
        return 1.75  # peak activity acceleration

def compute_material_forecast(
    db: Session,
    org_id: str,
    project_id: str,
    material_id: str
) -> Optional[MaterialForecastResponse]:
    material = db.query(Material).filter(Material.id == material_id).first()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not material or not project:
        return None

    inventory = db.query(Inventory).filter(
        Inventory.org_id == org_id,
        Inventory.project_id == project_id,
        Inventory.material_id == material_id
    ).first()

    current_qty = inventory.current_quantity if inventory else 0.0
    incoming_qty = inventory.incoming_quantity if inventory else 0.0
    reserved_qty = inventory.reserved_quantity if inventory else 0.0
    damaged_qty = inventory.damaged_quantity if inventory else 0.0
    available_qty = max(0.0, current_qty - reserved_qty - damaged_qty)

    daily_rate = calculate_average_daily_consumption(db, org_id, project_id, material_id)
    horizons = [7, 14, 30, 60]
    forecast_results: Dict[str, ForecastItem] = {}

    now = datetime.utcnow()

    for h in horizons:
        horizon_end = now + timedelta(days=h)
        factor = get_activity_demand_factor(db, org_id, project_id, material_id, h)
        projected_consumption = round(daily_rate * h * factor, 2)
        
        # Scheduled upcoming requirements within horizon
        required_in_window = db.query(func.sum(ProjectRequirement.required_quantity))\
            .filter(
                ProjectRequirement.org_id == org_id,
                ProjectRequirement.project_id == project_id,
                ProjectRequirement.material_id == material_id,
                ProjectRequirement.required_by_date <= horizon_end,
                ProjectRequirement.status.in_(["UNMET", "PARTIAL"])
            ).scalar() or 0.0

        projected_inventory = round(available_qty + incoming_qty - projected_consumption, 2)
        
        # Shortage is when projected inventory falls below the required demand
        if projected_inventory < required_in_window:
            projected_shortage = round(required_in_window - max(0.0, projected_inventory), 2)
        else:
            projected_shortage = 0.0

        # Excess inventory is inventory remaining above requirements and safety stock
        surplus_buffer = required_in_window + material.safety_stock
        if projected_inventory > surplus_buffer:
            excess_inventory = round(projected_inventory - surplus_buffer, 2)
        else:
            excess_inventory = 0.0

        if projected_shortage > 0:
            status = "SHORTAGE_RISK"
        elif excess_inventory > 0:
            status = "POTENTIAL_SURPLUS"
        else:
            status = "BALANCED"

        forecast_results[f"{h}d"] = ForecastItem(
            horizon_days=h,
            projected_consumption=projected_consumption,
            projected_inventory=projected_inventory,
            projected_shortage=projected_shortage,
            excess_inventory=excess_inventory,
            status=status
        )

    return MaterialForecastResponse(
        material_id=material.id,
        material_name=material.material_name,
        project_id=project.id,
        project_name=project.name,
        unit=material.unit,
        current_inventory=available_qty,
        safety_stock=material.safety_stock,
        daily_consumption_rate=round(daily_rate, 2),
        forecasts=forecast_results
    )

def get_all_forecasts(db: Session, org_id: str, project_id: Optional[str] = None) -> List[MaterialForecastResponse]:
    query = db.query(Inventory.project_id, Inventory.material_id).filter(Inventory.org_id == org_id)
    if project_id:
        query = query.filter(Inventory.project_id == project_id)
    
    pairs = query.distinct().all()
    results = []
    for p_id, m_id in pairs:
        fc = compute_material_forecast(db, org_id, p_id, m_id)
        if fc:
            results.append(fc)
    return results
