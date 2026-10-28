import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class AgentInsight(Base):
    __tablename__ = "agent_insights"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    type = Column(String(30), default="intervention")  # alert, intervention, praise, strategy
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    target_student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolution_note = Column(String(255), nullable=True)

    session = relationship("ClassSession")
    student = relationship("Student")
