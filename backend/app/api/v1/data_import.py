import csv
import io
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import (
    Material, Project, Inventory, ConsumptionRecord, User
)
from app.schemas.schemas import DataImportResponse, DataImportPreviewItem
from app.api.deps import get_current_user, require_roles
from app.services.audit_service import log_action

router = APIRouter()

@router.post("/preview", response_model=DataImportResponse)
async def preview_csv_import(
    entity_type: str = Form(...),  # INVENTORY, MATERIALS, CONSUMPTION
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    
    preview_items = []
    errors = []
    row_num = 1

    for row in reader:
        row_errors = []
        is_valid = True

        if entity_type.upper() == "INVENTORY":
            if not row.get("project_name") and not row.get("project_id"):
                row_errors.append("Missing required Project reference.")
                is_valid = False
            if not row.get("material_name") and not row.get("material_id"):
                row_errors.append("Missing required Material reference.")
                is_valid = False
            try:
                qty = float(row.get("quantity", 0))
                if qty < 0:
                    row_errors.append("Quantity cannot be negative.")
                    is_valid = False
            except ValueError:
                row_errors.append("Quantity must be numeric.")
                is_valid = False

        elif entity_type.upper() == "MATERIALS":
            if not row.get("material_name"):
                row_errors.append("Material name is mandatory.")
                is_valid = False
            try:
                cost = float(row.get("unit_cost", 0))
                if cost < 0:
                    row_errors.append("Unit cost cannot be negative.")
                    is_valid = False
            except ValueError:
                row_errors.append("Unit cost must be numeric.")
                is_valid = False

        preview_items.append(DataImportPreviewItem(
            row_number=row_num,
            data=dict(row),
            is_valid=is_valid,
            errors=row_errors
        ))
        row_num += 1

    valid_c = sum(1 for p in preview_items if p.is_valid)
    return DataImportResponse(
        entity_type=entity_type.upper(),
        total_rows=len(preview_items),
        valid_rows=valid_c,
        imported_rows=0,
        errors=errors,
        preview=preview_items[:15]  # Preview first 15 rows
    )

@router.post("/execute", response_model=DataImportResponse)
async def execute_csv_import(
    entity_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles("ADMIN", "PROCUREMENT_MANAGER")),
    db: Session = Depends(get_db)
):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    errors = []
    row_num = 1

    for row in reader:
        try:
            if entity_type.upper() == "MATERIALS":
                name = row.get("material_name")
                if not name:
                    continue
                mat = Material(
                    org_id=current_user.org_id,
                    material_name=name,
                    category=row.get("category", "General"),
                    unit=row.get("unit", "units"),
                    unit_cost=float(row.get("unit_cost", 100)),
                    minimum_stock=float(row.get("minimum_stock", 50)),
                    safety_stock=float(row.get("safety_stock", 100)),
                    lead_time_days=int(row.get("lead_time_days", 7))
                )
                db.add(mat)
                imported += 1

            elif entity_type.upper() == "CONSUMPTION":
                proj_id = row.get("project_id")
                mat_id = row.get("material_id")
                qty = float(row.get("quantity", 0))
                if proj_id and mat_id and qty > 0:
                    rec = ConsumptionRecord(
                        org_id=current_user.org_id,
                        project_id=proj_id,
                        material_id=mat_id,
                        quantity_consumed=qty,
                        recorded_by=current_user.full_name
                    )
                    db.add(rec)
                    imported += 1

            row_num += 1
        except Exception as ex:
            errors.append(f"Row {row_num}: {str(ex)}")

    db.commit()
    log_action(
        db, current_user.org_id, f"CSV_IMPORT_{entity_type.upper()}", entity_type.upper(),
        user_id=current_user.id, user_name=current_user.full_name,
        new_value={"imported_rows": imported, "total_rows": row_num - 1}
    )

    return DataImportResponse(
        entity_type=entity_type.upper(),
        total_rows=row_num - 1,
        valid_rows=imported,
        imported_rows=imported,
        errors=errors,
        preview=[]
    )
