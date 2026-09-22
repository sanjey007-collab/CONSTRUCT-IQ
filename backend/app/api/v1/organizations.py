from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Organization, OrgPolicy, User
from app.schemas.schemas import OrganizationResponse, OrgPolicyResponse, OrgPolicyUpdate
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_action

router = APIRouter()

@router.get("", response_model=OrganizationResponse)
def get_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return org

@router.get("/policy", response_model=OrgPolicyResponse)
def get_policy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    policy = db.query(OrgPolicy).filter(OrgPolicy.org_id == current_user.org_id).first()
    if not policy:
        policy = OrgPolicy(org_id=current_user.org_id)
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.put("/policy", response_model=OrgPolicyResponse)
def update_policy(
    policy_in: OrgPolicyUpdate,
    current_user: User = Depends(require_roles("ADMIN", "FINANCE_MANAGER")),
    db: Session = Depends(get_db)
):
    policy = db.query(OrgPolicy).filter(OrgPolicy.org_id == current_user.org_id).first()
    if not policy:
        policy = OrgPolicy(org_id=current_user.org_id)
        db.add(policy)
    
    old_data = {
        "max_autonomous_procurement": policy.max_autonomous_procurement,
        "max_autonomous_transfer": policy.max_autonomous_transfer
    }

    if policy_in.max_autonomous_procurement is not None:
        policy.max_autonomous_procurement = policy_in.max_autonomous_procurement
    if policy_in.max_autonomous_transfer is not None:
        policy.max_autonomous_transfer = policy_in.max_autonomous_transfer
    if policy_in.require_approval_new_supplier is not None:
        policy.require_approval_new_supplier = policy_in.require_approval_new_supplier
    if policy_in.require_approval_safety_critical is not None:
        policy.require_approval_safety_critical = policy_in.require_approval_safety_critical
    if policy_in.separation_of_duties is not None:
        policy.separation_of_duties = policy_in.separation_of_duties

    db.commit()
    db.refresh(policy)

    log_action(
        db, current_user.org_id, "UPDATE_POLICY", "OrgPolicy", policy.id,
        user_id=current_user.id, user_name=current_user.full_name,
        old_value=old_data, new_value=policy_in.dict(exclude_unset=True)
    )
    return policy
