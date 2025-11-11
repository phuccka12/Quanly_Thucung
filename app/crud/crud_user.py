from typing import Optional
# Import thêm UserRole từ model
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.services.security import get_password_hash

async def create_user(user_in: UserCreate, role: UserRole = UserRole.USER) -> User:
    """
    Tạo người dùng mới trong database.

    Mặc định role là UserRole.USER để tránh vô tình tạo admin. Gọi hàm với
    `role=UserRole.ADMIN` khi cần tạo tài khoản admin (ví dụ: helper script).
    """
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role
    )
    await user.insert()
    return user

async def get_user_by_email(email: str) -> Optional[User]:
    # ... (giữ nguyên không đổi)
    return await User.find_one(User.email == email)