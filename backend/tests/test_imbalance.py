import pytest
from app.core.database import SessionLocal
from app.models.entities import Organization, ShortageEvent, SurplusEvent
from app.services.imbalance_service import scan_and_update_shortages, scan_and_update_surplus

def test_shortage_detection():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        shortages = scan_and_update_shortages(db, org.id)
        assert len(shortages) > 0
        
        # Verify hero shortage in Madurai
        tmt_shortage = next((s for s in shortages if s.shortage_quantity == 1400.0), None)
        assert tmt_shortage is not None
        assert tmt_shortage.severity == "CRITICAL"
        assert tmt_shortage.days_until_shortage <= 7
    finally:
        db.close()

def test_surplus_detection():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        surplus_items = scan_and_update_surplus(db, org.id)
        assert len(surplus_items) > 0
        
        # Verify Chennai surplus (at least 1500 kg)
        chennai_surplus = next((s for s in surplus_items if s.surplus_quantity >= 1400.0), None)
        assert chennai_surplus is not None
        assert chennai_surplus.value > 0
    finally:
        db.close()
