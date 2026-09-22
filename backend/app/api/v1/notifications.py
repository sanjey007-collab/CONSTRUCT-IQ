from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Notification, User
from app.schemas.schemas import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.org_id == current_user.org_id
    ).order_by(Notification.created_at.desc()).limit(30).all()
    return notifs

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.org_id == current_user.org_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
