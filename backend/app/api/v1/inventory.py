from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Inventory, Project, Site, Material, User, InventoryTransaction
from app.schemas.schemas import InventoryResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[InventoryResponse])
def list_inventory(
    project_id: Optional[str] = Query(None),
    material_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inventory).filter(Inventory.org_id == current_user.org_id)
    if project_id:
        query = query.filter(Inventory.project_id == project_id)
    if material_id:
        query = query.filter(Inventory.material_id == material_id)

    items = query.all()
    results = []
    for inv in items:
        mat = inv.material
        proj = inv.project
        site = inv.site
        val = inv.current_quantity * inv.unit_cost
        results.append(InventoryResponse(
            id=inv.id,
            org_id=inv.org_id,
            project_id=inv.project_id,
            project_name=proj.name if proj else "Unknown",
            site_id=inv.site_id,
            site_name=site.name if site else "Unknown",
            material_id=inv.material_id,
            material_name=mat.material_name if mat else "Unknown",
            category=mat.category if mat else "General",
            unit=mat.unit if mat else "unit",
            current_quantity=inv.current_quantity,
            reserved_quantity=inv.reserved_quantity,
            incoming_quantity=inv.incoming_quantity,
            damaged_quantity=inv.damaged_quantity,
            available_quantity=inv.available_quantity,
            unit_cost=inv.unit_cost,
            inventory_value=round(val, 2),
            safety_stock=mat.safety_stock if mat else 100.0,
            last_updated=inv.last_updated
        ))
    return results
