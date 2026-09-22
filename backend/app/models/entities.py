import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    PROCUREMENT_MANAGER = "PROCUREMENT_MANAGER"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    SITE_ENGINEER = "SITE_ENGINEER"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    VIEWER = "VIEWER"

class ProjectStatusEnum(str, enum.Enum):
    PLANNING = "PLANNING"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"

class SeverityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AutonomyLevelEnum(str, enum.Enum):
    GREEN = "GREEN"      # Autonomous
    YELLOW = "YELLOW"    # Approval Required
    RED = "RED"          # Human Only

class POStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

class TransferStatusEnum(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class ApprovalStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), default="Commercial & Infrastructure Construction")
    currency = Column(String(10), default="INR")
    country = Column(String(100), default="India")
    timezone = Column(String(50), default="Asia/Kolkata")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    policies = relationship("OrgPolicy", back_populates="organization", uselist=False, cascade="all, delete-orphan")


class OrgPolicy(Base):
    __tablename__ = "org_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    max_autonomous_procurement = Column(Float, default=25000.0)
    max_autonomous_transfer = Column(Float, default=50000.0)
    require_approval_new_supplier = Column(Boolean, default=True)
    require_approval_safety_critical = Column(Boolean, default=True)
    separation_of_duties = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="policies")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=RoleEnum.VIEWER.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), index=True)
    client = Column(String(255))
    location = Column(String(255))
    start_date = Column(DateTime)
    expected_completion_date = Column(DateTime)
    status = Column(String(50), default=ProjectStatusEnum.ACTIVE.value)
    budget = Column(Float, default=0.0)
    project_manager = Column(String(255))
    site_manager = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sites = relationship("Site", back_populates="project", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="project", cascade="all, delete-orphan")
    schedule_activities = relationship("ScheduleActivity", back_populates="project", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    address = Column(String(255))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sites")
    inventory = relationship("Inventory", back_populates="site", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    material_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)  # kg, bags, tons, sq.ft, meters
    unit_cost = Column(Float, nullable=False)   # INR
    minimum_stock = Column(Float, default=100.0)
    safety_stock = Column(Float, default=200.0)
    preferred_supplier_id = Column(String(36), nullable=True)
    lead_time_days = Column(Integer, default=7)
    compatible_material_group = Column(String(100), default="Standard")
    is_safety_critical = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    inventory_items = relationship("Inventory", back_populates="material", cascade="all, delete-orphan")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    site_id = Column(String(36), ForeignKey("sites.id"), index=True, nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), index=True, nullable=False)
    current_quantity = Column(Float, default=0.0)
    reserved_quantity = Column(Float, default=0.0)
    incoming_quantity = Column(Float, default=0.0)
    damaged_quantity = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="inventory")
    site = relationship("Site", back_populates="inventory")
    material = relationship("Material", back_populates="inventory_items")

    @property
    def available_quantity(self) -> float:
        return max(0.0, self.current_quantity - self.reserved_quantity - self.damaged_quantity)


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    inventory_id = Column(String(36), ForeignKey("inventory.id"), index=True, nullable=False)
    transaction_type = Column(String(50))  # INWARD, OUTWARD, RESERVED, DAMAGED, TRANSFER_IN, TRANSFER_OUT
    quantity = Column(Float, nullable=False)
    reference_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class ConsumptionRecord(Base):
    __tablename__ = "consumption_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), index=True, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    quantity_consumed = Column(Float, nullable=False)
    activity_id = Column(String(36), nullable=True)
    recorded_by = Column(String(255), nullable=True)


class ScheduleActivity(Base):
    __tablename__ = "schedule_activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    activity_name = Column(String(255), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="IN_PROGRESS")  # NOT_STARTED, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="schedule_activities")
    requirements = relationship("ProjectRequirement", back_populates="activity", cascade="all, delete-orphan")


class ProjectRequirement(Base):
    __tablename__ = "project_requirements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    activity_id = Column(String(36), ForeignKey("schedule_activities.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    required_quantity = Column(Float, nullable=False)
    required_by_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="UNMET")  # UNMET, PARTIAL, MET, SCHEDULED

    activity = relationship("ScheduleActivity", back_populates="requirements")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    contact = Column(String(255))
    location = Column(String(255))
    rating = Column(Float, default=4.2)
    average_lead_time = Column(Integer, default=7)  # days
    payment_terms = Column(String(100), default="Net 30")
    reliability_score = Column(Float, default=0.92)
    materials_supported = Column(JSON, default=list)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SupplierMaterial(Base):
    __tablename__ = "supplier_materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    unit_price = Column(Float, nullable=False)
    lead_time_days = Column(Integer, default=7)
    min_order_quantity = Column(Float, default=10.0)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    po_number = Column(String(50), unique=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery_date = Column(DateTime, nullable=False)
    status = Column(String(50), default=POStatusEnum.DRAFT.value)
    created_by = Column(String(255))
    approved_by = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TransferOrder(Base):
    __tablename__ = "transfer_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    transfer_number = Column(String(50), unique=True, index=True)
    from_project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    to_project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    transport_cost = Column(Float, default=0.0)
    handling_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    estimated_days = Column(Integer, default=2)
    status = Column(String(50), default=TransferStatusEnum.PENDING_APPROVAL.value)
    approval_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ShortageEvent(Base):
    __tablename__ = "shortage_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), index=True, nullable=False)
    required_quantity = Column(Float, nullable=False)
    available_quantity = Column(Float, default=0.0)
    shortage_quantity = Column(Float, nullable=False)
    required_by_date = Column(DateTime, nullable=False)
    days_until_shortage = Column(Integer, default=0)
    estimated_financial_impact = Column(Float, default=0.0)
    schedule_risk = Column(String(100), default="High")
    severity = Column(String(50), default=SeverityEnum.HIGH.value)
    status = Column(String(50), default="OPEN")  # OPEN, MITIGATED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)


class SurplusEvent(Base):
    __tablename__ = "surplus_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), index=True, nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), index=True, nullable=False)
    surplus_quantity = Column(Float, nullable=False)
    value = Column(Float, default=0.0)
    expected_surplus_date = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float, default=0.95)
    possible_destination_projects = Column(JSON, default=list)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, ALLOCATED, REPURPOSED
    created_at = Column(DateTime, default=datetime.utcnow)


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    trigger_event = Column(String(100), default="SCHEDULE_SCAN")
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow)

    options = relationship("OptimizationOption", back_populates="run", cascade="all, delete-orphan")


class OptimizationOption(Base):
    __tablename__ = "optimization_options"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("optimization_runs.id"), nullable=False)
    option_type = Column(String(50))  # TRANSFER, PROCUREMENT, SPLIT
    title = Column(String(255), nullable=False)
    description = Column(Text)
    from_project_id = Column(String(36), nullable=True)
    to_project_id = Column(String(36), nullable=True)
    supplier_id = Column(String(36), nullable=True)
    material_id = Column(String(36), nullable=False)
    quantity = Column(Float, nullable=False)
    material_cost = Column(Float, default=0.0)
    transport_cost = Column(Float, default=0.0)
    procurement_cost = Column(Float, default=0.0)
    handling_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=0)
    delay_risk_days = Column(Integer, default=0)
    estimated_savings = Column(Float, default=0.0)
    schedule_impact = Column(String(255), default="On Schedule")
    is_recommended = Column(Boolean, default=False)
    ranking = Column(Integer, default=1)

    run = relationship("OptimizationRun", back_populates="options")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    trigger_reason = Column(String(255), nullable=False)
    status = Column(String(50), default="SUCCESS")  # SUCCESS, PARTIAL, FAILED, BLOCKED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)

    tool_calls = relationship("AgentToolCall", back_populates="agent_run", cascade="all, delete-orphan")
    decisions = relationship("AgentDecision", back_populates="agent_run", cascade="all, delete-orphan")


class AgentToolCall(Base):
    __tablename__ = "agent_tool_calls"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    tool_input = Column(JSON, default=dict)
    tool_output = Column(JSON, default=dict)
    status = Column(String(50), default="SUCCESS")
    execution_time_ms = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent_run = relationship("AgentRun", back_populates="tool_calls")


class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    agent_run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    problem_detected = Column(Text, nullable=False)
    evidence = Column(JSON, default=dict)
    alternatives_considered = Column(JSON, default=list)
    selected_action = Column(String(255), nullable=False)
    calculation_summary = Column(JSON, default=dict)
    estimated_cost = Column(Float, default=0.0)
    estimated_savings = Column(Float, default=0.0)
    confidence = Column(Float, default=0.96)
    policy_status = Column(String(50), default=AutonomyLevelEnum.YELLOW.value)  # GREEN, YELLOW, RED
    approval_required = Column(Boolean, default=True)
    action_status = Column(String(50), default="AWAITING_APPROVAL")  # EXECUTED, AWAITING_APPROVAL, REJECTED
    user_approved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent_run = relationship("AgentRun", back_populates="decisions")
    approval = relationship("Approval", back_populates="decision", uselist=False, cascade="all, delete-orphan")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    decision_id = Column(String(36), ForeignKey("agent_decisions.id"), nullable=False)
    action_type = Column(String(50), default="MATERIAL_TRANSFER")  # MATERIAL_TRANSFER, PURCHASE_ORDER
    title = Column(String(255), nullable=False)
    description = Column(Text)
    details = Column(JSON, default=dict)
    estimated_cost = Column(Float, default=0.0)
    estimated_savings = Column(Float, default=0.0)
    status = Column(String(50), default=ApprovalStatusEnum.PENDING.value)
    requested_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String(255), nullable=True)
    comments = Column(Text, nullable=True)

    decision = relationship("AgentDecision", back_populates="approval")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default=SeverityEnum.MEDIUM.value)
    type = Column(String(50), default="ALERT")  # ALERT, APPROVAL, SHORTAGE, SURPLUS, SYSTEM
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"), index=True, nullable=False)
    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), default="System")
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow)
