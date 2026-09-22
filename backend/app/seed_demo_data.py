import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    Organization, OrgPolicy, User, RoleEnum, Project, Site, Material, Inventory,
    InventoryTransaction, ConsumptionRecord, ScheduleActivity, ProjectRequirement,
    Supplier, SupplierMaterial, PurchaseOrder, ShortageEvent, SurplusEvent,
    AgentRun, AgentToolCall, AgentDecision, Approval, Notification, AuditLog,
    SeverityEnum, AutonomyLevelEnum, POStatusEnum
)

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True
    else:
        # Clear existing tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    now = datetime.utcnow()

    # 1. Organization & Policy
    org = Organization(
        id=str(uuid.uuid4()),
        name="Apex Infrastructure & Builders Ltd.",
        industry="Commercial, Residential & Industrial Construction",
        currency="INR",
        country="India",
        timezone="Asia/Kolkata"
    )
    db.add(org)
    db.flush()

    policy = OrgPolicy(
        org_id=org.id,
        max_autonomous_procurement=25000.0,
        max_autonomous_transfer=50000.0,
        require_approval_new_supplier=True,
        require_approval_safety_critical=True,
        separation_of_duties=True
    )
    db.add(policy)

    # 2. Users with Roles
    default_pw_hash = get_password_hash("demo1234")
    users = [
        User(org_id=org.id, email="admin@constructiq.com", hashed_password=default_pw_hash, full_name="Aravind Swaminathan", role=RoleEnum.ADMIN.value),
        User(org_id=org.id, email="procurement@constructiq.com", hashed_password=default_pw_hash, full_name="Priya Ramakrishnan", role=RoleEnum.PROCUREMENT_MANAGER.value),
        User(org_id=org.id, email="pm@constructiq.com", hashed_password=default_pw_hash, full_name="Karthik Venkatesh", role=RoleEnum.PROJECT_MANAGER.value),
        User(org_id=org.id, email="site@constructiq.com", hashed_password=default_pw_hash, full_name="Muthu Kumar", role=RoleEnum.SITE_ENGINEER.value),
        User(org_id=org.id, email="finance@constructiq.com", hashed_password=default_pw_hash, full_name="Deepa Sundaram", role=RoleEnum.FINANCE_MANAGER.value),
        User(org_id=org.id, email="viewer@constructiq.com", hashed_password=default_pw_hash, full_name="Rahul Sharma", role=RoleEnum.VIEWER.value)
    ]
    db.add_all(users)
    db.flush()

    # 3. Five Construction Projects
    proj_madurai = Project(
        org_id=org.id,
        name="Madurai Commercial Complex",
        code="MCC-01",
        client="Meenakshi Commercial Developers",
        location="Madurai, Tamil Nadu",
        start_date=now - timedelta(days=45),
        expected_completion_date=now + timedelta(days=280),
        status="ACTIVE",
        budget=45000000.0,
        project_manager="Karthik Venkatesh",
        site_manager="Muthu Kumar"
    )
    proj_chennai = Project(
        org_id=org.id,
        name="Chennai Residential Tower",
        code="CRT-02",
        client="Marina Horizon Properties",
        location="Chennai, Tamil Nadu",
        start_date=now - timedelta(days=120),
        expected_completion_date=now + timedelta(days=180),
        status="ACTIVE",
        budget=82000000.0,
        project_manager="Karthik Venkatesh",
        site_manager="Suresh Babu"
    )
    proj_coimbatore = Project(
        org_id=org.id,
        name="Coimbatore Industrial Facility",
        code="CIF-03",
        client="Kongu Logistics & Warehousing",
        location="Coimbatore, Tamil Nadu",
        start_date=now - timedelta(days=60),
        expected_completion_date=now + timedelta(days=320),
        status="ACTIVE",
        budget=38000000.0,
        project_manager="Ramesh Pillai",
        site_manager="Anand Raj"
    )
    proj_trichy = Project(
        org_id=org.id,
        name="Trichy Hospital Expansion",
        code="THE-04",
        client="Cauvery Healthcare Trust",
        location="Trichy, Tamil Nadu",
        start_date=now - timedelta(days=90),
        expected_completion_date=now + timedelta(days=210),
        status="ACTIVE",
        budget=52000000.0,
        project_manager="Ramesh Pillai",
        site_manager="Gopal Menon"
    )
    proj_tirunelveli = Project(
        org_id=org.id,
        name="Tirunelveli Infrastructure Project",
        code="TIP-05",
        client="Tamil Nadu State Highway Authority",
        location="Tirunelveli, Tamil Nadu",
        start_date=now - timedelta(days=150),
        expected_completion_date=now + timedelta(days=140),
        status="ACTIVE",
        budget=67000000.0,
        project_manager="Karthik Venkatesh",
        site_manager="Selvan Paul"
    )
    all_projects = [proj_madurai, proj_chennai, proj_coimbatore, proj_trichy, proj_tirunelveli]
    db.add_all(all_projects)
    db.flush()

    # Add Sites for each project
    sites = []
    for p in all_projects:
        s = Site(
            project_id=p.id,
            name=f"{p.name} - Primary Yard",
            address=f"Plot 42, Construction Zone, {p.location}",
            latitude=13.0827 if "Chennai" in p.location else (9.9252 if "Madurai" in p.location else 11.0168),
            longitude=80.2707 if "Chennai" in p.location else (78.1198 if "Madurai" in p.location else 76.9558)
        )
        sites.append(s)
    db.add_all(sites)
    db.flush()

    # 4. Materials Master (14 materials)
    materials_catalog = [
        Material(org_id=org.id, material_name="TMT Reinforcement Steel (Fe 550D)", category="Steel", unit="kg", unit_cost=65.0, minimum_stock=500.0, safety_stock=800.0, lead_time_days=10, compatible_material_group="Fe550D", is_safety_critical=True),
        Material(org_id=org.id, material_name="Structural Steel Beams (ISMB 300)", category="Steel", unit="kg", unit_cost=78.0, minimum_stock=300.0, safety_stock=500.0, lead_time_days=14, compatible_material_group="ISMB", is_safety_critical=True),
        Material(org_id=org.id, material_name="Ordinary Portland Cement (Grade 53)", category="Cement", unit="bags", unit_cost=380.0, minimum_stock=200.0, safety_stock=350.0, lead_time_days=5, compatible_material_group="OPC53"),
        Material(org_id=org.id, material_name="Portland Pozzolana Cement (PPC)", category="Cement", unit="bags", unit_cost=360.0, minimum_stock=150.0, safety_stock=250.0, lead_time_days=5, compatible_material_group="PPC"),
        Material(org_id=org.id, material_name="River Sand / M-Sand", category="Aggregates", unit="tons", unit_cost=1400.0, minimum_stock=40.0, safety_stock=80.0, lead_time_days=4, compatible_material_group="MSand"),
        Material(org_id=org.id, material_name="Coarse Aggregate (20mm Blue Metal)", category="Aggregates", unit="tons", unit_cost=950.0, minimum_stock=50.0, safety_stock=100.0, lead_time_days=3, compatible_material_group="Agg20mm"),
        Material(org_id=org.id, material_name="Wire Cut Red Bricks", category="Masonry", unit="units", unit_cost=9.5, minimum_stock=5000.0, safety_stock=10000.0, lead_time_days=6, compatible_material_group="RedBricks"),
        Material(org_id=org.id, material_name="AAC Lightweight Blocks (600x200x150mm)", category="Masonry", unit="units", unit_cost=58.0, minimum_stock=800.0, safety_stock=1500.0, lead_time_days=7, compatible_material_group="AAC"),
        Material(org_id=org.id, material_name="Vitrified Floor Tiles (600x600mm)", category="Finishing", unit="sq.ft", unit_cost=72.0, minimum_stock=1000.0, safety_stock=2000.0, lead_time_days=12, compatible_material_group="Tiles600"),
        Material(org_id=org.id, material_name="Polished Granite Slabs", category="Finishing", unit="sq.ft", unit_cost=140.0, minimum_stock=300.0, safety_stock=600.0, lead_time_days=14, compatible_material_group="Granite"),
        Material(org_id=org.id, material_name="Italian Composite Marble", category="Finishing", unit="sq.ft", unit_cost=180.0, minimum_stock=200.0, safety_stock=400.0, lead_time_days=20, compatible_material_group="Marble"),
        Material(org_id=org.id, material_name="Film Faced Shuttering Plywood (12mm)", category="Formwork", unit="sheets", unit_cost=1650.0, minimum_stock=100.0, safety_stock=200.0, lead_time_days=6, compatible_material_group="Plywood12mm"),
        Material(org_id=org.id, material_name="PVC Drainage Pipes (110mm)", category="Plumbing", unit="meters", unit_cost=240.0, minimum_stock=150.0, safety_stock=300.0, lead_time_days=5, compatible_material_group="PVC110"),
        Material(org_id=org.id, material_name="FR Multi-strand Copper Cables (4 sq.mm)", category="Electrical", unit="meters", unit_cost=85.0, minimum_stock=400.0, safety_stock=800.0, lead_time_days=8, compatible_material_group="Cable4sqmm")
    ]
    db.add_all(materials_catalog)
    db.flush()

    tmt_steel = next(m for m in materials_catalog if "TMT Reinforcement Steel" in m.material_name)
    cement_opc = next(m for m in materials_catalog if "Ordinary Portland Cement" in m.material_name)
    coarse_agg = next(m for m in materials_catalog if "Coarse Aggregate" in m.material_name)
    shuttering = next(m for m in materials_catalog if "Shuttering Plywood" in m.material_name)

    # 5. Suppliers
    suppliers = [
        Supplier(org_id=org.id, name="Apex Steel Mills & Distributorship", contact="+91 98401 23456", location="Chennai Central", rating=4.6, average_lead_time=10, payment_terms="Net 30", reliability_score=0.94, materials_supported=["TMT Reinforcement Steel (Fe 550D)", "Structural Steel Beams (ISMB 300)"], is_demo=True),
        Supplier(org_id=org.id, name="Deccan Cements & Aggregates Corp", contact="+91 94432 67890", location="Madurai South", rating=4.4, average_lead_time=5, payment_terms="Net 15", reliability_score=0.91, materials_supported=["Ordinary Portland Cement (Grade 53)", "Coarse Aggregate (20mm Blue Metal)"], is_demo=True),
        Supplier(org_id=org.id, name="Southern BuildTech Logistics & Supply", contact="+91 97890 11223", location="Coimbatore Hub", rating=4.7, average_lead_time=7, payment_terms="Net 45", reliability_score=0.96, materials_supported=["Film Faced Shuttering Plywood (12mm)", "Vitrified Floor Tiles (600x600mm)"], is_demo=True),
    ]
    db.add_all(suppliers)
    db.flush()

    # Supplier Quotes
    sup_quotes = [
        SupplierMaterial(supplier_id=suppliers[0].id, material_id=tmt_steel.id, unit_price=64.0, lead_time_days=10, min_order_quantity=1000.0),
        SupplierMaterial(supplier_id=suppliers[1].id, material_id=cement_opc.id, unit_price=375.0, lead_time_days=5, min_order_quantity=100.0),
        SupplierMaterial(supplier_id=suppliers[2].id, material_id=shuttering.id, unit_price=1620.0, lead_time_days=7, min_order_quantity=50.0)
    ]
    db.add_all(sup_quotes)
    db.flush()

    # 6. Hero Demo Scenario Setup:
    # PROJECT A (Chennai):
    # - TMT Steel: Current inventory = 2,300 kg, Future requirement = 800 kg -> Surplus = 1,500 kg!
    # PROJECT B (Madurai):
    # - TMT Steel: Required = 1,400 kg needed in 7 days, Current inventory = 0 kg -> Shortage = 1,400 kg!
    # Supplier Lead Time = 10 days! (Risks 3-day critical pour delay)

    # Schedule Activities for Madurai
    act_madurai_foundation = ScheduleActivity(
        org_id=org.id,
        project_id=proj_madurai.id,
        activity_name="Raft Foundation Reinforcement & Pour",
        start_date=now + timedelta(days=2),
        end_date=now + timedelta(days=9),
        status="IN_PROGRESS"
    )
    act_chennai_superstructure = ScheduleActivity(
        org_id=org.id,
        project_id=proj_chennai.id,
        activity_name="Level 4 Column Rebar & Shuttering",
        start_date=now + timedelta(days=10),
        end_date=now + timedelta(days=22),
        status="NOT_STARTED"
    )
    db.add_all([act_madurai_foundation, act_chennai_superstructure])
    db.flush()

    # Requirements:
    req_madurai = ProjectRequirement(
        org_id=org.id,
        project_id=proj_madurai.id,
        activity_id=act_madurai_foundation.id,
        material_id=tmt_steel.id,
        required_quantity=1400.0,
        required_by_date=now + timedelta(days=7),
        status="UNMET"
    )
    req_chennai = ProjectRequirement(
        org_id=org.id,
        project_id=proj_chennai.id,
        activity_id=act_chennai_superstructure.id,
        material_id=tmt_steel.id,
        required_quantity=800.0,
        required_by_date=now + timedelta(days=18),
        status="SCHEDULED"
    )
    db.add_all([req_madurai, req_chennai])
    db.flush()

    # Seed Inventory across projects
    inv_records = []
    # Chennai (Site A - Surplus)
    inv_chennai_tmt = Inventory(
        org_id=org.id, project_id=proj_chennai.id, site_id=sites[1].id, material_id=tmt_steel.id,
        current_quantity=2300.0, reserved_quantity=0.0, incoming_quantity=0.0, damaged_quantity=0.0, unit_cost=65.0
    )
    inv_records.append(inv_chennai_tmt)

    # Madurai (Site B - Shortage)
    inv_madurai_tmt = Inventory(
        org_id=org.id, project_id=proj_madurai.id, site_id=sites[0].id, material_id=tmt_steel.id,
        current_quantity=0.0, reserved_quantity=0.0, incoming_quantity=0.0, damaged_quantity=0.0, unit_cost=65.0
    )
    inv_records.append(inv_madurai_tmt)

    # Other materials & projects for a rich data-filled environment
    for p_idx, p in enumerate(all_projects):
        s_id = sites[p_idx].id
        inv_records.append(Inventory(org_id=org.id, project_id=p.id, site_id=s_id, material_id=cement_opc.id, current_quantity=450.0 + (p_idx * 60), reserved_quantity=50.0, incoming_quantity=100.0, damaged_quantity=0.0, unit_cost=380.0))
        inv_records.append(Inventory(org_id=org.id, project_id=p.id, site_id=s_id, material_id=coarse_agg.id, current_quantity=120.0 + (p_idx * 15), reserved_quantity=10.0, incoming_quantity=0.0, damaged_quantity=0.0, unit_cost=950.0))
        inv_records.append(Inventory(org_id=org.id, project_id=p.id, site_id=s_id, material_id=shuttering.id, current_quantity=280.0 - (p_idx * 20), reserved_quantity=20.0, incoming_quantity=0.0, damaged_quantity=5.0, unit_cost=1650.0))

    db.add_all(inv_records)
    db.flush()

    # Add historical consumption records
    for d in range(1, 20):
        c_date = now - timedelta(days=d)
        db.add(ConsumptionRecord(org_id=org.id, project_id=proj_madurai.id, material_id=tmt_steel.id, date=c_date, quantity_consumed=85.0, recorded_by="Muthu Kumar"))
        db.add(ConsumptionRecord(org_id=org.id, project_id=proj_chennai.id, material_id=tmt_steel.id, date=c_date, quantity_consumed=60.0, recorded_by="Suresh Babu"))
        db.add(ConsumptionRecord(org_id=org.id, project_id=proj_madurai.id, material_id=cement_opc.id, date=c_date, quantity_consumed=25.0, recorded_by="Muthu Kumar"))

    # Seed Initial Imbalance Events (Hero Demo)
    shortage_hero = ShortageEvent(
        org_id=org.id,
        project_id=proj_madurai.id,
        material_id=tmt_steel.id,
        required_quantity=1400.0,
        available_quantity=0.0,
        shortage_quantity=1400.0,
        required_by_date=now + timedelta(days=7),
        days_until_shortage=7,
        estimated_financial_impact=113750.0,  # 1400 * 65 * 1.25
        schedule_risk="Critical Path Delay: 3-day work stoppage risking concrete curing window",
        severity=SeverityEnum.CRITICAL.value,
        status="OPEN"
    )
    surplus_hero = SurplusEvent(
        org_id=org.id,
        project_id=proj_chennai.id,
        material_id=tmt_steel.id,
        surplus_quantity=1500.0,  # 2300 - 800
        value=97500.0,            # 1500 * 65
        expected_surplus_date=now + timedelta(days=1),
        confidence=0.96,
        possible_destination_projects=[{"project_id": proj_madurai.id, "project_name": proj_madurai.name, "needed_quantity": 1400.0, "required_by": (now + timedelta(days=7)).strftime("%Y-%m-%d")}],
        status="ACTIVE"
    )
    db.add_all([shortage_hero, surplus_hero])
    db.flush()

    # Seed an Initial Agent Run & Decision waiting in Approval Center
    agent_run = AgentRun(
        org_id=org.id,
        trigger_reason="CRITICAL_SHORTAGE_DETECTED_MADURAI",
        status="SUCCESS",
        started_at=now - timedelta(minutes=15),
        completed_at=now - timedelta(minutes=14),
        summary="Discovered 1,400 kg TMT steel shortage at Madurai. Matched 1,500 kg surplus at Chennai. Recommended inter-site transfer with ₹48,272 net savings."
    )
    db.add(agent_run)
    db.flush()

    # Agent tool calls
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="scan_and_update_shortages", tool_input={}, tool_output={"shortages_detected": 1, "critical_material": "TMT Reinforcement Steel (Fe 550D)"}, status="SUCCESS", execution_time_ms=18))
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="find_surplus", tool_input={"material_id": tmt_steel.id}, tool_output={"source_project": "Chennai Residential Tower", "surplus_qty": 1500.0}, status="SUCCESS", execution_time_ms=12))
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="get_supplier_quotes", tool_input={"material_id": tmt_steel.id}, tool_output={"supplier": "Apex Steel Mills", "lead_time_days": 10, "unit_price": 64.0}, status="SUCCESS", execution_time_ms=15))
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="check_material_compatibility", tool_input={"m1": tmt_steel.id, "m2": tmt_steel.id}, tool_output={"is_compatible": True, "spec_match": "Fe 550D High Ductility IS 1786:2008 Standard Compliant"}, status="SUCCESS", execution_time_ms=8))
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="calculate_transfer_cost", tool_input={"from": proj_chennai.name, "to": proj_madurai.name, "qty": 1400.0}, tool_output={"distance_km": 460, "transport_cost": 11550.0, "handling_cost": 2100.0, "total": 13650.0, "transit_days": 2}, status="SUCCESS", execution_time_ms=10))
    db.add(AgentToolCall(agent_run_id=agent_run.id, tool_name="check_policy", tool_input={"action": "TRANSFER", "amount": 13650.0}, tool_output={"policy_status": "YELLOW", "approval_required": True, "rationale": "Transfer <= ₹50,000 threshold requires dual Project Manager authorization."}, status="SUCCESS", execution_time_ms=6))

    explanation_hero = (
        "ConstructIQ recommends transferring 1,400 kg of TMT Reinforcement Steel from Chennai Residential Tower to Madurai Commercial Complex because:\n"
        "• Chennai Residential Tower has 1,500 kg verified surplus (2,300 kg on site minus 800 kg reserved for future slab).\n"
        "• Madurai Commercial Complex requires 1,400 kg within 7 days for raft foundation casting.\n"
        "• Supplier lead time is 10 days, risking an acute 3-day work stoppage and ₹45,000 delay penalty.\n"
        "• Inter-site freight transit arrives in 2 days (zero schedule delay, 5-day safety buffer).\n"
        "• Material specifications (Fe 550D IS 1786:2008) are identical and certified.\n"
        "• Inter-site transfer yields ₹48,272 net savings compared to spot emergency procurement.\n"
        "• Meets Organization Policy (Yellow): transfer value is within ₹50,000 threshold and requires human approval."
    )

    decision_hero = AgentDecision(
        org_id=org.id,
        agent_run_id=agent_run.id,
        problem_detected="Projected 1,400 kg TMT Reinforcement Steel shortage at Madurai Commercial Complex in 7 days",
        evidence={
            "project_name": proj_madurai.name,
            "material_name": tmt_steel.material_name,
            "shortage_quantity": 1400.0,
            "required_by_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
            "days_until_shortage": 7,
            "spec_match": "Fe 550D High Ductility IS 1786:2008 Standard Compliant"
        },
        alternatives_considered=[
            {
                "title": "Inter-Site Transfer from Chennai Residential Tower",
                "type": "TRANSFER",
                "total_cost": 13650.0,
                "lead_time_days": 2,
                "delay_risk_days": 0,
                "estimated_savings": 48272.0,
                "schedule_impact": "Zero Delay: Arrives 5 days ahead of scheduled concrete pour.",
                "ranking": 1
            },
            {
                "title": "Direct Procurement from Apex Steel Mills",
                "type": "PROCUREMENT",
                "total_cost": 94100.0,
                "lead_time_days": 10,
                "delay_risk_days": 3,
                "estimated_savings": 0.0,
                "schedule_impact": "Critical Delay: Arrives 3 days late, causing site crew idle stoppage.",
                "ranking": 2
            }
        ],
        selected_action=explanation_hero,
        calculation_summary={
            "material_cost": 91000.0,
            "transport_cost": 11550.0,
            "handling_cost": 2100.0,
            "total_cost": 13650.0,
            "estimated_savings": 48272.0
        },
        estimated_cost=13650.0,
        estimated_savings=48272.0,
        confidence=0.96,
        policy_status=AutonomyLevelEnum.YELLOW.value,
        approval_required=True,
        action_status="AWAITING_APPROVAL"
    )
    db.add(decision_hero)
    db.flush()

    # Pending Approval Item
    approval_hero = Approval(
        org_id=org.id,
        decision_id=decision_hero.id,
        action_type="MATERIAL_TRANSFER",
        title="Authorize Inter-Site Transfer: Chennai → Madurai (1,400 kg TMT Steel)",
        description="Redistribute 1,400 kg surplus Fe 550D TMT Steel from Chennai Residential Tower to Madurai Commercial Complex. Saves ₹48,272 and prevents 3-day work stoppage.",
        details={
            "shortage_id": shortage_hero.id,
            "from_project_id": proj_chennai.id,
            "from_project_name": proj_chennai.name,
            "to_project_id": proj_madurai.id,
            "to_project_name": proj_madurai.name,
            "material_id": tmt_steel.id,
            "material_name": tmt_steel.material_name,
            "quantity": 1400.0,
            "transport_cost": 11550.0,
            "handling_cost": 2100.0,
            "total_cost": 13650.0,
            "estimated_days": 2
        },
        estimated_cost=13650.0,
        estimated_savings=48272.0,
        status="PENDING"
    )
    db.add(approval_hero)

    # Initial notifications
    db.add(Notification(
        org_id=org.id,
        title="Critical Shortage Alert: Madurai Commercial Complex",
        message="1,400 kg TMT Steel required within 7 days. Supplier standard lead time is 10 days.",
        severity=SeverityEnum.CRITICAL.value,
        type="SHORTAGE",
        link="/shortages"
    ))
    db.add(Notification(
        org_id=org.id,
        title="Surplus Matched: ₹48,272 Potential Savings",
        message="Agent matched 1,500 kg surplus at Chennai Residential Tower. Inter-site transfer recommended.",
        severity=SeverityEnum.HIGH.value,
        type="APPROVAL",
        link="/approvals"
    ))

    # Audit log
    db.add(AuditLog(
        org_id=org.id,
        user_name="ConstructIQ Agent",
        action="RECORD_AGENT_DECISION",
        entity="AgentDecision",
        entity_id=decision_hero.id,
        new_value={"decision": "Recommended Transfer Chennai to Madurai", "savings": 48272.0}
    ))

    db.commit()
    if close_at_end:
        db.close()
    print("Demo database successfully seeded with Hero Scenario!")

if __name__ == "__main__":
    seed_database()
