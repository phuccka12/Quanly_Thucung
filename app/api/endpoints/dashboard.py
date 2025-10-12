from fastapi import APIRouter, Depends
from app.schemas.dashboard import DashboardData
from app.crud import crud_dashboard
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=DashboardData)
async def read_dashboard_data(
    *,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy dữ liệu thống kê cho trang dashboard. (Chỉ dành cho Admin)
    """
    return await crud_dashboard.get_dashboard_data()