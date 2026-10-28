import datetime
from sqlalchemy import Column, Integer, String, DateTime
from database import Base

class ClassSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String(50), unique=True, index=True, nullable=False)
    course_name = Column(String(120), nullable=False)
    instructor = Column(String(100), default="Dr. Robert Vance")
    room = Column(String(50), default="Hall 3B / Virtual Lab")
    topic = Column(String(200), default="Neural Network Optimization & Attention Mechanics")
    status = Column(String(30), default="scheduled")  # "scheduled", "live", "completed"
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
