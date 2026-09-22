from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.entities import OrgPolicy, Material, AutonomyLevelEnum

def get_org_policy(db: Session, org_id: str) -> OrgPolicy:
    policy = db.query(OrgPolicy).filter(OrgPolicy.org_id == org_id).first()
    if not policy:
        policy = OrgPolicy(
            org_id=org_id,
            max_autonomous_procurement=25000.0,
            max_autonomous_transfer=50000.0,
            require_approval_new_supplier=True,
            require_approval_safety_critical=True,
            separation_of_duties=True
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

def evaluate_action_policy(
    db: Session,
    org_id: str,
    action_type: str,  # "TRANSFER" or "PROCUREMENT" or "ANALYSIS"
    amount: float,
    material_id: str,
    is_new_supplier: bool = False,
    confidence: float = 0.95
) -> Tuple[str, bool, str]:
    """
    Evaluates policy and returns:
    (policy_status: GREEN|YELLOW|RED, approval_required: bool, rationale: str)
    """
    if action_type == "ANALYSIS":
        return AutonomyLevelEnum.GREEN.value, False, "Analysis and forecasting are fully autonomous under Green policy."

    policy = get_org_policy(db, org_id)
    material = db.query(Material).filter(Material.id == material_id).first()
    is_safety_critical = material.is_safety_critical if material else False

    # Check RED conditions first (Human only)
    if is_new_supplier and policy.require_approval_new_supplier:
        return (
            AutonomyLevelEnum.RED.value,
            True,
            "Red Flag: Supplier has no verified transaction history. Requires senior executive approval."
        )

    if confidence < 0.75:
        return (
            AutonomyLevelEnum.RED.value,
            True,
            f"Red Flag: Confidence score ({confidence*100:.0f}%) is below organization threshold (75%)."
        )

    if action_type == "PROCUREMENT":
        if amount > policy.max_autonomous_procurement:
            return (
                AutonomyLevelEnum.RED.value,
                True,
                f"Red Flag: Estimated procurement value (₹{amount:,.2f}) exceeds autonomous limit of ₹{policy.max_autonomous_procurement:,.2f}."
            )
        elif is_safety_critical and policy.require_approval_safety_critical:
            return (
                AutonomyLevelEnum.YELLOW.value,
                True,
                "Yellow Flag: Safety-critical material procurement requires Procurement Manager verification."
            )
        else:
            return (
                AutonomyLevelEnum.YELLOW.value,
                True,
                f"Yellow Policy: Procurement order of ₹{amount:,.2f} is within threshold but requires procurement confirmation."
            )

    elif action_type == "TRANSFER":
        if amount > policy.max_autonomous_transfer:
            return (
                AutonomyLevelEnum.RED.value,
                True,
                f"Red Flag: Transfer logistics value (₹{amount:,.2f}) exceeds transfer threshold of ₹{policy.max_autonomous_transfer:,.2f}."
            )
        else:
            return (
                AutonomyLevelEnum.YELLOW.value,
                True,
                f"Yellow Policy: Cross-project transfer of ₹{amount:,.2f} requires dual Project Manager authorization."
            )

    return AutonomyLevelEnum.YELLOW.value, True, "Standard operational policy: human approval required."
