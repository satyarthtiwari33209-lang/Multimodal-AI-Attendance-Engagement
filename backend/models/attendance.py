import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(30), default="present")  # "present", "late", "absent"
    verification_method = Column(String(50), default="biometric_face")  # "biometric_face", "manual", "qr_beacon"
    confidence_score = Column(Float, default=0.95)
    notes = Column(String(200), nullable=True)

    # Relationships
    student = relationship("Student")
    session = relationship("ClassSession")
