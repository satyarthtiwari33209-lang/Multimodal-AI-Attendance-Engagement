import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["enrolled_students"] >= 8

def test_get_students():
    response = client.get("/api/students")
    assert response.status_code == 200
    students = response.json()
    assert len(students) >= 8
    assert students[0]["student_id"].startswith("STU-")

def test_get_sessions():
    response = client.get("/api/sessions")
    assert response.status_code == 200
    sessions = response.json()
    assert len(sessions) >= 3
    live_sessions = [s for s in sessions if s["status"] == "live"]
    assert len(live_sessions) >= 1

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    overview = response.json()
    assert "total_students" in overview
    assert "attendance_rate" in overview
    assert "average_engagement" in overview

def test_multimodal_process_frame():
    # Test frame ingestion with simulation
    payload = {
        "session_id": 1,
        "image_base64": None,
        "audio_level": 0.15,
        "mark_attendance_if_matched": True,
        "simulate_multi_student": True
    }
    response = client.post("/api/multimodal/process-frame", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["faces_detected"] > 0
    assert "audio_metrics" in data
    assert data["audio_metrics"]["speech_detected"] is True
    assert data["cohort_engagement_score"] > 0.0

def test_session_trends():
    response = client.get("/api/analytics/session/1/trends")
    assert response.status_code == 200
    data = response.json()
    assert "timeline" in data
    assert len(data["timeline"]) > 0

def test_insights():
    response = client.get("/api/insights/1")
    assert response.status_code == 200
    insights = response.json()
    assert isinstance(insights, list)
