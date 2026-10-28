import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class SessionSummary(Base):
    """
    Persisted multimodal session summary capturing observed telemetry,
    attendance patterns, acoustic metrics, and active modalities.
    """
    __tablename__ = "session_summaries"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Attendance telemetry
    enrolled_student_count = Column(Integer, default=0)
    confirmed_attendance_count = Column(Integer, default=0)
    attendance_rate = Column(Float, default=0.0)
    attendance_change_from_prior = Column(Float, nullable=True)  # Percentage delta (e.g. -15.0%)
    vision_headcount_peak = Column(Integer, nullable=True)

    # Audio & speech telemetry
    speech_ratio = Column(Float, nullable=True)
    silence_ratio = Column(Float, nullable=True)
    silence_intervals_count = Column(Integer, nullable=True)
    vocal_participation_index = Column(Float, nullable=True)
    dialogue_turns_estimated = Column(Integer, nullable=True)
    acoustic_environment = Column(String(60), nullable=True)

    # Modality tracking
    active_modalities = Column(String(200), default="['attendance']")
    missing_modalities = Column(String(200), default="[]")

    # Epistemological disclaimer
    epistemological_disclaimer = Column(
        Text,
        default=(
            "Observed sensor telemetry measures physical acoustic energy and spatial headcount. "
            "Attention, comprehension, emotion, and learning outcomes are internal cognitive/affective states "
            "that cannot be directly observed by physical sensors."
        )
    )

    session = relationship("ClassSession")
    recommendations = relationship("SessionRecommendation", back_populates="summary", cascade="all, delete-orphan")


class SessionRecommendation(Base):
    """
    Deterministic rule-based pedagogical recommendations supported by measured signals,
    transparent reasoning rules, and epistemological confidence limitations.
    """
    __tablename__ = "session_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    summary_id = Column(Integer, ForeignKey("session_summaries.id", ondelete="CASCADE"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Rule tracking
    rule_id = Column(String(80), nullable=False, index=True)
    rule_name = Column(String(120), nullable=False)
    category = Column(String(50), default="participation")  # participation, pacing, attendance, environment, modality

    # Epistemological classification
    item_type = Column(String(40), default="PEDAGOGICAL_RECOMMENDATION")  # OBSERVED_MEASUREMENT, STATISTICAL_ESTIMATE, PEDAGOGICAL_RECOMMENDATION

    title = Column(String(150), nullable=False)
    suggestion = Column(Text, nullable=False)
    pedagogical_rationale = Column(Text, nullable=False)

    # Supporting measurements (JSON-serialized list of exact observed signals)
    supporting_signals = Column(Text, default="[]")

    # Confidence and limitations
    confidence_score = Column(Float, default=0.85)
    confidence_limitations = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high

    # Teacher action
    is_applied = Column(Boolean, default=False)
    teacher_feedback = Column(String(255), nullable=True)

    session = relationship("ClassSession")
    summary = relationship("SessionSummary", back_populates="recommendations")
