from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class AudioFrameMetric(BaseModel):
    time_seconds: float
    timestamp_formatted: str
    rms_energy: float
    rms_db: float
    zcr: float
    speech_active: bool

class SilenceInterval(BaseModel):
    start_seconds: float
    end_seconds: float
    duration_seconds: float

class AudioAnalysisResponse(BaseModel):
    audio_metadata: Dict[str, Any]
    duration_seconds: float
    speech_duration_seconds: float
    silence_duration_seconds: float
    speech_ratio_percentage: float
    silence_ratio_percentage: float
    average_rms_energy: float
    peak_rms_energy: float
    vocal_participation_index: float
    acoustic_environment: str
    dialogue_turns_estimated: int
    silence_intervals: List[SilenceInterval]
    timeline: List[AudioFrameMetric]
    analysis_engine: str
    is_simulated: bool
    processing_time_ms: float
    retained_file_id: Optional[str] = None
    privacy_guarantees: Dict[str, str]
    disclaimer: str
    model_config = ConfigDict(from_attributes=True)

class AudioToggleRequest(BaseModel):
    enabled: bool

class AudioToggleResponse(BaseModel):
    success: bool
    audio_processing_enabled: bool
    message: str

class AudioStatusResponse(BaseModel):
    audio_processing_enabled: bool
    active_engine: str
    installed_libraries: Dict[str, bool]
    privacy_guarantees: Dict[str, str]
    supported_formats: List[str]
    max_file_size_mb: int
    vad_method_documentation: str
