from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import AgentRun, AgentToolCall, AgentDecision, User
from app.schemas.schemas import (
    AgentRunResponse, AgentCommandQuery, AgentCommandResponse,
    AgentToolCallResponse, AgentDecisionResponse
)
from app.api.deps import get_current_user
from app.agents.operations_agent import ConstructionOperationsAgent

router = APIRouter()

@router.post("/run", response_model=AgentRunResponse)
def trigger_agent_run(
    trigger_reason: Optional[str] = Query("MANUAL_USER_INVOCATION"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agent = ConstructionOperationsAgent(db, current_user.org_id)
    run = agent.run_cycle(trigger_reason=trigger_reason)
    return run

@router.get("/runs", response_model=List[AgentRunResponse])
def get_agent_runs(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    runs = db.query(AgentRun).filter(
        AgentRun.org_id == current_user.org_id
    ).order_by(AgentRun.started_at.desc()).limit(limit).all()
    return runs

@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_agent_run_detail(
    run_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    run = db.query(AgentRun).filter(
        AgentRun.id == run_id,
        AgentRun.org_id == current_user.org_id
    ).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found.")
    return run

@router.post("/command", response_model=AgentCommandResponse)
def execute_command_query(
    query_in: AgentCommandQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agent = ConstructionOperationsAgent(db, current_user.org_id)
    res = agent.answer_query(query_in.prompt)
    return AgentCommandResponse(
        answer=res["answer"],
        reasoning=res["reasoning"],
        sources_used=res["sources_used"],
        suggested_actions=[
            {"label": "Run Resource Optimization Cycle", "action": "TRIGGER_CYCLE"},
            {"label": "Review Pending Approvals", "action": "GOTO_APPROVALS"},
            {"label": "View Shortages", "action": "GOTO_SHORTAGES"}
        ]
    )

@router.get("/timeline")
def get_activity_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns a streamlined feed of recent agent events, tool calls, and decisions."""
    tool_calls = db.query(AgentToolCall)\
        .join(AgentRun, AgentToolCall.agent_run_id == AgentRun.id)\
        .filter(AgentRun.org_id == current_user.org_id)\
        .order_by(AgentToolCall.created_at.desc()).limit(20).all()

    timeline = []
    for tc in tool_calls:
        timeline.append({
            "id": tc.id,
            "type": "TOOL_CALL",
            "title": f"Executed tool {tc.tool_name}",
            "status": tc.status,
            "execution_time_ms": tc.execution_time_ms,
            "created_at": tc.created_at,
            "details": tc.tool_output
        })
    return timeline
