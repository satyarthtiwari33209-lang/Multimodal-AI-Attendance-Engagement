import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0" if os.getenv("RENDER") else "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Comma-separated list of origins (or "*" for open access)
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
        ).split(",")
        if origin.strip()
    ]
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")

    # Database URL: normalize postgres:// to postgresql:// for SQLAlchemy compatibility on Render
    _raw_db_url: str = os.getenv("DATABASE_URL", "sqlite:///./attendance_agent.db")
    if _raw_db_url.startswith("postgres://"):
        DATABASE_URL: str = _raw_db_url.replace("postgres://", "postgresql://", 1)
    else:
        DATABASE_URL: str = _raw_db_url

    # Thresholds
    ATTENTION_THRESHOLD: float = float(os.getenv("ATTENTION_THRESHOLD", "0.60"))
    DROWSINESS_THRESHOLD: float = float(os.getenv("DROWSINESS_THRESHOLD", "0.35"))
    AUDIO_SPEECH_THRESHOLD: float = float(os.getenv("AUDIO_SPEECH_THRESHOLD", "0.08"))
    
    # Multimodal weights
    VISION_WEIGHT: float = float(os.getenv("ENGAGEMENT_FUSION_VISION_WEIGHT", "0.60"))
    AUDIO_WEIGHT: float = float(os.getenv("ENGAGEMENT_FUSION_AUDIO_WEIGHT", "0.40"))
    
    # Audio Settings
    AUDIO_PROCESSING_ENABLED: bool = os.getenv("AUDIO_PROCESSING_ENABLED", "true").lower() in ("true", "1", "yes")
    
    AUTO_SEED_DEMO_DATA: bool = os.getenv("AUTO_SEED_DEMO_DATA", "true").lower() in ("true", "1", "yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-multimodal-agent-secret-key-change-in-production")

settings = Settings()
