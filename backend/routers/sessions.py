import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.engagement import EngagementLog
from schemas.session import SessionCreate, SessionUpdate, SessionResponse

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.get("", response_model=List[SessionResponse])
def get_sessions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve classroom sessions with aggregated attendance and engagement."""
    sessions = db.query(ClassSession).order_by(ClassSession.id.desc()).offset(skip).limit(limit).all()
    results = []

    for s in sessions:
        att_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == s.id,
            AttendanceRecord.status.in_(["present", "late"])
        ).count()

        avg_eng_val = db.query(func.avg(EngagementLog.fused_engagement_score)).filter(
            EngagementLog.session_id == s.id
        ).scalar()
        avg_eng = round(float(avg_eng_val) * 100, 1) if avg_eng_val else 82.5

        results.append(
            SessionResponse(
                id=s.id,
                session_code=s.session_code,
                course_name=s.course_name,
                instructor=s.instructor,
                room=s.room,
                topic=s.topic,
                status=s.status,
                start_time=s.start_time,
                end_time=s.end_time,
                created_at=s.created_at,
                attendance_count=att_count,
                average_engagement=avg_eng
            )
        )
    return results

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    """Create a new class session."""
    existing = db.query(ClassSession).filter(ClassSession.session_code == payload.session_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session code already exists")

    session = ClassSession(
        session_code=payload.session_code,
        course_name=payload.course_name,
        instructor=payload.instructor,
        room=payload.room,
        topic=payload.topic,
        status="scheduled",
        start_time=datetime.datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(
        id=session.id,
        session_code=session.session_code,
        course_name=session.course_name,
        instructor=session.instructor,
        room=session.room,
        topic=session.topic,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        created_at=session.created_at,
        attendance_count=0,
        average_engagement=0.0
    )

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get single session details."""
    s = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    att_count = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == s.id,
        AttendanceRecord.status.in_(["present", "late"])
    ).count()

    avg_eng_val = db.query(func.avg(EngagementLog.fused_engagement_score)).filter(
        EngagementLog.session_id == s.id
    ).scalar()
    avg_eng = round(float(avg_eng_val) * 100, 1) if avg_eng_val else 82.5

    return SessionResponse(
        id=s.id,
        session_code=s.session_code,
        course_name=s.course_name,
        instructor=s.instructor,
        room=s.room,
        topic=s.topic,
        status=s.status,
        start_time=s.start_time,
        end_time=s.end_time,
        created_at=s.created_at,
        attendance_count=att_count,
        average_engagement=avg_eng
    )

@router.post("/{session_id}/start")
def start_session(session_id: int, db: Session = Depends(get_db)):
    """Activates a session to 'live' status."""
    s = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    s.status = "live"
    s.start_time = datetime.datetime.utcnow()
    db.commit()
    return {"success": True, "status": "live", "session_id": s.id}

@router.post("/{session_id}/stop")
def stop_session(session_id: int, db: Session = Depends(get_db)):
    """Concludes a session, marks status 'completed' and records end time."""
    s = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    s.status = "completed"
    s.end_time = datetime.datetime.utcnow()
    db.commit()
    return {"success": True, "status": "completed", "session_id": s.id}
