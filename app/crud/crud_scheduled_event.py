from typing import List, Optional
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
        **event_in.dict(),
        pet=pet
    )
    await event.insert()
    return event

async def get_upcoming_events_with_count(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> tuple[List[ScheduledEvent], int]:
    """
    Lấy danh sách tất cả các sự kiện chưa hoàn thành và sắp diễn ra trong tương lai,
    sắp xếp theo thời gian gần nhất trước. Trả về (events, total_count)
    """
    # Lấy thời gian hiện tại theo múi giờ UTC để so sánh
    now = datetime.now(timezone.utc)
    
    # Query cơ bản
    query = ScheduledEvent.find(
        ScheduledEvent.is_completed == False,
        ScheduledEvent.event_datetime >= now
    )
    
    # Thêm điều kiện search nếu có
    if search:
        query = query.find({"title": {"$regex": search, "$options": "i"}})
    
    # Đếm tổng số events thỏa mãn điều kiện
    total = await query.count()
    
    # Lấy events với pagination
    events = await query.sort(+ScheduledEvent.event_datetime).skip(skip).limit(limit).to_list()
    
    return events, total


async def get_past_events_with_count(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> tuple[List[ScheduledEvent], int]:
    """
    Lấy danh sách các sự kiện đã diễn ra (event_datetime < now).
    Trả về (events, total_count)
    """
    now = datetime.now(timezone.utc)

    # Query events strictly in the past
    query = ScheduledEvent.find(
        ScheduledEvent.event_datetime < now
    )

    if search:
        query = query.find({"title": {"$regex": search, "$options": "i"}})

    total = await query.count()
    events = await query.sort(-ScheduledEvent.event_datetime).skip(skip).limit(limit).to_list()
    return events, total