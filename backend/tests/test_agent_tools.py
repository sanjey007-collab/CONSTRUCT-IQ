import pytest
from app.core.database import SessionLocal
from app.models.entities import Organization, Project, Material
from app.tools.agent_tools import ConstructionAgentTools

def test_agent_tools_execution():
    db = SessionLocal()
    try:
        org = db.query(Organization).first()
        tools = ConstructionAgentTools(db, org.id)

        # 1. get_inventory
        inv = tools.get_inventory()
        assert isinstance(inv, list)
        assert len(inv) > 0

        # 2. find_surplus
        surplus = tools.find_surplus()
        assert isinstance(surplus, list)
        assert len(surplus) > 0

        # 3. get_supplier_quotes
        mat = db.query(Material).filter(Material.material_name.like("%TMT%")).first()
        quotes = tools.get_supplier_quotes(mat.id)
        assert isinstance(quotes, list)
        assert len(quotes) > 0

        # 4. calculate_transfer_cost
        p1 = db.query(Project).filter(Project.name.like("%Chennai%")).first()
        p2 = db.query(Project).filter(Project.name.like("%Madurai%")).first()
        t_cost = tools.calculate_transfer_cost(p1.id, p2.id, 1400.0)
        assert t_cost["total_transfer_cost"] > 0
        assert t_cost["transit_days"] == 2

        # 5. check_material_compatibility
        compat = tools.check_material_compatibility(mat.id, mat.id)
        assert compat["is_compatible"] is True

        # 6. check_policy
        policy_res = tools.check_policy("TRANSFER", 13650.0, mat.id)
        assert policy_res["policy_status"] in ["GREEN", "YELLOW", "RED"]
    finally:
        db.close()
