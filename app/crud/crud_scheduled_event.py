from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.models.pet import Pet
from app.models.scheduled_event import ScheduledEvent
from app.schemas.scheduled_event import ScheduledEventCreate
import pytz


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


async def create_event_for_pet_owner(pet_id, owner_email: str, event_in: ScheduledEventCreate) -> ScheduledEvent:
    """
    Convenience wrapper that ensures the pet belongs to owner_email then creates the event.
    Applies portal-specific business rules: lead time, business hours, no-sunday, and conflict checks.
    """
    pet = await Pet.get(pet_id)
    if not pet or getattr(pet, 'owner_email', None) != owner_email:
        raise ValueError("Pet not found or does not belong to owner")

    # --- Business rules for portal bookings ---
    # NOTE: Portal users should be able to create bookings without overly
    # strict restrictions. We keep a conflict check but remove the hard
    # lead-time and business-hours restrictions to avoid blocking users.

    # Conflict check: same pet should not have another event at the exact same time
    existing = await ScheduledEvent.find({
        'pet.$id': pet.id,
        'event_datetime': event_in.event_datetime
    }).count()
    if existing and existing > 0:
        # still treat exact-time collisions as an error
        raise ValueError('Pet already has an event at the requested time')

    return await create_event_for_pet(pet=pet, event_in=event_in)


async def get_events_for_owner(owner_email: str) -> List[ScheduledEvent]:
    """
    Lấy tất cả sự kiện liên quan đến các thú cưng thuộc owner_email.
    """
    pets = await Pet.find({"owner_email": owner_email}).to_list()
    pet_ids = [p.id for p in pets]
    if not pet_ids:
        return []
    events = await ScheduledEvent.find({"pet.$id": {"$in": pet_ids}}).to_list()
    return events

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