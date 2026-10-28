import os
import io
import struct
import wave
import pytest
from fastapi.testclient import TestClient
from main import app
from database import engine, Base, SessionLocal
from models.student import Student
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.recommendation import SessionSummary, SessionRecommendation

# Ensure tables exist
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def generate_test_wav_bytes(duration_s=2.0, sample_rate=16000, tone_freq=440.0) -> bytes:
    """Helper to synthesize valid in-memory PCM 16-bit mono WAV bytes."""
    import math
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        total_samples = int(duration_s * sample_rate)
        frames = bytearray()
        for i in range(total_samples):
            t = float(i) / sample_rate
            # 1 second tone, 1 second silence
            if t < 1.0:
                sample_val = int(18000.0 * math.sin(2.0 * math.pi * tone_freq * t))
            else:
                sample_val = 0
            frames.extend(struct.pack("<h", max(-32768, min(32767, sample_val))))
        wf.writeframes(frames)
    return buffer.getvalue()

def generate_test_jpeg_bytes() -> bytes:
    """Helper to synthesize valid JPEG bytes using Pillow."""
    from PIL import Image
    buffer = io.BytesIO()
    img = Image.new("RGB", (320, 240), color=(128, 128, 128))
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


class TestEndToEndApplicationFlow:
    """End-to-end integration tests for the full application lifecycle."""

    def test_e2e_full_lifecycle_flow(self):
        """
        Step 1: Create a new course session
        Step 2: Confirm teacher-verified attendance
        Step 3: Upload valid classroom image & process detections
        Step 4: Upload valid classroom WAV audio & process telemetry
        Step 5: Generate rule-based recommendations & persist to SQLite
        Step 6: Teacher applies and dismisses recommendations
        Step 7: Verify analytics overview and trend updates
        """
        # Step 1: Create a new course session
        import uuid
        unique_code = f"QML-{uuid.uuid4().hex[:6].upper()}"
        create_payload = {
            "session_code": unique_code,
            "course_name": "E2E Quantum Machine Learning Lab",
            "instructor": "Prof. A. Vance",
            "room": "Auditorium-C",
            "topic": "Variational Circuits & Attention Mechanics"
        }
        res = client.post("/api/sessions", json=create_payload)
        assert res.status_code == 201, res.text
        session_data = res.json()
        session_id = session_data["id"]
        assert session_data["session_code"] == unique_code
        assert session_data["status"] == "scheduled"

        # Transition session to live
        res = client.post(f"/api/sessions/{session_id}/start")
        assert res.status_code == 200
        assert res.json()["status"] == "live"

        # Step 2: Get enrolled students and submit teacher-confirmed attendance
        res = client.get("/api/students")
        assert res.status_code == 200
        students = res.json()
        assert len(students) >= 4
        present_student_ids = [students[0]["id"], students[1]["id"], students[2]["id"]]

        attendance_payload = {
            "session_id": session_id,
            "detection_source_type": "image",
            "detected_headcount": 3,
            "authorized_teacher_name": "Dr. Sarah Mitchell",
            "confirmations": [
                {"student_id": students[0]["id"], "status": "present", "notes": "Desk A"},
                {"student_id": students[1]["id"], "status": "present", "notes": "Desk B"},
                {"student_id": students[2]["id"], "status": "present", "notes": "Desk C"},
                {"student_id": students[3]["id"], "status": "absent", "notes": "Excused"}
            ]
        }
        res = client.post("/api/vision/confirm-attendance", json=attendance_payload)
        assert res.status_code == 200, res.text
        confirm_data = res.json()
        assert confirm_data["confirmed_count"] == 3

        # Verify attendance records in database
        res = client.get(f"/api/attendance/{session_id}")
        assert res.status_code == 200
        records = res.json()
        assert len(records) >= 3
        present_records = [r for r in records if r["status"] == "present"]
        assert len(present_records) == 3

        # Step 3: Upload classroom image to vision detector (with retention=True to test file cleanup)
        jpeg_bytes = generate_test_jpeg_bytes()
        files = {"file": ("classroom_test.jpg", jpeg_bytes, "image/jpeg")}
        data = {
            "session_id": str(session_id),
            "demo_mode": "false",
            "retain_media": "true"
        }
        res = client.post("/api/vision/detect-image", files=files, data=data)
        assert res.status_code == 200, res.text
        vision_result = res.json()
        assert "person_count" in vision_result
        assert "bounding_boxes" in vision_result
        assert "detection_source" in vision_result
        retained_filename = vision_result.get("retained_file_id")

        # Step 4: Upload classroom audio to audio intelligence module
        wav_bytes = generate_test_wav_bytes(duration_s=2.5, sample_rate=16000)
        audio_files = {"file": ("lecture_audio.wav", wav_bytes, "audio/wav")}
        audio_data = {
            "session_id": str(session_id),
            "demo_mode": "false",
            "retain_audio": "true"
        }
        res = client.post("/api/audio/analyze-wav", files=audio_files, data=audio_data)
        assert res.status_code == 200, res.text
        audio_result = res.json()
        assert audio_result["duration_seconds"] > 2.0
        assert "vocal_participation_index" in audio_result
        assert "silence_intervals" in audio_result
        retained_audio_filename = audio_result.get("retained_file_id")

        # Step 5: Execute deterministic Rule-Based Recommendation Engine
        res = client.post(f"/api/recommendations/generate/{session_id}?force_regenerate=true")
        assert res.status_code == 200, res.text
        rec_data = res.json()
        assert rec_data["session_id"] == session_id
        assert rec_data["summary"]["confirmed_attendance_count"] == 3
        assert "epistemological_notice" in rec_data
        recommendations = rec_data["recommendations"]
        assert len(recommendations) >= 1

        # Check category separation
        item_types = {r["item_type"] for r in recommendations}
        valid_types = {"OBSERVED_MEASUREMENT", "STATISTICAL_ESTIMATE", "PEDAGOGICAL_RECOMMENDATION"}
        assert item_types.issubset(valid_types)

        # Step 6: Teacher applies first recommendation and dismisses if another exists
        first_rec_id = recommendations[0]["id"]
        res = client.post(f"/api/recommendations/{first_rec_id}/apply", json={"feedback": "Executed during class."})
        assert res.status_code == 200
        applied_rec = res.json()
        assert applied_rec["is_applied"] is True
        assert "Executed during class." in applied_rec["teacher_feedback"]

        if len(recommendations) > 1:
            second_rec_id = recommendations[1]["id"]
            res = client.post(f"/api/recommendations/{second_rec_id}/dismiss", json={"feedback": "Intentional pacing."})
            assert res.status_code == 200
            dismissed_rec = res.json()
            assert dismissed_rec["is_applied"] is False
            assert "Dismissed" in dismissed_rec["teacher_feedback"]

        # Step 7: Verify persistent retrieval from SQLite
        res = client.get(f"/api/recommendations/session/{session_id}")
        assert res.status_code == 200
        persisted = res.json()
        assert persisted["summary"]["confirmed_attendance_count"] == 3
        assert len(persisted["recommendations"]) == len(recommendations)

        # Step 8: Verify analytics overview and session trends
        res = client.get("/api/analytics/overview")
        assert res.status_code == 200
        overview = res.json()
        assert overview["total_sessions"] >= 4

        res = client.get(f"/api/analytics/session/{session_id}/trends")
        assert res.status_code == 200
        trends = res.json()
        assert "timeline" in trends

        # Step 9: Safe file cleanup of retained test media
        if retained_filename:
            del_res = client.delete(f"/api/vision/files/{retained_filename}")
            assert del_res.status_code == 200
            assert del_res.json()["success"] is True

        if retained_audio_filename:
            del_res = client.delete(f"/api/audio/files/{retained_audio_filename}")
            assert del_res.status_code == 200
            assert del_res.json()["success"] is True

    def test_e2e_input_validation_and_error_handling(self):
        """Validates robust input validation, boundary checking, and HTTP status codes."""
        # Nonexistent session for attendance confirmation
        bad_att_payload = {
            "session_id": 999999,
            "detection_source_type": "image",
            "detected_headcount": 1,
            "authorized_teacher_name": "Dr. Sarah Mitchell",
            "confirmations": [
                {"student_id": 1, "status": "present"}
            ]
        }
        res = client.post("/api/vision/confirm-attendance", json=bad_att_payload)
        assert res.status_code == 404

        # Nonexistent session for recommendation generation
        res = client.post("/api/recommendations/generate/999999")
        assert res.status_code == 404

        # Invalid file format for vision (e.g. .txt)
        bad_files = {"file": ("malicious.txt", b"not an image", "text/plain")}
        res = client.post("/api/vision/detect-image", files=bad_files, data={"session_id": "1"})
        assert res.status_code == 400
        assert "Invalid image format" in res.json()["detail"]

        # Invalid file format for audio (e.g. .mp3 without decoder support)
        bad_audio_files = {"file": ("song.mp3", b"ID3 fake content", "audio/mp3")}
        res = client.post("/api/audio/analyze-wav", files=bad_audio_files, data={"session_id": "1"})
        assert res.status_code == 400
        assert "Invalid audio format" in res.json()["detail"]

        # Empty audio file (0 bytes)
        empty_audio = {"file": ("silent.wav", b"", "audio/wav")}
        res = client.post("/api/audio/analyze-wav", files=empty_audio, data={"session_id": "1"})
        assert res.status_code == 400
        assert "empty" in res.json()["detail"].lower()

    def test_e2e_offline_demo_mode_operability(self):
        """Ensures system works in demo mode with zero cloud keys or downloaded DNN weights."""
        # Demo mode image detection
        res = client.post(
            "/api/vision/detect-image",
            files={"file": ("mock.jpg", b"fake-data", "image/jpeg")},
            data={"session_id": "1", "demo_mode": "true"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_simulated"] is True
        assert data["person_count"] > 0

        # Demo mode audio analysis
        res = client.post(
            "/api/audio/analyze-wav",
            files={"file": ("mock.wav", b"fake-data", "audio/wav")},
            data={"session_id": "1", "demo_mode": "true"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_simulated"] is True
        assert data["vocal_participation_index"] > 0
