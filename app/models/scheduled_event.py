from beanie import Document, Link
from pydantic import Field
from typing import Optional
from datetime import datetime # Dùng datetime để lưu cả ngày và giờ
from enum import Enum
from .pet import Pet

# Định nghĩa các loại sự kiện
class EventType(str, Enum):
    APPOINTMENT = "appointment" # Lịch hẹn (VD: khám bệnh, spa)
    MEDICATION = "medication"   # Lịch uống thuốc
    FEEDING = "feeding"         # Lịch cho ăn
    ACTIVITY = "activity"       # Hoạt động khác (VD: đi dạo)

class ScheduledEvent(Document):
    # Liên kết tới document Pet tương ứng
    pet: Link[Pet]
    
    title: str = Field(..., max_length=100)
    event_datetime: datetime # Thời gian diễn ra sự kiện
    event_type: EventType
    description: Optional[str] = None
    
    is_completed: bool = Field(default=False) # Trạng thái hoàn thành
    reminder_sent: bool = Field(default=False)  # Trạng thái đã gửi nhắc nhở hay chưa
    class Settings:
        name = "scheduled_events"