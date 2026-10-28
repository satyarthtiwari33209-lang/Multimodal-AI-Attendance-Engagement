import os
import uuid
import datetime
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.student import Student
from services.vision_detector import vision_detector
from schemas.vision import (
    ImageDetectionResponse,
    VideoDetectionResponse,
    TeacherConfirmAttendanceRequest,
    TeacherConfirmAttendanceResponse
)

router = APIRouter(prefix="/api/vision", tags=["Classroom Vision Module"])

# Directory for optional retained files
TEMP_UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads" / "temp"
TEMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Size limitations
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024    # 10 MB
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024    # 50 MB

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

@router.get("/model-status")
def get_vision_model_status():
    """Returns the current OpenCV vision model status, weights directory, and capabilities."""
    return vision_detector.get_model_status()

@router.post("/detect-image", response_model=ImageDetectionResponse)
async def detect_people_in_image(
    file: UploadFile = File(...),
    demo_mode: bool = Form(False),
    retain_media: bool = Form(False)
):
    """
    Detects people and returns person counts and bounding boxes in a classroom image.
    - Uses OpenCV person detector or demo mode.
    - By default, media is kept in memory and NOT stored on disk.
    - NO facial recognition or biometric identification.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{ext}'. Allowed extensions: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds maximum permitted size of {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
        )

    # Optional retention
    retained_file_id = None
    if retain_media:
        retained_file_id = str(uuid.uuid4())
        save_path = TEMP_UPLOADS_DIR / f"{retained_file_id}{ext}"
        with open(save_path, "wb") as f:
            f.write(image_bytes)

    try:
        detection_result = vision_detector.detect_in_image(image_bytes=image_bytes, demo_mode=demo_mode)
        if retained_file_id:
            detection_result["retained_file_id"] = retained_file_id
        return detection_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image processing error: {str(e)}"
        )

@router.post("/detect-video", response_model=VideoDetectionResponse)
async def detect_people_in_video(
    file: UploadFile = File(...),
    sample_rate_seconds: float = Form(1.0),
    demo_mode: bool = Form(False),
    retain_media: bool = Form(False)
):
    """
    Processes a local classroom video file with OpenCV.
    - Samples frames at specified second intervals.
    - Returns timestamped person counts, peak headcount, and bounding boxes.
    - Never assumes a detected person is a unique student across frames.
    - Cleans up temporary video files by default upon request completion.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid video format '{ext}'. Allowed extensions: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )

    # Temporary file for OpenCV VideoCapture
    temp_id = str(uuid.uuid4())
    temp_path = TEMP_UPLOADS_DIR / f"temp_{temp_id}{ext}"

    total_bytes = 0
    try:
        with open(temp_path, "wb") as f:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Video exceeds maximum permitted size of {MAX_VIDEO_SIZE_BYTES // (1024*1024)} MB."
                    )
                f.write(chunk)

        result = vision_detector.detect_in_video(
            video_path=str(temp_path),
            sample_rate_seconds=sample_rate_seconds,
            demo_mode=demo_mode
        )

        if retain_media:
            result["retained_file_id"] = temp_id

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Video processing error: {str(e)}"
        )
    finally:
        # Delete temporary file unless explicitly requested to retain
        if not retain_media and temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.post("/confirm-attendance", response_model=TeacherConfirmAttendanceResponse)
def teacher_confirm_attendance(
    payload: TeacherConfirmAttendanceRequest,
    db: Session = Depends(get_db)
):
    """
    Authorized Teacher Attendance Confirmation Workflow:
    - Allows an authorized teacher to review vision-detected headcount and manually confirm attendance.
    - Updates attendance records with method 'vision_assisted_manual_confirm'.
    - Does NOT use biometric face identification.
    """
    session = db.query(ClassSession).filter(ClassSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    now = datetime.datetime.now(datetime.timezone.utc)
    confirmed_count = 0

    for item in payload.confirmations:
        student = db.query(Student).filter(Student.id == item.student_id).first()
        if not student:
            continue

        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == payload.session_id,
            AttendanceRecord.student_id == item.student_id
        ).first()

        audit_note = (
            f"Confirmed by {payload.authorized_teacher_name} based on {payload.detection_source_type} "
            f"headcount ({payload.detected_headcount} detected)."
        )
        if item.notes:
            audit_note += f" Note: {item.notes}"

        if record:
            record.status = item.status
            record.verification_method = "vision_assisted_manual_confirm"
            record.confidence_score = 1.0
            record.notes = audit_note
            record.timestamp = now
        else:
            record = AttendanceRecord(
                session_id=payload.session_id,
                student_id=item.student_id,
                status=item.status,
                verification_method="vision_assisted_manual_confirm",
                confidence_score=1.0,
                notes=audit_note,
                timestamp=now
            )
            db.add(record)

        if item.status in ("present", "late"):
            confirmed_count += 1

    db.commit()

    return TeacherConfirmAttendanceResponse(
        success=True,
        session_id=payload.session_id,
        confirmed_count=confirmed_count,
        message=f"Attendance successfully confirmed by {payload.authorized_teacher_name} for session {session.session_code}.",
        timestamp=now.isoformat()
    )

@router.delete("/files/{file_id}")
def delete_retained_file(file_id: str):
    """Deletes a locally retained upload file."""
    # Find matching file in temp dir
    matches = list(TEMP_UPLOADS_DIR.glob(f"*{file_id}*"))
    if not matches:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    for f in matches:
        try:
            os.remove(f)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return {"success": True, "message": f"Retained file {file_id} deleted successfully."}

@router.delete("/files")
def clear_all_retained_files():
    """Cleans up all files in the temporary uploads directory."""
    deleted_count = 0
    for f in TEMP_UPLOADS_DIR.iterdir():
        if f.is_file():
            try:
                os.remove(f)
                deleted_count += 1
            except Exception:
                pass
    return {"success": True, "files_deleted": deleted_count}
