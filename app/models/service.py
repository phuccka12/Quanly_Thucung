# /app/models/service.py
from beanie import Document
from pydantic import Field
from typing import Optional

class Service(Document):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0) # Giá dịch vụ

    class Settings:
        name = "services"