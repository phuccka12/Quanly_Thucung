# ...existing code...
import sys
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.scheduled_event import ScheduledEvent

load_dotenv()  # đọc .env từ project root

async def test_db():
    # đọc env (chú ý dùng cùng key với .env của project)
    mongo_url = os.getenv("MONGODB_URL", os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db_name = os.getenv("DATABASE_NAME", "pet_management")

    client = AsyncIOMotorClient(mongo_url)
    try:
        # Khởi tạo Beanie với document models cần thiết
        await init_beanie(database=client[db_name], document_models=[ScheduledEvent])

        print("✅ Kết nối MongoDB thành công!")

        # Đếm số lượng scheduled events
        count = await ScheduledEvent.count()
        print(f"📊 Số lượng scheduled events trong database: {count}")

        # Lấy một vài events mẫu
        events = await ScheduledEvent.find().limit(3).to_list()
        if events:
            print("📅 Các events mẫu:")
            for event in events:
                print(f"  - ID: {getattr(event, 'id', getattr(event, '_id', None))}")
                print(f"    Title: {getattr(event, 'title', None)}")
                print(f"    Pet: {getattr(event, 'pet', None)}")
                print(f"    Datetime: {getattr(event, 'event_datetime', None)}")
                print(f"    Type: {getattr(event, 'event_type', None)}")
                print(f"    Completed: {getattr(event, 'is_completed', None)}")
                print()
        else:
            print("📭 Không có events nào trong database")

        # Kiểm tra trực tiếp collection
        db = client[db_name]
        collection = db.scheduled_events
        doc_count = await collection.count_documents({})
        print(f"📊 Số documents trong collection 'scheduled_events': {doc_count}")
    finally:
        client.close()

if __name__ == "__main__":
    # chạy từ project root (đảm bảo package 'app' có thể import)
    asyncio.run(test_db())
# ...existing code...