from typing import Optional
# Import thêm UserRole từ model
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.services.security import get_password_hash

async def create_user(user_in: UserCreate) -> User:
    """
    Tạo người dùng mới trong database.
    """
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        # THAY ĐỔI DUY NHẤT: Tạm thời gán vai trò là ADMIN cho mọi user mới
        role=UserRole.ADMIN
    )
    await user.insert()
    return user

async def get_user_by_email(email: str) -> Optional[User]:
    # ... (giữ nguyên không đổi)
    return await User.find_one(User.email == email)