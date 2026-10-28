import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.attendance import AttendanceRecord
from models.student import Student
from models.session import ClassSession
from schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse, BatchVerifyRequest

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.get("/{session_id}", response_model=List[AttendanceResponse])
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    """Retrieve all attendance records for a specific class session."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    results = []

    for r in records:
        stu = db.query(Student).filter(Student.id == r.student_id).first()
        results.append(
            AttendanceResponse(
                id=r.id,
                session_id=r.session_id,
                student_id=r.student_id,
                student_name=stu.name if stu else "Unknown",
                student_code=stu.student_id if stu else "N/A",
                student_avatar=stu.avatar_url if stu else None,
                timestamp=r.timestamp,
                status=r.status,
                verification_method=r.verification_method,
                confidence_score=r.confidence_score,
                notes=r.notes
            )
        )
    return results

@router.post("/mark", response_model=AttendanceResponse)
def mark_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    """Mark or update a student's attendance in a session."""
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == payload.session_id,
        AttendanceRecord.student_id == payload.student_id
    ).first()

    if record:
        record.status = payload.status
        record.verification_method = payload.verification_method
        record.confidence_score = payload.confidence_score
        record.notes = payload.notes
        record.timestamp = datetime.datetime.utcnow()
    else:
        record = AttendanceRecord(
            session_id=payload.session_id,
            student_id=payload.student_id,
            status=payload.status,
            verification_method=payload.verification_method,
            confidence_score=payload.confidence_score,
            notes=payload.notes,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    return AttendanceResponse(
        id=record.id,
        session_id=record.session_id,
        student_id=record.student_id,
        student_name=student.name,
        student_code=student.student_id,
        student_avatar=student.avatar_url,
        timestamp=record.timestamp,
        status=record.status,
        verification_method=record.verification_method,
        confidence_score=record.confidence_score,
        notes=record.notes
    )

@router.post("/batch-verify")
def batch_verify_attendance(payload: BatchVerifyRequest, db: Session = Depends(get_db)):
    """Batch verify attendance for multiple students (e.g. whole section or roll-call)."""
    updated_count = 0
    now = datetime.datetime.utcnow()

    for s_id in payload.student_ids:
        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == payload.session_id,
            AttendanceRecord.student_id == s_id
        ).first()

        if record:
            record.status = payload.status
            record.verification_method = payload.verification_method
            record.timestamp = now
        else:
            record = AttendanceRecord(
                session_id=payload.session_id,
                student_id=s_id,
                status=payload.status,
                verification_method=payload.verification_method,
                confidence_score=1.0,
                timestamp=now
            )
            db.add(record)
        updated_count += 1

    db.commit()
    return {"success": True, "records_processed": updated_count}

@router.put("/{record_id}", response_model=AttendanceResponse)
def update_attendance_record(record_id: int, payload: AttendanceUpdate, db: Session = Depends(get_db)):
    """Update individual attendance status or notes."""
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if payload.status:
        record.status = payload.status
    if payload.verification_method:
        record.verification_method = payload.verification_method
    if payload.notes is not None:
        record.notes = payload.notes

    db.commit()
    db.refresh(record)

    stu = db.query(Student).filter(Student.id == record.student_id).first()
    return AttendanceResponse(
        id=record.id,
        session_id=record.session_id,
        student_id=record.student_id,
        student_name=stu.name if stu else "Unknown",
        student_code=stu.student_id if stu else "N/A",
        student_avatar=stu.avatar_url if stu else None,
        timestamp=record.timestamp,
        status=record.status,
        verification_method=record.verification_method,
        confidence_score=record.confidence_score,
        notes=record.notes
    )
