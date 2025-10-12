from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from beanie import PydanticObjectId
from app.models.scheduled_event import EventType
import pytz # <-- Thêm pytz

class ScheduledEventBase(BaseModel):
    title: str = Field(..., max_length=100)
    event_datetime: datetime
    event_type: EventType
    description: Optional[str] = None
    is_completed: bool = False

    # --- THÊM BỘ VALIDATOR VÀO ĐÂY ---
    @validator('event_datetime', pre=True, always=True)
    def convert_to_utc(cls, v: datetime) -> datetime:
        """Tự động chuyển đổi datetime sang UTC nếu nó không có múi giờ."""
        # Nếu datetime nhập vào không có thông tin múi giờ (naive)
        if v.tzinfo is None:
            # Gán cho nó múi giờ của Việt Nam
            local_tz = pytz.timezone('Asia/Ho_Chi_Minh')
            v = local_tz.localize(v)
        
        # Chuyển đổi về múi giờ UTC để lưu trữ và xử lý
        return v.astimezone(pytz.utc)

# ... (Các class ScheduledEventCreate và ScheduledEventRead giữ nguyên, không cần sửa) ...
class ScheduledEventCreate(ScheduledEventBase):
    pass

class ScheduledEventRead(ScheduledEventBase):
    id: PydanticObjectId = Field(..., alias="_id")
    pet_id: PydanticObjectId

    class Config:
        from_attributes = True
        populate_by_name = True