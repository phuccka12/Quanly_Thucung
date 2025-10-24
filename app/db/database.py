import motor.motor_asyncio
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User  # Chúng ta sẽ tạo file này ngay sau đây
from app.models.pet import Pet  # Chúng ta sẽ tạo file này ngay sau đây
from app.models.health_record import HealthRecord  # Chúng ta sẽ tạo file này ngay sau đây
from app.models.scheduled_event import ScheduledEvent
from app.models.product import Product
from app.models.service import Service
async def init_db():
    # Tạo client kết nối tới MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)

    # Khởi tạo Beanie với database và các Document models
    # Beanie sẽ dùng các model này để tạo collection trong DB
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[
            User,
            Pet,
            HealthRecord,
            ScheduledEvent,
            Product,
            Service
        ]
    )