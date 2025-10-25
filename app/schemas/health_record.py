from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId
from app.models.health_record import RecordType
from pydantic import BaseModel, Field
from typing import List


class UsedProductSchema(BaseModel):
    product_id: PydanticObjectId
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class UsedServiceSchema(BaseModel):
    name: str
    price: float = Field(..., gt=0)

class HealthRecordBase(BaseModel):
    record_type: RecordType
    date: datetime
    description: str = Field(..., max_length=200)
    notes: Optional[str] = None
    next_due_date: Optional[datetime] = None
    weight_kg: Optional[float] = Field(None, gt=0)

class HealthRecordCreate(HealthRecordBase):
    # Cho phép gửi thông tin sản phẩm/dịch vụ được sử dụng trong lần khám
    used_products: Optional[List[UsedProductSchema]] = None
    used_services: Optional[List[UsedServiceSchema]] = None

class HealthRecordRead(HealthRecordBase):
    id: PydanticObjectId = Field(..., alias="_id")
    pet_id: PydanticObjectId # Thêm pet_id để biết record này của pet nào
    used_products: Optional[List[UsedProductSchema]] = None
    used_services: Optional[List[UsedServiceSchema]] = None

    class Config:
        from_attributes = True
        populate_by_name = True 

class HealthRecordUpdate(BaseModel):
    record_type: Optional[RecordType] = None
    date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    next_due_date: Optional[datetime] = None
    weight_kg: Optional[float] = Field(None, gt=0)