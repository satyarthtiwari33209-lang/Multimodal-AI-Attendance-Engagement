from routers.students import router as students_router
from routers.sessions import router as sessions_router
from routers.attendance import router as attendance_router
from routers.multimodal import router as multimodal_router
from routers.analytics import router as analytics_router
from routers.insights import router as insights_router
from routers.vision import router as vision_router
from routers.audio import router as audio_router
from routers.recommendations import router as recommendations_router

__all__ = [
    "students_router",
    "sessions_router",
    "attendance_router",
    "multimodal_router",
    "analytics_router",
    "insights_router",
    "vision_router",
    "audio_router",
    "recommendations_router"
]

