from __future__ import annotations

from beanie import Document, Link
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .pet import Pet # Import model Pet


class UsedProduct(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


class UsedService(BaseModel):
    name: str
    price: float = Field(..., gt=0)
# Định nghĩa các loại bản ghi y tế
class RecordType(str, Enum):
    VACCINATION = "vaccination"
    VET_VISIT = "vet_visit"
    WEIGHT_CHECK = "weight_check"
    MEDICATION = "medication"

class HealthRecord(Document):
    # Liên kết tới document Pet tương ứng
    pet: Link[Pet]
    
    record_type: RecordType
    date: datetime
    description: str = Field(..., max_length=200)
    notes: Optional[str] = None
    
    # Các trường tùy chọn cho từng loại record
    next_due_date: Optional[datetime] = None # Dùng cho tiêm chủng
    weight_kg: Optional[float] = Field(None, gt=0) # Dùng cho kiểm tra cân nặng
    # Nếu trong lần khám có dùng sản phẩm (thuốc, vật tư), lưu lại snapshot
    used_products: Optional[List[UsedProduct]] = None
    # Dịch vụ (ví dụ: tiêm phòng, khám bệnh) kèm giá (snapshot)
    used_services: Optional[List[UsedService]] = None
    
    class Settings:
        name = "health_records"