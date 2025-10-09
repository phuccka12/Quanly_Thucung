from beanie import Document, Link
from pydantic import Field
from typing import Optional
from datetime import date
from enum import Enum
from .pet import Pet # Import model Pet

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
    date: date
    description: str = Field(..., max_length=200)
    notes: Optional[str] = None
    
    # Các trường tùy chọn cho từng loại record
    next_due_date: Optional[date] = None # Dùng cho tiêm chủng
    weight_kg: Optional[float] = Field(None, gt=0) # Dùng cho kiểm tra cân nặng
    
    class Settings:
        name = "health_records"