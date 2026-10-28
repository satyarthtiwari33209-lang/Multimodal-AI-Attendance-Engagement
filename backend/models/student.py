import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    department = Column(String(100), default="Computer Science")
    avatar_url = Column(String(255), nullable=True)
    enrolled_courses = Column(String(255), default="CS401,CS402,AI201")
    biometric_face_registered = Column(Boolean, default=False)
    face_encoding = Column(Text, nullable=True)  # JSON-encoded landmark/feature array
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
