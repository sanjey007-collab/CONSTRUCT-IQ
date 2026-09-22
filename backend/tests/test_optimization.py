import pytest
from app.core.database import SessionLocal
from app.models.entities import Organization, ShortageEvent
from app.services.optimization_service import run_optimization_for_shortage

def test_cross_project_optimization_options():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        shortage = db.query(ShortageEvent).filter(
            ShortageEvent.org_id == org.id,
            ShortageEvent.shortage_quantity == 1400.0
        ).first()
        assert shortage is not None

        opt_run = run_optimization_for_shortage(db, org.id, shortage.id)
        assert opt_run is not None
        assert len(opt_run.options) >= 2

        # Check that Option 1 is Transfer and Option 2 is Procurement
        recommended = next((o for o in opt_run.options if o.is_recommended), None)
        assert recommended is not None
        assert recommended.option_type == "TRANSFER"
        assert recommended.estimated_savings > 40000.0
        assert recommended.delay_risk_days == 0

        # Direct procurement should have lead-time delay
        proc_opt = next((o for o in opt_run.options if o.option_type == "PROCUREMENT"), None)
        assert proc_opt is not None
        assert proc_opt.delay_risk_days > 0
    finally:
        db.close()
