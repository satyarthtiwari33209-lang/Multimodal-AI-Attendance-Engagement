import pytest
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, engine, Base
import models
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.student import Student
from services.rule_reasoning_engine import rule_reasoning_engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_get_reasoning_rules_catalog():
    """Verifies public transparent rule catalog documentation."""
    response = client.get("/api/recommendations/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 7
    rule_ids = [r["rule_id"] for r in rules]
    assert "RULE_LOW_PARTICIPATION_QA" in rule_ids
    assert "RULE_PROLONGED_MONOLOGUE_PAUSE" in rule_ids
    assert "RULE_ATTENDANCE_DROP_REVIEW" in rule_ids
    for r in rules:
        assert "trigger_condition" in r
        assert "pedagogical_rationale" in r
        assert "suggested_action" in r


def test_generate_recommendations_low_participation_rule():
    """Verifies that low speech activity / participation triggers Q&A suggestion."""
    audio_override = {
        "speech_ratio_percentage": 12.0,
        "silence_ratio_percentage": 88.0,
        "silence_intervals": [{"start_seconds": 5.0, "end_seconds": 15.0, "duration_seconds": 10.0}],
        "vocal_participation_index": 0.28,
        "dialogue_turns_estimated": 1,
        "acoustic_environment": "quiet_attentive_lecture"
    }

    db = SessionLocal()
    try:
        result = rule_reasoning_engine.generate_recommendations_for_session(
            db=db,
            session_id=1,
            audio_telemetry_override=audio_override
        )
        assert result["success"] is True
        assert result["session_id"] == 1
        assert "summary" in result
        assert len(result["recommendations"]) > 0

        # Check for Rule 1 (Low Participation QA)
        qa_rec = next((r for r in result["recommendations"] if r["rule_id"] == "RULE_LOW_PARTICIPATION_QA"), None)
        assert qa_rec is not None
        assert "Think-Pair-Share" in qa_rec["suggestion"] or "Q&A" in qa_rec["suggestion"]
        assert len(qa_rec["supporting_signals"]) > 0
        assert qa_rec["item_type"] == "PEDAGOGICAL_RECOMMENDATION"
        assert "confidence_limitations" in qa_rec
    finally:
        db.close()


def test_generate_recommendations_monologue_pause_rule():
    """Verifies that unbroken speech triggers cognitive assimilation pause."""
    audio_override = {
        "speech_ratio_percentage": 92.0,
        "silence_ratio_percentage": 8.0,
        "silence_intervals": [],
        "vocal_participation_index": 0.70,
        "dialogue_turns_estimated": 0,
        "acoustic_environment": "active_discussion"
    }

    db = SessionLocal()
    try:
        result = rule_reasoning_engine.generate_recommendations_for_session(
            db=db,
            session_id=1,
            audio_telemetry_override=audio_override
        )
        monologue_rec = next((r for r in result["recommendations"] if r["rule_id"] == "RULE_PROLONGED_MONOLOGUE_PAUSE"), None)
        assert monologue_rec is not None
        assert "60-second" in monologue_rec["suggestion"].lower() or "pause" in monologue_rec["suggestion"].lower()
        assert monologue_rec["category"] == "pacing"
    finally:
        db.close()


def test_generate_recommendations_headcount_discrepancy_rule():
    """Verifies that spatial headcount discrepancy triggers an audit review suggestion."""
    vision_override = {
        "peak_person_count": 12,
        "detection_source": "opencv"
    }

    db = SessionLocal()
    try:
        result = rule_reasoning_engine.generate_recommendations_for_session(
            db=db,
            session_id=1,
            vision_telemetry_override=vision_override
        )
        disc_rec = next((r for r in result["recommendations"] if r["rule_id"] == "RULE_HEADCOUNT_DISCREPANCY"), None)
        assert disc_rec is not None
        assert "auditing" in disc_rec["suggestion"].lower() or "visitors" in disc_rec["suggestion"].lower()
        assert len(disc_rec["supporting_signals"]) > 0
    finally:
        db.close()


def test_separation_of_epistemological_categories_and_notice():
    """Verifies strict separation between measurements, estimates, recommendations and notice presence."""
    response = client.post("/api/recommendations/generate/1")
    assert response.status_code == 200
    data = response.json()
    assert data["observed_measurements_count"] >= 1
    assert data["pedagogical_recommendations_count"] >= 1
    assert "epistemological_notice" in data
    assert "NEVER directly detected facts" in data["epistemological_notice"]

    item_types = {r["item_type"] for r in data["recommendations"]}
    assert "OBSERVED_MEASUREMENT" in item_types
    assert "PEDAGOGICAL_RECOMMENDATION" in item_types


def test_missing_modality_handling():
    """Verifies graceful degradation when audio or vision modalities are offline."""
    db = SessionLocal()
    try:
        # Pass no vision override and disable audio
        from services.audio_intelligence import audio_intelligence
        audio_intelligence.set_enabled(False)

        result = rule_reasoning_engine.generate_recommendations_for_session(
            db=db,
            session_id=1,
            audio_telemetry_override=None,
            vision_telemetry_override=None
        )
        assert result["success"] is True
        summary = result["summary"]
        assert "audio" in summary["missing_modalities"]

        # Modality notice recommendation should be generated
        mod_rec = next((r for r in result["recommendations"] if r["rule_id"] == "RULE_MISSING_MODALITY_NOTICE"), None)
        assert mod_rec is not None
        assert "AUDIO" in mod_rec["title"] or "audio" in mod_rec["suggestion"].lower()
    finally:
        from services.audio_intelligence import audio_intelligence
        audio_intelligence.set_enabled(True)
        db.close()


def test_recommendation_apply_and_dismiss_workflow():
    """Verifies instructor apply and dismiss feedback workflow."""
    # 1. Generate recommendations
    gen_res = client.post("/api/recommendations/generate/1")
    assert gen_res.status_code == 200
    recs = gen_res.json()["recommendations"]
    assert len(recs) > 0
    target_rec_id = recs[0]["id"]

    # 2. Mark as applied with feedback
    apply_res = client.post(
        f"/api/recommendations/{target_rec_id}/apply",
        json={"feedback": "Conducted 2-minute breakout discussion on slide 14."}
    )
    assert apply_res.status_code == 200
    applied_data = apply_res.json()
    assert applied_data["is_applied"] is True
    assert "breakout discussion" in applied_data["teacher_feedback"]

    # 3. Dismiss another recommendation
    if len(recs) > 1:
        dismiss_id = recs[1]["id"]
        dismiss_res = client.post(
            f"/api/recommendations/{dismiss_id}/dismiss",
            json={"feedback": "Deliberate writing activity in progress."}
        )
        assert dismiss_res.status_code == 200
        dismiss_data = dismiss_res.json()
        assert dismiss_data["is_applied"] is False
        assert "Dismissed" in dismiss_data["teacher_feedback"]


def test_get_session_recommendations_endpoint():
    """Verifies retrieval of persisted session summary and recommendations."""
    response = client.get("/api/recommendations/session/1")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "recommendations" in data
    assert data["session_id"] == 1
    assert data["summary"]["enrolled_student_count"] >= 8
