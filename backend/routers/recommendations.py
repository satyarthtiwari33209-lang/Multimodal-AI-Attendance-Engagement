import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models.session import ClassSession
from models.recommendation import SessionSummary, SessionRecommendation
from schemas.recommendation import (
    GenerateRecommendationsResponse,
    RecommendationItem,
    SessionSummaryResponse,
    ReasoningRuleDocumentation,
    TeacherFeedbackRequest
)
from services.rule_reasoning_engine import rule_reasoning_engine, EPISTEMOLOGICAL_NOTICE

router = APIRouter(prefix="/api/recommendations", tags=["Pedagogical Recommendation Agent"])

@router.get("/rules", response_model=List[ReasoningRuleDocumentation])
def get_reasoning_rules_catalog():
    """Returns the transparent catalog of deterministic pedagogical rules, trigger conditions, and rationales."""
    return rule_reasoning_engine.get_reasoning_rules_documentation()

@router.post("/generate/{session_id}", response_model=GenerateRecommendationsResponse)
def generate_recommendations(session_id: int, db: Session = Depends(get_db)):
    """
    Executes the deterministic rule-based reasoning engine on session telemetry:
    - Synthesizes attendance patterns, vision headcount, speech ratio, and silence intervals.
    - Formulates practical teaching suggestions (Q&A activities, reflection pauses, attendance reviews).
    - Distinguishes observed measurements from statistical estimates and recommendations.
    - Persists summaries and recommendations in SQLite.
    - Works 100% offline with zero cloud LLM dependencies.
    """
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session with ID {session_id} not found.")

    try:
        return rule_reasoning_engine.generate_recommendations_for_session(db=db, session_id=session_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

@router.get("/session/{session_id}")
def get_session_recommendations(session_id: int, db: Session = Depends(get_db)):
    """Retrieves persisted recommendations, observed measurements, and session summary from SQLite."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session with ID {session_id} not found.")

    summary = (
        db.query(SessionSummary)
        .filter(SessionSummary.session_id == session_id)
        .order_by(desc(SessionSummary.id))
        .first()
    )

    recommendations = (
        db.query(SessionRecommendation)
        .filter(SessionRecommendation.session_id == session_id)
        .order_by(SessionRecommendation.id.asc())
        .all()
    )

    # If no summary exists yet, generate it on demand
    if not summary or not recommendations:
        return rule_reasoning_engine.generate_recommendations_for_session(db=db, session_id=session_id)

    formatted_recommendations = []
    for r in recommendations:
        formatted_recommendations.append({
            "id": r.id,
            "session_id": r.session_id,
            "timestamp": r.timestamp.isoformat(),
            "rule_id": r.rule_id,
            "rule_name": r.rule_name,
            "category": r.category,
            "item_type": r.item_type,
            "title": r.title,
            "suggestion": r.suggestion,
            "pedagogical_rationale": r.pedagogical_rationale,
            "supporting_signals": json.loads(r.supporting_signals or "[]"),
            "confidence_score": r.confidence_score,
            "confidence_limitations": r.confidence_limitations,
            "severity": r.severity,
            "is_applied": r.is_applied,
            "teacher_feedback": r.teacher_feedback
        })

    summary_data = {
        "id": summary.id,
        "session_id": summary.session_id,
        "timestamp": summary.timestamp.isoformat(),
        "enrolled_student_count": summary.enrolled_student_count,
        "confirmed_attendance_count": summary.confirmed_attendance_count,
        "attendance_rate": summary.attendance_rate,
        "attendance_change_from_prior": summary.attendance_change_from_prior,
        "vision_headcount_peak": summary.vision_headcount_peak,
        "speech_ratio": summary.speech_ratio,
        "silence_ratio": summary.silence_ratio,
        "silence_intervals_count": summary.silence_intervals_count,
        "vocal_participation_index": summary.vocal_participation_index,
        "dialogue_turns_estimated": summary.dialogue_turns_estimated,
        "acoustic_environment": summary.acoustic_environment,
        "active_modalities": json.loads(summary.active_modalities or "[]"),
        "missing_modalities": json.loads(summary.missing_modalities or "[]"),
        "epistemological_disclaimer": summary.epistemological_disclaimer
    }

    obs_count = sum(1 for r in recommendations if r.item_type == "OBSERVED_MEASUREMENT")
    est_count = sum(1 for r in recommendations if r.item_type == "STATISTICAL_ESTIMATE")
    ped_count = sum(1 for r in recommendations if r.item_type == "PEDAGOGICAL_RECOMMENDATION")

    return {
        "success": True,
        "session_id": session_id,
        "summary": summary_data,
        "recommendations": formatted_recommendations,
        "observed_measurements_count": obs_count,
        "statistical_estimates_count": est_count,
        "pedagogical_recommendations_count": ped_count,
        "epistemological_notice": EPISTEMOLOGICAL_NOTICE
    }

@router.post("/{recommendation_id}/apply", response_model=RecommendationItem)
def apply_recommendation(
    recommendation_id: int,
    payload: Optional[TeacherFeedbackRequest] = None,
    db: Session = Depends(get_db)
):
    """Marks a recommendation as applied in the classroom by the authorized instructor."""
    rec = db.query(SessionRecommendation).filter(SessionRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found.")

    rec.is_applied = True
    if payload and payload.feedback:
        rec.teacher_feedback = payload.feedback

    db.commit()
    db.refresh(rec)

    return RecommendationItem(
        id=rec.id,
        session_id=rec.session_id,
        timestamp=rec.timestamp.isoformat(),
        rule_id=rec.rule_id,
        rule_name=rec.rule_name,
        category=rec.category,
        item_type=rec.item_type,
        title=rec.title,
        suggestion=rec.suggestion,
        pedagogical_rationale=rec.pedagogical_rationale,
        supporting_signals=json.loads(rec.supporting_signals or "[]"),
        confidence_score=rec.confidence_score,
        confidence_limitations=rec.confidence_limitations,
        severity=rec.severity,
        is_applied=rec.is_applied,
        teacher_feedback=rec.teacher_feedback
    )

@router.post("/{recommendation_id}/dismiss", response_model=RecommendationItem)
def dismiss_recommendation(
    recommendation_id: int,
    payload: Optional[TeacherFeedbackRequest] = None,
    db: Session = Depends(get_db)
):
    """Dismisses or acknowledges a recommendation with optional instructor notes."""
    rec = db.query(SessionRecommendation).filter(SessionRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found.")

    rec.is_applied = False
    if payload and payload.feedback:
        rec.teacher_feedback = f"Dismissed: {payload.feedback}"

    db.commit()
    db.refresh(rec)

    return RecommendationItem(
        id=rec.id,
        session_id=rec.session_id,
        timestamp=rec.timestamp.isoformat(),
        rule_id=rec.rule_id,
        rule_name=rec.rule_name,
        category=rec.category,
        item_type=rec.item_type,
        title=rec.title,
        suggestion=rec.suggestion,
        pedagogical_rationale=rec.pedagogical_rationale,
        supporting_signals=json.loads(rec.supporting_signals or "[]"),
        confidence_score=rec.confidence_score,
        confidence_limitations=rec.confidence_limitations,
        severity=rec.severity,
        is_applied=rec.is_applied,
        teacher_feedback=rec.teacher_feedback
    )
