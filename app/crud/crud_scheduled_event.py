from typing import List
from datetime import datetime, timezone

from app.models.pet import Pet
from app.models.scheduled_event import ScheduledEvent
from app.schemas.scheduled_event import ScheduledEventCreate

async def create_event_for_pet(
    pet: Pet, 
    event_in: ScheduledEventCreate
) -> ScheduledEvent:
    """
    Tạo một sự kiện mới cho một thú cưng cụ thể.
    """
    event = ScheduledEvent(
        **event_in.model_dump(),
        pet=pet
    )
    await event.insert()
    return event

async def get_upcoming_events(
    skip: int = 0, 
    limit: int = 100
) -> List[ScheduledEvent]:
    """
    Lấy danh sách tất cả các sự kiện chưa hoàn thành và sắp diễn ra trong tương lai,
    sắp xếp theo thời gian gần nhất trước.
    """
    # Lấy thời gian hiện tại theo múi giờ UTC để so sánh
    now = datetime.now(timezone.utc)
    
    # Tìm tất cả các sự kiện:
    # 1. Chưa được đánh dấu là hoàn thành (is_completed == False)
    # 2. Có thời gian diễn ra trong tương lai (event_datetime >= now)
    # Sắp xếp theo thời gian diễn ra tăng dần (+ScheduledEvent.event_datetime)
    events = await ScheduledEvent.find(
        ScheduledEvent.is_completed == False,
        ScheduledEvent.event_datetime >= now
    ).sort(+ScheduledEvent.event_datetime).skip(skip).limit(limit).to_list()
    
    return events