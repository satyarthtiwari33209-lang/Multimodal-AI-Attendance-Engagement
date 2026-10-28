from pydantic import BaseModel
from typing import Optional, List

class DetectedFace(BaseModel):
    box: List[int]  # [x, y, width, height]
    matched_student_id: Optional[int] = None
    matched_student_name: Optional[str] = None
    confidence: float = 0.0
    attention_score: float
    gaze_direction: str  # "center", "left", "right", "down", "away"
    drowsiness_detected: bool
    head_pose: dict  # {"pitch": 2.5, "yaw": -1.2, "roll": 0.4}
    emotion: str  # "focused", "neutral", "confused", "distracted", "bored"
    fused_engagement: float

class MultimodalAudioMetrics(BaseModel):
    rms_volume: float
    speech_detected: bool
    spectral_energy: float
    acoustic_environment: str  # "quiet_lecture", "active_discussion", "moderate_noise"

class FrameProcessRequest(BaseModel):
    session_id: int
    image_base64: Optional[str] = None  # Live webcam frame snapshot
    audio_level: Optional[float] = 0.0  # RMS from web audio api
    mark_attendance_if_matched: bool = True
    simulate_multi_student: bool = False  # If true, augments single frame with classroom cohort metrics

class FrameProcessResponse(BaseModel):
    session_id: int
    timestamp: str
    faces_detected: int
    students_recognized: List[dict]
    audio_metrics: MultimodalAudioMetrics
    cohort_engagement_score: float
    active_alerts: List[str]
    immediate_recommendation: Optional[str] = None
