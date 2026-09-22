import pytest
from app.core.database import SessionLocal
from app.models.entities import Organization, Material, AutonomyLevelEnum
from app.services.policy_service import evaluate_action_policy

def test_policy_autonomy_levels():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        mat = db.query(Material).first()

        # 1. Analysis is GREEN (Autonomous)
        status, approval, _ = evaluate_action_policy(db, org.id, "ANALYSIS", 0, mat.id)
        assert status == AutonomyLevelEnum.GREEN.value
        assert approval is False

        # 2. Moderate Transfer is YELLOW (Approval Required)
        status, approval, _ = evaluate_action_policy(db, org.id, "TRANSFER", 15000.0, mat.id)
        assert status == AutonomyLevelEnum.YELLOW.value
        assert approval is True

        # 3. Transfer exceeding limit (e.g. ₹75,000 > ₹50,000) is RED (Human Only)
        status, approval, _ = evaluate_action_policy(db, org.id, "TRANSFER", 75000.0, mat.id)
        assert status == AutonomyLevelEnum.RED.value
        assert approval is True

        # 4. New unverified supplier is RED (Human Only)
        status, approval, _ = evaluate_action_policy(db, org.id, "PROCUREMENT", 10000.0, mat.id, is_new_supplier=True)
        assert status == AutonomyLevelEnum.RED.value
        assert approval is True
    finally:
        db.close()
