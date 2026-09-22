from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, Base, engine
from app.seed_demo_data import seed_database
from app.api.deps import get_current_user
from app.models.entities import User

router = APIRouter()

@router.post("/reset")
def reset_demo_state(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cleans and re-seeds all demo construction projects, materials, inventories,
    shortages, surplus, and agent decisions back to the pristine Hero Demo state.
    """
    seed_database(db)
    return {
        "status": "SUCCESS",
        "message": "Demo data successfully reset to baseline Hero Scenario.",
        "active_scenario": "Madurai Raft Casting Shortage vs Chennai Surplus Redistribution"
    }
