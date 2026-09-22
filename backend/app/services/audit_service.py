from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

def log_action(
    db: Session,
    org_id: str,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_name: str = "System",
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1"
) -> AuditLog:
    audit_entry = AuditLog(
        org_id=org_id,
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id else None,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
