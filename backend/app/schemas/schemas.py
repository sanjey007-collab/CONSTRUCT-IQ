from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

# Auth & Users
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    org_id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

# Organization & Policies
class OrgPolicyUpdate(BaseModel):
    max_autonomous_procurement: Optional[float] = None
    max_autonomous_transfer: Optional[float] = None
    require_approval_new_supplier: Optional[bool] = None
    require_approval_safety_critical: Optional[bool] = None
    separation_of_duties: Optional[bool] = None

class OrgPolicyResponse(BaseModel):
    id: str
    org_id: str
    max_autonomous_procurement: float
    max_autonomous_transfer: float
    require_approval_new_supplier: bool
    require_approval_safety_critical: bool
    separation_of_duties: bool

    class Config:
        from_attributes = True

class OrganizationResponse(BaseModel):
    id: str
    name: str
    industry: str
    currency: str
    country: str
    timezone: str
    policies: Optional[OrgPolicyResponse] = None

    class Config:
        from_attributes = True

# Sites & Projects
class SiteResponse(BaseModel):
    id: str
    project_id: str
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class ScheduleActivityResponse(BaseModel):
    id: str
    project_id: str
    activity_name: str
    start_date: datetime
    end_date: datetime
    status: str

    class Config:
        from_attributes = True

class ProjectResponse(BaseModel):
    id: str
    org_id: str
    name: str
    code: Optional[str] = None
    client: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    expected_completion_date: Optional[datetime] = None
    status: str
    budget: float
    project_manager: Optional[str] = None
    site_manager: Optional[str] = None
    sites: List[SiteResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    schedule_activities: List[ScheduleActivityResponse] = []
    inventory_count: int = 0
    shortages_count: int = 0
    surplus_count: int = 0
    total_inventory_value: float = 0.0

# Materials
class MaterialCreate(BaseModel):
    material_name: str
    category: str
    unit: str
    unit_cost: float = Field(..., ge=0)
    minimum_stock: float = Field(default=100.0, ge=0)
    safety_stock: float = Field(default=200.0, ge=0)
    lead_time_days: int = Field(default=7, ge=1)
    compatible_material_group: str = "Standard"
    is_safety_critical: bool = False

class MaterialResponse(BaseModel):
    id: str
    org_id: str
    material_name: str
    category: str
    unit: str
    unit_cost: float
    minimum_stock: float
    safety_stock: float
    preferred_supplier_id: Optional[str] = None
    lead_time_days: int
    compatible_material_group: str
    is_safety_critical: bool

    class Config:
        from_attributes = True

# Inventory
class InventoryResponse(BaseModel):
    id: str
    org_id: str
    project_id: str
    project_name: Optional[str] = None
    site_id: str
    site_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_quantity: float
    reserved_quantity: float
    incoming_quantity: float
    damaged_quantity: float
    available_quantity: float
    unit_cost: float
    inventory_value: float
    safety_stock: float
    last_updated: datetime

    class Config:
        from_attributes = True

# Forecast
class ForecastItem(BaseModel):
    horizon_days: int
    projected_consumption: float
    projected_inventory: float
    projected_shortage: float
    excess_inventory: float
    status: str

class MaterialForecastResponse(BaseModel):
    material_id: str
    material_name: str
    project_id: str
    project_name: str
    unit: str
    current_inventory: float
    safety_stock: float
    daily_consumption_rate: float
    forecasts: Dict[str, ForecastItem]  # 7d, 14d, 30d, 60d

# Imbalances
class ShortageEventResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    unit: Optional[str] = None
    required_quantity: float
    available_quantity: float
    shortage_quantity: float
    required_by_date: datetime
    days_until_shortage: int
    estimated_financial_impact: float
    schedule_risk: str
    severity: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SurplusEventResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    unit: Optional[str] = None
    surplus_quantity: float
    value: float
    expected_surplus_date: datetime
    confidence: float
    possible_destination_projects: List[Dict[str, Any]] = []
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Optimization
class OptimizationOptionResponse(BaseModel):
    id: str
    run_id: str
    option_type: str  # TRANSFER, PROCUREMENT, SPLIT
    title: str
    description: Optional[str] = None
    from_project_id: Optional[str] = None
    from_project_name: Optional[str] = None
    to_project_id: Optional[str] = None
    to_project_name: Optional[str] = None
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    quantity: float
    material_cost: float
    transport_cost: float
    procurement_cost: float
    handling_cost: float
    total_cost: float
    lead_time_days: int
    delay_risk_days: int
    estimated_savings: float
    schedule_impact: str
    is_recommended: bool
    ranking: int

    class Config:
        from_attributes = True

class OptimizationRunResponse(BaseModel):
    id: str
    trigger_event: str
    status: str
    created_at: datetime
    options: List[OptimizationOptionResponse] = []

    class Config:
        from_attributes = True

# AI Agent
class AgentToolCallResponse(BaseModel):
    id: str
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Dict[str, Any]
    status: str
    execution_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True

class AgentDecisionResponse(BaseModel):
    id: str
    agent_run_id: str
    problem_detected: str
    evidence: Dict[str, Any]
    alternatives_considered: List[Dict[str, Any]]
    selected_action: str
    calculation_summary: Dict[str, Any]
    estimated_cost: float
    estimated_savings: float
    confidence: float
    policy_status: str
    approval_required: bool
    action_status: str
    user_approved_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AgentRunResponse(BaseModel):
    id: str
    trigger_reason: str
    status: str
    started_at: datetime
    completed_at: datetime
    summary: Optional[str] = None
    tool_calls: List[AgentToolCallResponse] = []
    decisions: List[AgentDecisionResponse] = []

    class Config:
        from_attributes = True

class AgentCommandQuery(BaseModel):
    prompt: str
    project_id: Optional[str] = None
    material_id: Optional[str] = None

class AgentCommandResponse(BaseModel):
    answer: str
    reasoning: str
    sources_used: List[str]
    suggested_actions: List[Dict[str, Any]] = []
    agent_run_id: Optional[str] = None

# Approvals
class ApprovalResponse(BaseModel):
    id: str
    decision_id: str
    action_type: str
    title: str
    description: Optional[str] = None
    details: Dict[str, Any] = {}
    estimated_cost: float
    estimated_savings: float
    status: str
    requested_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True

class ApprovalDecisionRequest(BaseModel):
    status: str  # APPROVED, REJECTED, CHANGES_REQUESTED
    comments: Optional[str] = None

# Procurement
class PurchaseOrderCreate(BaseModel):
    project_id: str
    supplier_id: str
    material_id: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    expected_delivery_date: datetime
    notes: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    id: str
    po_number: str
    project_id: str
    project_name: Optional[str] = None
    supplier_id: str
    supplier_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    quantity: float
    unit_price: float
    total_cost: float
    order_date: datetime
    expected_delivery_date: datetime
    status: str
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Transfer Orders
class TransferOrderResponse(BaseModel):
    id: str
    transfer_number: str
    from_project_id: str
    from_project_name: Optional[str] = None
    to_project_id: str
    to_project_name: Optional[str] = None
    material_id: str
    material_name: Optional[str] = None
    quantity: float
    transport_cost: float
    handling_cost: float
    total_cost: float
    estimated_days: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Suppliers
class SupplierResponse(BaseModel):
    id: str
    name: str
    contact: Optional[str] = None
    location: Optional[str] = None
    rating: float
    average_lead_time: int
    payment_terms: str
    reliability_score: float
    materials_supported: List[str] = []
    is_demo: bool

    class Config:
        from_attributes = True

# Analytics & Dashboard KPIs
class DashboardKpis(BaseModel):
    active_projects: int
    total_inventory_value: float
    predicted_shortages_count: int
    potential_surplus_count: int
    procurement_exposure: float
    estimated_savings_identified: float
    estimated_savings_realized: float
    waste_avoided_kg: float
    actions_awaiting_approval: int
    is_demo_data: bool = True

# Audit & Notifications
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    severity: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: str
    user_name: str
    action: str
    entity: str
    entity_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

# Data Import
class DataImportPreviewItem(BaseModel):
    row_number: int
    data: Dict[str, Any]
    is_valid: bool
    errors: List[str] = []

class DataImportResponse(BaseModel):
    entity_type: str
    total_rows: int
    valid_rows: int
    imported_rows: int
    errors: List[str] = []
    preview: List[DataImportPreviewItem] = []
