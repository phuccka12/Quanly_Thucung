from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/")
async def get_meta():
    """Return small site metadata for frontend (cancel window, support phone)."""
    return {
        "cancel_window_hours": int(getattr(settings, 'CANCEL_WINDOW_HOURS', 24)),
        "support_phone": getattr(settings, 'SUPPORT_PHONE', None)
    }
