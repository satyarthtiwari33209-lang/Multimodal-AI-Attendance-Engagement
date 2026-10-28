from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class RecommendationItem(BaseModel):
    id: int
    session_id: int
    timestamp: str
    rule_id: str
    rule_name: str
    category: str
    item_type: str = Field(..., description="OBSERVED_MEASUREMENT, STATISTICAL_ESTIMATE, or PEDAGOGICAL_RECOMMENDATION")
    title: str
    suggestion: str
    pedagogical_rationale: str
    supporting_signals: List[str]
    confidence_score: float
    confidence_limitations: str
    severity: str
    is_applied: bool
    teacher_feedback: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class SessionSummaryResponse(BaseModel):
    id: int
    session_id: int
    timestamp: str
    enrolled_student_count: int
    confirmed_attendance_count: int
    attendance_rate: float
    attendance_change_from_prior: Optional[float] = None
    vision_headcount_peak: Optional[int] = None
    speech_ratio: Optional[float] = None
    silence_ratio: Optional[float] = None
    silence_intervals_count: Optional[int] = None
    vocal_participation_index: Optional[float] = None
    dialogue_turns_estimated: Optional[int] = None
    acoustic_environment: Optional[str] = None
    active_modalities: List[str]
    missing_modalities: List[str]
    epistemological_disclaimer: str
    model_config = ConfigDict(from_attributes=True)

class GenerateRecommendationsResponse(BaseModel):
    success: bool
    session_id: int
    summary: SessionSummaryResponse
    recommendations: List[RecommendationItem]
    observed_measurements_count: int
    statistical_estimates_count: int
    pedagogical_recommendations_count: int
    epistemological_notice: str

class ReasoningRuleDocumentation(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    trigger_condition: str
    pedagogical_rationale: str
    suggested_action: str
    required_modalities: List[str]

class TeacherFeedbackRequest(BaseModel):
    feedback: str = Field(..., max_length=255)
