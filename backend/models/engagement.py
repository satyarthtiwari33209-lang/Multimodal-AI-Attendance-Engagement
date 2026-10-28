import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class EngagementLog(Base):
    __tablename__ = "engagement_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=True)  # Nullable for class-wide average log
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Vision metrics
    attention_score = Column(Float, default=0.85)  # 0.0 - 1.0
    eye_contact_score = Column(Float, default=0.80)
    drowsiness_detected = Column(Boolean, default=False)
    head_pitch = Column(Float, default=0.0)  # degrees
    head_yaw = Column(Float, default=0.0)    # degrees
    emotion = Column(String(30), default="focused")  # focused, neutral, confused, distracted, bored
    
    # Audio metrics
    audio_energy = Column(Float, default=0.20)  # 0.0 - 1.0
    speech_detected = Column(Boolean, default=False)
    
    # Multimodal fused
    fused_engagement_score = Column(Float, default=0.82)  # 0.0 - 1.0

    student = relationship("Student")
    session = relationship("ClassSession")
