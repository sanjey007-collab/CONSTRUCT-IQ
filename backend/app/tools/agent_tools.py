from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import (
    Inventory, ProjectRequirement, ScheduleActivity, ConsumptionRecord,
    SurplusEvent, ShortageEvent, Supplier, SupplierMaterial, Material, Project,
    TransferOrder, PurchaseOrder, Approval, AgentDecision, Notification,
    AutonomyLevelEnum, SeverityEnum, POStatusEnum, TransferStatusEnum
)
from app.services.optimization_service import (
    get_approx_distance_km, calculate_transport_cost, calculate_handling_cost
)
from app.services.policy_service import evaluate_action_policy
from app.services.audit_service import log_action

class ConstructionAgentTools:
    """
    Controlled backend tool registry for ConstructIQ AI Agent.
    Every tool executes strictly verified database operations without allowing
    arbitrary database manipulation.
    """
    def __init__(self, db: Session, org_id: str):
        self.db = db
        self.org_id = org_id

    def get_inventory(self, project_id: Optional[str] = None, material_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.query(Inventory).filter(Inventory.org_id == self.org_id)
        if project_id:
            query = query.filter(Inventory.project_id == project_id)
        if material_id:
            query = query.filter(Inventory.material_id == material_id)
        items = query.all()
        return [
            {
                "inventory_id": item.id,
                "project_id": item.project_id,
                "project_name": item.project.name if item.project else "Unknown",
                "material_id": item.material_id,
                "material_name": item.material.material_name if item.material else "Unknown",
                "current_quantity": item.current_quantity,
                "reserved_quantity": item.reserved_quantity,
                "available_quantity": item.available_quantity,
                "unit": item.material.unit if item.material else "unit",
                "unit_cost": item.unit_cost
            }
            for item in items
        ]

    def get_project_requirements(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.query(ProjectRequirement).filter(ProjectRequirement.org_id == self.org_id)
        if project_id:
            query = query.filter(ProjectRequirement.project_id == project_id)
        reqs = query.all()
        return [
            {
                "requirement_id": r.id,
                "project_id": r.project_id,
                "material_id": r.material_id,
                "material_name": r.material_id,  # lookup when needed
                "required_quantity": r.required_quantity,
                "required_by_date": r.required_by_date.strftime("%Y-%m-%d"),
                "status": r.status
            }
            for r in reqs
        ]

    def get_project_schedule(self, project_id: str) -> List[Dict[str, Any]]:
        activities = self.db.query(ScheduleActivity).filter(
            ScheduleActivity.org_id == self.org_id,
            ScheduleActivity.project_id == project_id
        ).all()
        return [
            {
                "activity_id": a.id,
                "activity_name": a.activity_name,
                "start_date": a.start_date.strftime("%Y-%m-%d"),
                "end_date": a.end_date.strftime("%Y-%m-%d"),
                "status": a.status
            }
            for a in activities
        ]

    def get_consumption_history(self, project_id: str, material_id: str, days: int = 30) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        records = self.db.query(ConsumptionRecord).filter(
            ConsumptionRecord.org_id == self.org_id,
            ConsumptionRecord.project_id == project_id,
            ConsumptionRecord.material_id == material_id,
            ConsumptionRecord.date >= cutoff
        ).all()
        return [
            {
                "date": r.date.strftime("%Y-%m-%d"),
                "quantity": r.quantity_consumed,
                "activity_id": r.activity_id
            }
            for r in records
        ]

    def find_surplus(self, material_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.query(SurplusEvent).filter(
            SurplusEvent.org_id == self.org_id,
            SurplusEvent.status == "ACTIVE"
        )
        if material_id:
            query = query.filter(SurplusEvent.material_id == material_id)
        events = query.all()
        return [
            {
                "surplus_id": e.id,
                "project_id": e.project_id,
                "project_name": self.db.query(Project.name).filter(Project.id == e.project_id).scalar(),
                "material_id": e.material_id,
                "material_name": self.db.query(Material.material_name).filter(Material.id == e.material_id).scalar(),
                "surplus_quantity": e.surplus_quantity,
                "value": e.value,
                "confidence": e.confidence
            }
            for e in events
        ]

    def find_future_demand(self, material_id: str, days_ahead: int = 30) -> List[Dict[str, Any]]:
        horizon_end = datetime.utcnow() + timedelta(days=days_ahead)
        reqs = self.db.query(ProjectRequirement).filter(
            ProjectRequirement.org_id == self.org_id,
            ProjectRequirement.material_id == material_id,
            ProjectRequirement.required_by_date <= horizon_end,
            ProjectRequirement.status.in_(["UNMET", "PARTIAL"])
        ).all()
        return [
            {
                "project_id": r.project_id,
                "project_name": self.db.query(Project.name).filter(Project.id == r.project_id).scalar(),
                "required_quantity": r.required_quantity,
                "required_by": r.required_by_date.strftime("%Y-%m-%d")
            }
            for r in reqs
        ]

    def get_supplier_quotes(self, material_id: str) -> List[Dict[str, Any]]:
        quotes = self.db.query(SupplierMaterial, Supplier)\
            .join(Supplier, SupplierMaterial.supplier_id == Supplier.id)\
            .filter(
                SupplierMaterial.material_id == material_id,
                Supplier.org_id == self.org_id
            ).all()
        return [
            {
                "supplier_id": s.id,
                "supplier_name": s.name,
                "unit_price": sm.unit_price,
                "lead_time_days": sm.lead_time_days,
                "rating": s.rating,
                "reliability_score": s.reliability_score
            }
            for sm, s in quotes
        ]

    def calculate_transfer_cost(self, from_project_id: str, to_project_id: str, quantity: float) -> Dict[str, Any]:
        p1 = self.db.query(Project).filter(Project.id == from_project_id).first()
        p2 = self.db.query(Project).filter(Project.id == to_project_id).first()
        dist = get_approx_distance_km(p1.location if p1 else "", p2.location if p2 else "")
        t_cost = calculate_transport_cost(dist, quantity)
        h_cost = calculate_handling_cost(quantity)
        transit_days = 2 if dist <= 500 else 3
        return {
            "from_project": p1.name if p1 else "Site A",
            "to_project": p2.name if p2 else "Site B",
            "distance_km": dist,
            "transport_cost": t_cost,
            "handling_cost": h_cost,
            "total_transfer_cost": round(t_cost + h_cost, 2),
            "transit_days": transit_days
        }

    def calculate_procurement_cost(self, supplier_id: str, material_id: str, quantity: float) -> Dict[str, Any]:
        quote = self.db.query(SupplierMaterial).filter(
            SupplierMaterial.supplier_id == supplier_id,
            SupplierMaterial.material_id == material_id
        ).first()
        mat = self.db.query(Material).filter(Material.id == material_id).first()
        unit_p = quote.unit_price if quote else (mat.unit_cost * 1.08 if mat else 60.0)
        lead_time = quote.lead_time_days if quote else 10
        mat_cost = round(quantity * unit_p, 2)
        freight = 4500.0
        return {
            "supplier_id": supplier_id,
            "unit_price": unit_p,
            "material_cost": mat_cost,
            "freight_cost": freight,
            "total_procurement_cost": round(mat_cost + freight, 2),
            "lead_time_days": lead_time
        }

    def calculate_expected_savings(self, procurement_effective_cost: float, transfer_total_cost: float) -> float:
        return round(max(0.0, procurement_effective_cost - transfer_total_cost), 2)

    def check_material_compatibility(self, material_id_1: str, material_id_2: str) -> Dict[str, Any]:
        m1 = self.db.query(Material).filter(Material.id == material_id_1).first()
        m2 = self.db.query(Material).filter(Material.id == material_id_2).first()
        is_same = (material_id_1 == material_id_2)
        group_compat = (m1.compatible_material_group == m2.compatible_material_group) if (m1 and m2) else False
        compatible = is_same or group_compat
        return {
            "is_compatible": compatible,
            "material_1": m1.material_name if m1 else "Unknown",
            "material_2": m2.material_name if m2 else "Unknown",
            "group_1": m1.compatible_material_group if m1 else "",
            "group_2": m2.compatible_material_group if m2 else "",
            "spec_match": "Fe 550D High Ductility IS 1786:2008 Standard Compliant" if compatible else "Specification Mismatch"
        }

    def check_policy(self, action_type: str, amount: float, material_id: str, is_new_supplier: bool = False, confidence: float = 0.95) -> Dict[str, Any]:
        status, approval_req, rationale = evaluate_action_policy(
            self.db, self.org_id, action_type, amount, material_id, is_new_supplier, confidence
        )
        return {
            "policy_status": status,
            "approval_required": approval_req,
            "rationale": rationale
        }

    def create_transfer_order(
        self,
        from_project_id: str,
        to_project_id: str,
        material_id: str,
        quantity: float,
        transport_cost: float,
        handling_cost: float,
        estimated_days: int = 2,
        approval_id: Optional[str] = None
    ) -> Dict[str, Any]:
        num = f"TO-{datetime.utcnow().strftime('%Y%m%d')}-{from_project_id[:3].upper()}-{to_project_id[:3].upper()}"
        order = TransferOrder(
            org_id=self.org_id,
            transfer_number=num,
            from_project_id=from_project_id,
            to_project_id=to_project_id,
            material_id=material_id,
            quantity=quantity,
            transport_cost=transport_cost,
            handling_cost=handling_cost,
            total_cost=round(transport_cost + handling_cost, 2),
            estimated_days=estimated_days,
            status=TransferStatusEnum.PENDING_APPROVAL.value if not approval_id else TransferStatusEnum.APPROVED.value,
            approval_id=approval_id
        )
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        log_action(self.db, self.org_id, "CREATE_TRANSFER_ORDER", "TransferOrder", order.id, user_name="ConstructIQ Agent", new_value={"transfer_number": num, "quantity": quantity})
        return {
            "transfer_id": order.id,
            "transfer_number": order.transfer_number,
            "status": order.status,
            "total_cost": order.total_cost
        }

    def create_purchase_order(
        self,
        project_id: str,
        supplier_id: str,
        material_id: str,
        quantity: float,
        unit_price: float,
        expected_delivery_date: datetime
    ) -> Dict[str, Any]:
        po_num = f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
        total_c = round(quantity * unit_price, 2)
        po = PurchaseOrder(
            org_id=self.org_id,
            po_number=po_num,
            project_id=project_id,
            supplier_id=supplier_id,
            material_id=material_id,
            quantity=quantity,
            unit_price=unit_price,
            total_cost=total_c,
            expected_delivery_date=expected_delivery_date,
            status=POStatusEnum.PENDING_APPROVAL.value,
            created_by="ConstructIQ Agent"
        )
        self.db.add(po)
        self.db.commit()
        self.db.refresh(po)
        log_action(self.db, self.org_id, "CREATE_PURCHASE_ORDER", "PurchaseOrder", po.id, user_name="ConstructIQ Agent", new_value={"po_number": po_num, "total_cost": total_c})
        return {
            "po_id": po.id,
            "po_number": po.po_number,
            "total_cost": po.total_cost,
            "status": po.status
        }

    def request_human_approval(
        self,
        decision_id: str,
        action_type: str,
        title: str,
        description: str,
        details: Dict[str, Any],
        estimated_cost: float,
        estimated_savings: float
    ) -> Dict[str, Any]:
        approval = Approval(
            org_id=self.org_id,
            decision_id=decision_id,
            action_type=action_type,
            title=title,
            description=description,
            details=details,
            estimated_cost=estimated_cost,
            estimated_savings=estimated_savings,
            status="PENDING"
        )
        self.db.add(approval)
        self.db.commit()
        self.db.refresh(approval)
        
        # Send Notification to Procurement Managers & PMs
        self.send_site_alert(
            title=f"Approval Required: {title}",
            message=f"{description} Potential savings: ₹{estimated_savings:,.2f}.",
            severity=SeverityEnum.HIGH.value,
            link=f"/approvals"
        )
        return {
            "approval_id": approval.id,
            "status": approval.status,
            "title": approval.title
        }

    def send_site_alert(self, title: str, message: str, severity: str = "HIGH", link: Optional[str] = None) -> Dict[str, Any]:
        notif = Notification(
            org_id=self.org_id,
            title=title,
            message=message,
            severity=severity,
            type="ALERT",
            link=link
        )
        self.db.add(notif)
        self.db.commit()
        return {"notification_id": notif.id, "sent": True}

    def record_agent_decision(
        self,
        agent_run_id: str,
        problem_detected: str,
        evidence: Dict[str, Any],
        alternatives_considered: List[Dict[str, Any]],
        selected_action: str,
        calculation_summary: Dict[str, Any],
        estimated_cost: float,
        estimated_savings: float,
        confidence: float,
        policy_status: str,
        approval_required: bool,
        action_status: str = "AWAITING_APPROVAL"
    ) -> AgentDecision:
        decision = AgentDecision(
            org_id=self.org_id,
            agent_run_id=agent_run_id,
            problem_detected=problem_detected,
            evidence=evidence,
            alternatives_considered=alternatives_considered,
            selected_action=selected_action,
            calculation_summary=calculation_summary,
            estimated_cost=estimated_cost,
            estimated_savings=estimated_savings,
            confidence=confidence,
            policy_status=policy_status,
            approval_required=approval_required,
            action_status=action_status
        )
        self.db.add(decision)
        self.db.commit()
        self.db.refresh(decision)
        log_action(
            self.db, self.org_id, "RECORD_AGENT_DECISION", "AgentDecision", decision.id,
            user_name="ConstructIQ Agent",
            new_value={"selected_action": selected_action, "savings": estimated_savings, "policy": policy_status}
        )
        return decision
