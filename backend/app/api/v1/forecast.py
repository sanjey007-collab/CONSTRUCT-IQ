from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import User
from app.schemas.schemas import MaterialForecastResponse
from app.api.deps import get_current_user
from app.services.forecast_service import compute_material_forecast, get_all_forecasts

router = APIRouter()

@router.get("", response_model=List[MaterialForecastResponse])
def get_forecasts(
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_all_forecasts(db, current_user.org_id, project_id)

@router.get("/{project_id}/{material_id}", response_model=MaterialForecastResponse)
def get_single_forecast(
    project_id: str,
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = compute_material_forecast(db, current_user.org_id, project_id, material_id)
    if not res:
        raise HTTPException(status_code=404, detail="Forecast could not be calculated for this project/material.")
    return res
