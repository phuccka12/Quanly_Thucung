from beanie import Document
from pydantic import Field, EmailStr
from typing import Optional
from enum import Enum  # <-- 1. Import Enum

# 2. Định nghĩa các vai trò người dùng bằng Enum
# Kế thừa từ str giúp Enum tương thích tốt hơn với Pydantic và JSON
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class User(Document):
    full_name: Optional[str] = None
    email: EmailStr
    hashed_password: str
    is_active: bool = True
    
    # 3. Thêm trường role với giá trị mặc định là "user"
    role: UserRole = Field(default=UserRole.USER)

    class Settings:
        name = "users"