from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EngagementLogCreate(BaseModel):
    session_id: int
    student_id: Optional[int] = None
    attention_score: float
    eye_contact_score: float
    drowsiness_detected: bool = False
    head_pitch: float = 0.0
    head_yaw: float = 0.0
    emotion: str = "focused"
    audio_energy: float = 0.0
    speech_detected: bool = False
    fused_engagement_score: float

class EngagementLogResponse(BaseModel):
    id: int
    session_id: int
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    timestamp: datetime
    attention_score: float
    eye_contact_score: float
    drowsiness_detected: bool
    head_pitch: float
    head_yaw: float
    emotion: str
    audio_energy: float
    speech_detected: bool
    fused_engagement_score: float
    model_config = ConfigDict(from_attributes=True)

class SessionMetricsSummary(BaseModel):
    session_id: int
    session_title: str
    total_students_enrolled: int
    total_present: int
    attendance_rate: float
    average_engagement: float
    drowsiness_alerts_count: int
    confusion_frequency: float
    speech_participation_ratio: float

