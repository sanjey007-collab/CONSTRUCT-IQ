from fastapi import APIRouter
from app.api.v1 import (
    auth, organizations, projects, materials, inventory, forecast,
    shortages, surplus, optimization, agent, approvals, procurement,
    suppliers, analytics, notifications, audit_logs, data_import, demo
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials Master"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["Forecasting"])
api_router.include_router(shortages.router, prefix="/shortages", tags=["Shortage Detection"])
api_router.include_router(surplus.router, prefix="/surplus", tags=["Surplus Detection"])
api_router.include_router(optimization.router, prefix="/optimization", tags=["Cross-Project Optimization"])
api_router.include_router(agent.router, prefix="/agent", tags=["AI Operations Agent"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["Approval Center"])
api_router.include_router(procurement.router, prefix="/procurement", tags=["Procurement"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & ROI"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-log", tags=["Audit Trail"])
api_router.include_router(data_import.router, prefix="/data-import", tags=["Data Import"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo Management"])
