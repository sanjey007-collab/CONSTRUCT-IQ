from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import AuditLog, User
from app.schemas.schemas import AuditLogResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    entity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.org_id == current_user.org_id)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
