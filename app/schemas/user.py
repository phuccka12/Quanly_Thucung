from __future__ import annotations
from typing import List
from app.models.user import User
from typing import Optional
import pydantic
from pydantic import BaseModel, EmailStr, Field


# Helper: kiểm tra Pydantic v2 hay v1
PYDANTIC_V2 = int(pydantic.__version__.split(".")[0]) >= 2


# Schema cho dữ liệu người dùng gửi lên khi đăng ký
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


# Schema cho dữ liệu trả về khi lấy thông tin người dùng
# Quan trọng: Không bao giờ trả về password!
class UserRead(BaseModel):
    id: str = Field(..., alias="_id")  # Beanie/MongoDB dùng _id
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool

    if PYDANTIC_V2:
        # pydantic v2
        model_config = {"populate_by_name": True}
        from pydantic import field_validator

        @field_validator("id", mode="before")
        @classmethod
        def _coerce_id(cls, v):
            if v is None:
                return v
            try:
                return str(v)
            except Exception:
                return v
    else:
        # pydantic v1
        class Config:
            allow_population_by_field_name = True

        from pydantic import validator

        @validator("id", pre=True, always=True)
        def _coerce_id(cls, v):
            if v is None:
                return v
            try:
                return str(v)
            except Exception:
                return v
