import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import get_db
from models.student import Student
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.engagement import EngagementLog
from models.insight import AgentInsight
from schemas.multimodal import FrameProcessRequest, FrameProcessResponse, MultimodalAudioMetrics
from services.vision import vision_module
from services.audio import audio_module
from services.analytics import analytics_module
from services.recommendation_agent import recommendation_agent

router = APIRouter(prefix="/api/multimodal", tags=["Multimodal Stream Processing"])

@router.post("/process-frame", response_model=FrameProcessResponse)
def process_multimodal_frame(payload: FrameProcessRequest, db: Session = Depends(get_db)):
    """
    Core real-time ingestion endpoint:
    - Ingests camera image frame & microphone audio decibel levels
    - Performs face detection, facial recognition, gaze tracking & drowsiness estimation
    - Analyzes speech presence & classroom acoustic context
    - Automatically marks attendance via Biometric Face verification
    - Logs fused multimodal engagement
    - Runs Recommendation Agent to generate instant teaching interventions
    """
    session = db.query(ClassSession).filter(ClassSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Retrieve enrolled students
    students = db.query(Student).all()
    students_data = [
        {
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "face_encoding": s.face_encoding
        }
        for s in students
    ]

    # Process Vision
    detected_faces = vision_module.analyze_frame(
        image_base64=payload.image_base64,
        enrolled_students=students_data,
        simulate_multi_student=payload.simulate_multi_student
    )

    # Process Audio
    if payload.audio_level and payload.audio_level > 0.0:
        audio_info = audio_module.analyze_audio_level(payload.audio_level)
    else:
        audio_info = audio_module.simulate_audio_pulse()

    audio_metrics = MultimodalAudioMetrics(
        rms_volume=audio_info["rms_volume"],
        speech_detected=audio_info["speech_detected"],
        spectral_energy=audio_info["spectral_energy"],
        acoustic_environment=audio_info["acoustic_environment"]
    )

    now = datetime.datetime.utcnow()
    recognized_summary = []

    # Process and log each detected face
    for face in detected_faces:
        stu_id = face.get("matched_student_id")
        
        # Multimodal fusion
        fused_score = analytics_module.fuse_multimodal_metrics(
            vision_score=face["attention_score"],
            audio_participation=audio_info["participation_score"]
        )
        face["fused_engagement"] = fused_score

        # Auto mark attendance
        if payload.mark_attendance_if_matched and stu_id:
            att = db.query(AttendanceRecord).filter(
                AttendanceRecord.session_id == payload.session_id,
                AttendanceRecord.student_id == stu_id
            ).first()

            if not att:
                att = AttendanceRecord(
                    session_id=payload.session_id,
                    student_id=stu_id,
                    status="present",
                    verification_method="biometric_face",
                    confidence_score=face.get("confidence", 0.95),
                    notes="Verified via multimodal vision stream",
                    timestamp=now
                )
                db.add(att)
            else:
                att.status = "present"
                att.confidence_score = max(att.confidence_score, face.get("confidence", 0.95))

        # Log engagement entry
        log_entry = EngagementLog(
            session_id=payload.session_id,
            student_id=stu_id,
            timestamp=now,
            attention_score=face["attention_score"],
            eye_contact_score=0.90 if face["gaze_direction"] == "center" else 0.50,
            drowsiness_detected=face["drowsiness_detected"],
            head_pitch=face["head_pose"]["pitch"],
            head_yaw=face["head_pose"]["yaw"],
            emotion=face["emotion"],
            audio_energy=audio_info["rms_volume"],
            speech_detected=audio_info["speech_detected"],
            fused_engagement_score=fused_score
        )
        db.add(log_entry)

        recognized_summary.append({
            "student_id": stu_id,
            "student_name": face.get("matched_student_name"),
            "confidence": face.get("confidence"),
            "gaze": face["gaze_direction"],
            "drowsiness": face["drowsiness_detected"],
            "emotion": face["emotion"],
            "attention": face["attention_score"],
            "engagement": fused_score,
            "head_pose": face["head_pose"]
        })

    # Recommendation Agent evaluation
    active_alerts = recommendation_agent.evaluate_live_frame(
        db=db,
        session_id=payload.session_id,
        detected_faces=detected_faces,
        audio_metrics=audio_info
    )

    db.commit()

    # Calculate cohort average
    cohort_engagement = (
        round(sum(f["fused_engagement"] for f in detected_faces) / len(detected_faces), 2)
        if detected_faces else 0.80
    )

    immediate_rec = None
    if active_alerts:
        immediate_rec = active_alerts[0]
    elif cohort_engagement > 0.85:
        immediate_rec = "Class attention is high. Great moment for introducing key conceptual formulas."

    return FrameProcessResponse(
        session_id=payload.session_id,
        timestamp=now.isoformat(),
        faces_detected=len(detected_faces),
        students_recognized=recognized_summary,
        audio_metrics=audio_metrics,
        cohort_engagement_score=cohort_engagement,
        active_alerts=active_alerts,
        immediate_recommendation=immediate_rec
    )

@router.get("/live-metrics/{session_id}")
def get_live_metrics(session_id: int, db: Session = Depends(get_db)):
    """Retrieve fast snapshot of current live classroom stream metrics."""
    recent_logs = db.query(EngagementLog).filter(
        EngagementLog.session_id == session_id
    ).order_by(EngagementLog.timestamp.desc()).limit(15).all()

    if not recent_logs:
        return {
            "session_id": session_id,
            "active_stream": False,
            "cohort_engagement": 82.0,
            "recent_faces_count": 0,
            "speech_active": False
        }

    cohort_eng = round(sum(l.fused_engagement_score for l in recent_logs) / len(recent_logs) * 100, 1)
    speech_active = any(l.speech_detected for l in recent_logs[:5])

    return {
        "session_id": session_id,
        "active_stream": True,
        "cohort_engagement": cohort_eng,
        "recent_faces_count": len(recent_logs),
        "speech_active": speech_active,
        "latest_emotion": recent_logs[0].emotion if recent_logs else "focused"
    }
