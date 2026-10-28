from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from database import get_db
from services.analytics import analytics_module

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview", response_model=Dict[str, Any])
def get_analytics_overview(db: Session = Depends(get_db)):
    """Fetch global dashboard summary cards and high-level health indicators."""
    return analytics_module.get_dashboard_summary(db)

@router.get("/session/{session_id}/trends", response_model=Dict[str, Any])
def get_session_trends(session_id: int, db: Session = Depends(get_db)):
    """Fetch minute-by-minute engagement, visual attention, and audio participation curves."""
    return analytics_module.get_session_trends(db, session_id)

@router.get("/leaderboard", response_model=List[Dict[str, Any]])
def get_student_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    """Fetch student leaderboard sorted by overall engagement score."""
    return analytics_module.get_student_leaderboard(db, limit)
