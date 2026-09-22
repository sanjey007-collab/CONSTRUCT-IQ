import pytest
from app.core.database import SessionLocal
from app.models.entities import Organization, Project, Material
from app.services.forecast_service import compute_material_forecast, calculate_average_daily_consumption

def test_daily_consumption_calculation():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        proj = db.query(Project).filter(Project.name.like("%Madurai%")).first()
        mat = db.query(Material).filter(Material.material_name.like("%TMT%")).first()
        
        daily_rate = calculate_average_daily_consumption(db, org.id, proj.id, mat.id, lookback_days=30)
        assert daily_rate > 0
    finally:
        db.close()

def test_multi_horizon_forecasting():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        proj = db.query(Project).filter(Project.name.like("%Madurai%")).first()
        mat = db.query(Material).filter(Material.material_name.like("%TMT%")).first()

        fc = compute_material_forecast(db, org.id, proj.id, mat.id)
        assert fc is not None
        assert "7d" in fc.forecasts
        assert "14d" in fc.forecasts
        assert "30d" in fc.forecasts
        assert "60d" in fc.forecasts
        
        # In Madurai, required quantity is 1400 in 7 days while inventory is 0, so 7d shortage should be flagged
        assert fc.forecasts["7d"].projected_shortage >= 1400.0
    finally:
        db.close()
