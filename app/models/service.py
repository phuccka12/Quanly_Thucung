# /app/models/service.py
from beanie import Document
from pydantic import Field
from typing import Optional

class Service(Document):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0) # Giá dịch vụ
    duration_minutes: int = Field(default=30) # Thời gian thực hiện (phút)
    category: Optional[str] = None # Danh mục dịch vụ
    image_url: Optional[str] = Field(None) # URL ảnh dịch vụ

    class Settings:
        name = "services"