from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class BoundingBox(BaseModel):
    box: List[int] = Field(..., description="[x, y, width, height]")
    confidence: float
    label: str = "person"

class ImageDetectionResponse(BaseModel):
    person_count: int
    bounding_boxes: List[Dict[str, Any]]
    image_width: int
    image_height: int
    detection_source: str
    is_simulated: bool
    confidence_average: float
    processing_time_ms: float
    retained_file_id: Optional[str] = None
    disclaimer: str
    model_config = ConfigDict(from_attributes=True)

class VideoFrameDetection(BaseModel):
    frame_index: int
    timestamp_ms: float
    timestamp_formatted: str
    person_count: int
    bounding_boxes: List[Dict[str, Any]]

class VideoDetectionResponse(BaseModel):
    video_metadata: Dict[str, Any]
    total_frames_sampled: int
    sampling_interval_seconds: float
    average_person_count: float
    peak_person_count: int
    min_person_count: int
    frame_timeline: List[VideoFrameDetection]
    detection_source: str
    is_simulated: bool
    processing_time_ms: float
    retained_file_id: Optional[str] = None
    disclaimer: str
    model_config = ConfigDict(from_attributes=True)

class TeacherConfirmAttendanceItem(BaseModel):
    student_id: int
    status: str = Field(..., pattern="^(present|late|absent)$")
    notes: Optional[str] = None

class TeacherConfirmAttendanceRequest(BaseModel):
    session_id: int
    detection_source_type: str = "image"  # "image" or "video"
    detected_headcount: int
    authorized_teacher_name: str = "Dr. Robert Vance"
    confirmations: List[TeacherConfirmAttendanceItem]

class TeacherConfirmAttendanceResponse(BaseModel):
    success: bool
    session_id: int
    confirmed_count: int
    message: str
    timestamp: str
