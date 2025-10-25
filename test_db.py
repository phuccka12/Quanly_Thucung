import asyncio
from app.db.database import init_db
from app.models.scheduled_event import ScheduledEvent
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def test_db():
    load_dotenv()

    # Kết nối đến MongoDB
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)

    # Khởi tạo Beanie
    await init_beanie(database=client.pet_management, document_models=[ScheduledEvent])

    print("✅ Kết nối MongoDB thành công!")

    # Đếm số lượng scheduled events
    count = await ScheduledEvent.count()
    print(f"📊 Số lượng scheduled events trong database: {count}")

    # Lấy một vài events mẫu
    events = await ScheduledEvent.find().limit(3).to_list()
    if events:
        print("📅 Các events mẫu:")
        for event in events:
            print(f"  - ID: {event.id}")
            print(f"    Title: {event.title}")
            print(f"    Pet: {event.pet}")
            print(f"    Datetime: {event.event_datetime}")
            print(f"    Type: {event.event_type}")
            print(f"    Completed: {event.is_completed}")
            print()
    else:
        print("📭 Không có events nào trong database")

    # Test kết nối với collection scheduled_events
    db = client.pet_management
    collection = db.scheduled_events
    doc_count = await collection.count_documents({})
    print(f"📊 Số documents trong collection 'scheduled_events': {doc_count}")

if __name__ == "__main__":
    asyncio.run(test_db())