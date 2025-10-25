from pydantic import BaseModel, Field
from typing import Optional
from beanie import PydanticObjectId

# Các trường cơ bản của một dịch vụ
class ServiceBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    duration_minutes: Optional[int] = Field(30)
    category: Optional[str] = None
    image_url: Optional[str] = None

# Schema dùng khi tạo mới dịch vụ
class ServiceCreate(ServiceBase):
    pass

# Schema dùng khi cập nhật dịch vụ
class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    duration_minutes: Optional[int] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

# Schema dùng để trả về dữ liệu cho client
class ServiceRead(ServiceBase):
    id: PydanticObjectId = Field(..., alias="_id")

    class Config:
        orm_mode = True
        populate_by_name = True