from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SessionBase(BaseModel):
    session_code: str
    course_name: str
    instructor: str = "Dr. Robert Vance"
    room: str = "Hall 3B / Virtual Lab"
    topic: str = "Neural Network Optimization & Attention Mechanics"

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    course_name: Optional[str] = None
    instructor: Optional[str] = None
    room: Optional[str] = None
    topic: Optional[str] = None
    status: Optional[str] = None
    end_time: Optional[datetime] = None

class SessionResponse(SessionBase):
    id: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime
    attendance_count: Optional[int] = 0
    average_engagement: Optional[float] = 0.0
    model_config = ConfigDict(from_attributes=True)

