"""Script to create test scheduled events for testing search functionality."""
import asyncio
from datetime import datetime, timedelta, timezone
from app.db.database import init_db
from app.crud import crud_pet, crud_scheduled_event
from app.schemas.scheduled_event import ScheduledEventCreate
from app.models.pet import Pet


async def create_test_events():
    await init_db()

    # Get first pet
    pets = await Pet.find().to_list()
    if not pets:
        print("No pets found. Please create pets first.")
        return

    pet = pets[0]
    print(f"Using pet: {pet.name}")

    # Create test events
    now = datetime.now(timezone.utc)

    test_events = [
        {
            "title": "Khám bệnh định kỳ",
            "event_datetime": now + timedelta(days=1),
            "event_type": "appointment",
            "description": "Khám sức khỏe định kỳ cho thú cưng"
        },
        {
            "title": "Uống thuốc kháng sinh",
            "event_datetime": now + timedelta(days=2),
            "event_type": "medication",
            "description": "Uống thuốc kháng sinh 2 lần/ngày"
        },
        {
            "title": "Cho ăn buổi sáng",
            "event_datetime": now + timedelta(hours=6),
            "event_type": "feeding",
            "description": "Cho ăn sáng đúng giờ"
        },
        {
            "title": "Đi dạo công viên",
            "event_datetime": now + timedelta(days=3),
            "event_type": "activity",
            "description": "Đi dạo và vận động"
        }
    ]

    for event_data in test_events:
        event_in = ScheduledEventCreate(**event_data)
        created_event = await crud_scheduled_event.create_event_for_pet(pet=pet, event_in=event_in)
        print(f"Created event: {created_event.title}")

    print("Test events created successfully!")


if __name__ == '__main__':
    asyncio.run(create_test_events())