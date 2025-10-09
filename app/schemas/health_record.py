from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from beanie import PydanticObjectId
from app.models.health_record import RecordType

class HealthRecordBase(BaseModel):
    record_type: RecordType
    date: date
    description: str = Field(..., max_length=200)
    notes: Optional[str] = None
    next_due_date: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)

class HealthRecordCreate(HealthRecordBase):
    pass # Dữ liệu gửi lên không cần pet_id vì nó sẽ nằm trên URL

class HealthRecordRead(HealthRecordBase):
    id: PydanticObjectId = Field(..., alias="_id")
    pet_id: PydanticObjectId # Thêm pet_id để biết record này của pet nào

    class Config:
        from_attributes = True
        populate_by_name = True 

class HealthRecordUpdate(BaseModel):
    record_type: Optional[RecordType] = None
    date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    next_due_date: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)