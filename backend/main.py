import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from database import engine, SessionLocal, Base, get_db
import models  # Ensure all SQLAlchemy models are registered

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

from routers import (
    students_router,
    sessions_router,
    attendance_router,
    multimodal_router,
    analytics_router,
    insights_router,
    vision_router,
    audio_router,
    recommendations_router
)
from seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created and seed demo data if empty
    Base.metadata.create_all(bind=engine)
    if settings.AUTO_SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Multimodal Attendance & Engagement Agent API",
    description="Real-time multimodal education analytics platform tracking attendance, gaze, drowsiness, acoustics, and pedagogical interventions.",
    version="1.0.0",
    lifespan=lifespan
)

# Production & Development CORS configuration
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS if origin.strip()]
if "*" in cors_origins or not cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=settings.CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API Routers
app.include_router(students_router)
app.include_router(sessions_router)
app.include_router(attendance_router)
app.include_router(multimodal_router)
app.include_router(analytics_router)
app.include_router(insights_router)
app.include_router(vision_router)
app.include_router(audio_router)
app.include_router(recommendations_router)

@app.get("/")
def root():
    return {
        "name": "Multimodal Attendance & Engagement Agent API",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs",
        "modules": [
            "Vision Module (Biometrics & Attention)",
            "Audio Module (Voice Activity & Acoustic Energy)",
            "Analytics Module (Multimodal Fusion & Trends)",
            "Recommendation Agent (Pedagogical Interventions)"
        ]
    }

@app.get("/health")
def quick_health():
    """Fast top-level health probe for Render, load balancers, and container orchestrators."""
    return {
        "status": "healthy",
        "service": "Multimodal Attendance & Engagement Agent API",
        "environment": settings.ENVIRONMENT
    }

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check endpoint validating database and all multimodal submodules."""
    import datetime
    from services.vision_detector import vision_detector
    from services.audio_intelligence import audio_intelligence

    try:
        from models.student import Student
        from models.session import ClassSession
        from models.recommendation import SessionRecommendation

        student_count = db.query(Student).count()
        session_count = db.query(ClassSession).count()
        recommendation_count = db.query(SessionRecommendation).count()
        vision_status = vision_detector.get_model_status()
        audio_status = audio_intelligence.get_status()

        return {
            "status": "healthy",
            "database": "connected",
            "enrolled_students": student_count,
            "total_sessions": session_count,
            "persisted_recommendations": recommendation_count,
            "environment": settings.ENVIRONMENT,
            "demo_mode_active": True,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "modules": {
                "vision": {
                    "status": "ready" if vision_status.get("has_custom_weights") else "contour_fallback_ready",
                    "detector": vision_status.get("active_detector", "opencv_contour_detector"),
                    "weights_available": vision_status.get("has_custom_weights", False)
                },
                "audio": {
                    "status": "ready" if audio_status["audio_processing_enabled"] else "disabled_by_policy",
                    "killswitch_active": not audio_status["audio_processing_enabled"],
                    "features": ["RMS Energy", "Zero Crossing Rate VAD", "Silence Interval Tracking"]
                },
                "recommendation_agent": {
                    "status": "ready",
                    "engine": "Deterministic Offline Rule Engine",
                    "total_codified_rules": 8,
                    "cloud_api_required": False
                }
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

@app.post("/api/system/reset-demo-data")
def reset_demo_data(db: Session = Depends(get_db)):
    """Wipes and re-initializes SQLite database with pristine demo records."""
    try:
        from models.attendance import AttendanceRecord
        from models.engagement import EngagementLog
        from models.insight import AgentInsight
        from models.recommendation import SessionRecommendation, SessionSummary
        from models.session import ClassSession
        from models.student import Student

        db.query(SessionRecommendation).delete()
        db.query(SessionSummary).delete()
        db.query(AttendanceRecord).delete()
        db.query(EngagementLog).delete()
        db.query(AgentInsight).delete()
        db.query(ClassSession).delete()
        db.query(Student).delete()
        db.commit()

        seed_database(db)
        return {
            "success": True,
            "message": "Demo database successfully re-seeded with students, sessions, telemetry, and rule recommendations.",
            "status": "reseeded"
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
