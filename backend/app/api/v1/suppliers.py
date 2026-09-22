from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Supplier, User
from app.schemas.schemas import SupplierResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    suppliers = db.query(Supplier).filter(Supplier.org_id == current_user.org_id).all()
    return suppliers
