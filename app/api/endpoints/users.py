from fastapi import APIRouter, HTTPException
# ĐÂY LÀ DÒNG ĐÚNG
from app.schemas.user import UserRead, UserCreate
from app.crud import crud_user  # Import your CRUD logic
from pymongo.errors import DuplicateKeyError  # Import the exception for duplicate keys
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