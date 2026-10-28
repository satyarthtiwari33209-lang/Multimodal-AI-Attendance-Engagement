from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class InsightResponse(BaseModel):
    id: int
    session_id: int
    timestamp: datetime
    type: str  # alert, intervention, praise, strategy
    title: str
    message: str
    severity: str  # low, medium, high, critical
    target_student_id: Optional[int] = None
    target_student_name: Optional[str] = None
    is_resolved: bool
    resolution_note: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ResolveInsightRequest(BaseModel):
    resolution_note: Optional[str] = "Addressed during lecture"

