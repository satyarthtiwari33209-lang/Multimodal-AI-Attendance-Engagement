from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str
    name: str
    email: EmailStr
    department: str = "Computer Science"
    avatar_url: Optional[str] = None
    enrolled_courses: str = "CS401,CS402"

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    avatar_url: Optional[str] = None
    enrolled_courses: Optional[str] = None
    biometric_face_registered: Optional[bool] = None

class BiometricEnrollRequest(BaseModel):
    student_id: int
    image_base64: str  # Base64 encoded face photo

class StudentResponse(StudentBase):
    id: int
    biometric_face_registered: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

