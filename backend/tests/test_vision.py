import io
import os
import tempfile
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_synthetic_image_bytes(width=640, height=480) -> bytes:
    """Creates a valid JPEG image buffer for testing."""
    img = np.full((height, width, 3), 220, dtype=np.uint8)
    # Draw simulated student shapes
    cv2.rectangle(img, (150, 100), (250, 350), (40, 40, 40), -1)
    cv2.rectangle(img, (350, 120), (450, 370), (50, 50, 50), -1)
    success, encoded = cv2.imencode(".jpg", img)
    assert success
    return encoded.tobytes()

def create_synthetic_video_bytes(num_frames=15, width=320, height=240, fps=10.0) -> bytes:
    """Creates a temporary AVI/MP4 video file buffer using OpenCV VideoWriter."""
    with tempfile.NamedTemporaryFile(suffix=".avi", delete=False) as tmp:
        temp_path = tmp.name

    try:
        fourcc = cv2.VideoWriter_fourcc(*"MJPG")
        out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))
        for i in range(num_frames):
            frame = np.full((height, width, 3), 200, dtype=np.uint8)
            # Draw moving person silhouette
            x = 50 + (i * 10)
            cv2.rectangle(frame, (x, 40), (x + 60, 180), (30, 30, 30), -1)
            out.write(frame)
        out.release()

        with open(temp_path, "rb") as f:
            video_bytes = f.read()
        return video_bytes
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_get_vision_model_status():
    """Verifies vision model status and zero biometric guarantee."""
    response = client.get("/api/vision/model-status")
    assert response.status_code == 200
    data = response.json()
    assert "active_detector" in data
    assert "weights_directory" in data
    assert data["biometrics_enabled"] is False
    assert data["facial_recognition"] == "strictly_disabled_by_design"
    assert data["demo_mode_available"] is True
    assert isinstance(data["supported_models"], list)


def test_detect_image_demo_mode():
    """Verifies that demo mode operates without requiring weights and flags is_simulated."""
    fake_img = create_synthetic_image_bytes(200, 200)
    response = client.post(
        "/api/vision/detect-image",
        files={"file": ("classroom_demo.jpg", fake_img, "image/jpeg")},
        data={"demo_mode": "true", "retain_media": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is True
    assert data["detection_source"] == "demo_simulation"
    assert data["person_count"] > 0
    assert len(data["bounding_boxes"]) == data["person_count"]
    assert "Simulated" in data["disclaimer"]


def test_detect_image_actual_opencv():
    """Verifies actual OpenCV image processing and bounding box generation."""
    img_bytes = create_synthetic_image_bytes(640, 480)
    response = client.post(
        "/api/vision/detect-image",
        files={"file": ("real_classroom.jpg", img_bytes, "image/jpeg")},
        data={"demo_mode": "false", "retain_media": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is False
    assert data["image_width"] == 640
    assert data["image_height"] == 480
    assert "opencv" in data["detection_source"]
    assert "facial recognition" in data["disclaimer"].lower()


def test_detect_image_invalid_extension():
    """Verifies rejection of unsupported file types."""
    text_content = b"Not an image"
    response = client.post(
        "/api/vision/detect-image",
        files={"file": ("document.txt", text_content, "text/plain")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 400
    assert "Invalid image format" in response.json()["detail"]


def test_detect_image_oversized():
    """Verifies 413 error for images exceeding the 10MB limit."""
    # Create fake oversized buffer (> 10MB)
    oversized = b"0" * (10 * 1024 * 1024 + 1024)
    response = client.post(
        "/api/vision/detect-image",
        files={"file": ("huge.jpg", oversized, "image/jpeg")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 413
    assert "maximum permitted size" in response.json()["detail"]


def test_detect_video_demo_mode():
    """Verifies video processing in demo mode."""
    dummy_video = b"RIFF....AVI "
    response = client.post(
        "/api/vision/detect-video",
        files={"file": ("classroom_clip.mp4", dummy_video, "video/mp4")},
        data={"sample_rate_seconds": "1.0", "demo_mode": "true", "retain_media": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is True
    assert data["detection_source"] == "demo_simulation"
    assert data["total_frames_sampled"] > 0
    assert data["peak_person_count"] >= data["average_person_count"]
    assert len(data["frame_timeline"]) == data["total_frames_sampled"]
    # Verify no persistent identity assumption
    assert "not assume cross-frame identity" in data["disclaimer"].lower()


def test_detect_video_actual_opencv():
    """Verifies local video frame sampling and OpenCV detection without persistent identity."""
    video_bytes = create_synthetic_video_bytes(num_frames=15, width=320, height=240, fps=10.0)
    response = client.post(
        "/api/vision/detect-video",
        files={"file": ("lecture_sample.avi", video_bytes, "video/x-msvideo")},
        data={"sample_rate_seconds": "0.5", "demo_mode": "false", "retain_media": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is False
    assert data["total_frames_sampled"] > 0
    assert "video_metadata" in data
    assert data["video_metadata"]["total_frames_in_video"] == 15
    for frame in data["frame_timeline"]:
        assert "timestamp_ms" in frame
        assert "timestamp_formatted" in frame
        assert "person_count" in frame
        assert isinstance(frame["bounding_boxes"], list)


def test_detect_video_invalid_extension():
    """Verifies rejection of unsupported video types."""
    response = client.post(
        "/api/vision/detect-video",
        files={"file": ("unsupported.pdf", b"%PDF-1.4", "application/pdf")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 400
    assert "Invalid video format" in response.json()["detail"]


def test_retained_media_and_deletion_workflow():
    """Verifies that media can be optionally retained and subsequently deleted."""
    img_bytes = create_synthetic_image_bytes(200, 200)
    # 1. Upload with retain_media = True
    response = client.post(
        "/api/vision/detect-image",
        files={"file": ("temporary_scan.jpg", img_bytes, "image/jpeg")},
        data={"demo_mode": "true", "retain_media": "true"}
    )
    assert response.status_code == 200
    data = response.json()
    retained_id = data.get("retained_file_id")
    assert retained_id is not None

    # 2. Delete the retained file
    del_res = client.delete(f"/api/vision/files/{retained_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 3. Deleting it again returns 404
    del_res_again = client.delete(f"/api/vision/files/{retained_id}")
    assert del_res_again.status_code == 404

    # 4. Clear all endpoint works
    clear_res = client.delete("/api/vision/files")
    assert clear_res.status_code == 200
    assert "files_deleted" in clear_res.json()


def test_teacher_confirm_attendance_workflow():
    """Verifies authorized teacher review and manual attendance confirmation workflow."""
    # Session 1 is seeded in database
    payload = {
        "session_id": 1,
        "detection_source_type": "image",
        "detected_headcount": 6,
        "authorized_teacher_name": "Dr. Sarah Mitchell",
        "confirmations": [
            {"student_id": 1, "status": "present", "notes": "Front row desk"},
            {"student_id": 2, "status": "present", "notes": "Second row left"},
            {"student_id": 3, "status": "late", "notes": "Arrived 10 mins after start"},
            {"student_id": 4, "status": "absent", "notes": "Excused sick leave"}
        ]
    }
    response = client.post("/api/vision/confirm-attendance", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["session_id"] == 1
    # 2 present + 1 late = 3 confirmed
    assert res_data["confirmed_count"] == 3
    assert "Dr. Sarah Mitchell" in res_data["message"]

    # Verify session attendance records in database
    records_res = client.get("/api/attendance/1")
    assert records_res.status_code == 200
    records = records_res.json()
    assert len(records) > 0
    # Check that method reflects teacher confirmation
    confirmed_records = [r for r in records if r["verification_method"] == "vision_assisted_manual_confirm"]
    assert len(confirmed_records) >= 3


def test_teacher_confirm_attendance_invalid_session():
    """Verifies 404 error when teacher confirms for a non-existent session."""
    payload = {
        "session_id": 999999,
        "detection_source_type": "image",
        "detected_headcount": 5,
        "authorized_teacher_name": "Dr. Vance",
        "confirmations": []
    }
    response = client.post("/api/vision/confirm-attendance", json=payload)
    assert response.status_code == 404
    assert "Session not found" in response.json()["detail"]
