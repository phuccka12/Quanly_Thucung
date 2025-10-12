from fastapi import APIRouter, HTTPException, Depends
# ĐÂY LÀ DÒNG ĐÚNG
from app.schemas.user import UserCreate, UserRead  # Schemas từ thư mục schemas
from app.models.user import User                   # Model từ thư mục models
from app.crud import crud_user                     # CRUD functions từ thư mục crud
from app.api.deps import get_current_user, get_current_admin_user # Dependency từ file deps
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
router = APIRouter()
@router.post("/register", response_model=UserRead)
async def register_new_user(user_in: UserCreate):
    """
    Tạo người dùng mới.
    """
    try:
        created_user = await crud_user.create_user(user_in=user_in)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    return created_user

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin của người dùng hiện tại đang đăng nhập.
    """
    return current_user