from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AttendanceCreate(BaseModel):
    session_id: int
    student_id: int
    status: str = "present"  # present, late, absent
    verification_method: str = "biometric_face"
    confidence_score: float = 0.95
    notes: Optional[str] = None

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    verification_method: Optional[str] = None
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    student_avatar: Optional[str] = None
    timestamp: datetime
    status: str
    verification_method: str
    confidence_score: float
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class BatchVerifyRequest(BaseModel):
    session_id: int
    student_ids: list[int]
    status: str = "present"
    verification_method: str = "manual"

