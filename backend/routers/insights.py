from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.insight import AgentInsight
from models.student import Student
from schemas.insight import InsightResponse, ResolveInsightRequest
from services.recommendation_agent import recommendation_agent

router = APIRouter(prefix="/api/insights", tags=["AI Recommendations"])

@router.get("/{session_id}", response_model=List[InsightResponse])
def get_session_insights(session_id: int, db: Session = Depends(get_db)):
    """Fetch all agent insights and pedagogical recommendations for a session."""
    insights = db.query(AgentInsight).filter(
        AgentInsight.session_id == session_id
    ).order_by(AgentInsight.id.desc()).all()

    results = []
    for ins in insights:
        target_name = None
        if ins.target_student_id:
            stu = db.query(Student).filter(Student.id == ins.target_student_id).first()
            if stu:
                target_name = stu.name

        results.append(
            InsightResponse(
                id=ins.id,
                session_id=ins.session_id,
                timestamp=ins.timestamp,
                type=ins.type,
                title=ins.title,
                message=ins.message,
                severity=ins.severity,
                target_student_id=ins.target_student_id,
                target_student_name=target_name,
                is_resolved=ins.is_resolved,
                resolution_note=ins.resolution_note
            )
        )
    return results

@router.post("/generate/{session_id}")
def generate_insights(session_id: int, db: Session = Depends(get_db)):
    """Triggers the recommendation agent to formulate pedagogical recap and strategies."""
    new_insights = recommendation_agent.generate_session_summary_insights(db, session_id)
    return {
        "success": True,
        "session_id": session_id,
        "generated_count": len(new_insights),
        "insights": new_insights
    }

@router.post("/{insight_id}/resolve", response_model=InsightResponse)
def resolve_insight(insight_id: int, payload: ResolveInsightRequest, db: Session = Depends(get_db)):
    """Acknowledge or resolve an active alert/intervention."""
    ins = db.query(AgentInsight).filter(AgentInsight.id == insight_id).first()
    if not ins:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")

    ins.is_resolved = True
    ins.resolution_note = payload.resolution_note or "Addressed by instructor"
    db.commit()
    db.refresh(ins)

    target_name = None
    if ins.target_student_id:
        stu = db.query(Student).filter(Student.id == ins.target_student_id).first()
        if stu:
            target_name = stu.name

    return InsightResponse(
        id=ins.id,
        session_id=ins.session_id,
        timestamp=ins.timestamp,
        type=ins.type,
        title=ins.title,
        message=ins.message,
        severity=ins.severity,
        target_student_id=ins.target_student_id,
        target_student_name=target_name,
        is_resolved=ins.is_resolved,
        resolution_note=ins.resolution_note
    )
