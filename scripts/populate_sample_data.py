import asyncio
from datetime import datetime, timedelta
from app.db.database import init_db
from app.crud import crud_user, crud_pet, crud_product, crud_service, crud_health_record, crud_scheduled_event
from app.schemas.user import UserCreate
from app.schemas.pet import PetCreate
from app.schemas.product import ProductCreate
from app.schemas.service import ServiceCreate
from app.schemas.health_record import HealthRecordCreate
from app.schemas.scheduled_event import ScheduledEventCreate
from app.models.pet import Pet
from app.models.scheduled_event import EventType

async def main():
    await init_db()
    print("Đang thêm dữ liệu mẫu...")

    # Tạo thêm một số user mẫu
    users_data = [
        {"email": "nguyenvana@example.com", "password": "password123", "full_name": "Nguyễn Văn A"},
        {"email": "tranthib@example.com", "password": "password123", "full_name": "Trần Thị B"},
        {"email": "levanc@example.com", "password": "password123", "full_name": "Lê Văn C"},
    ]

    users = []
    for user_data in users_data:
        user_in = UserCreate(**user_data)
        user = await crud_user.create_user(user_in=user_in)
        users.append(user)
        print(f"Đã tạo user: {user.email}")

    # Tạo thú cưng mẫu
    pets_data = [
        {"name": "Max", "species": "Chó", "breed": "Golden Retriever", "age": 3, "weight": 25.5, "owner_name": "Nguyễn Văn A", "owner_email": "nguyenvana@example.com", "owner_phone": "0123456789"},
        {"name": "Bella", "species": "Mèo", "breed": "Persian", "age": 2, "weight": 4.2, "owner_name": "Trần Thị B", "owner_email": "tranthib@example.com", "owner_phone": "0987654321"},
        {"name": "Charlie", "species": "Chó", "breed": "Bulldog", "age": 4, "weight": 22.0, "owner_name": "Lê Văn C", "owner_email": "levanc@example.com", "owner_phone": "0111111111"},
        {"name": "Luna", "species": "Mèo", "breed": "Siamese", "age": 1, "weight": 3.8, "owner_name": "Nguyễn Văn A", "owner_email": "nguyenvana@example.com", "owner_phone": "0123456789"},
        {"name": "Rocky", "species": "Chó", "breed": "German Shepherd", "age": 5, "weight": 30.0, "owner_name": "Trần Thị B", "owner_email": "tranthib@example.com", "owner_phone": "0987654321"},
    ]

    pets = []
    for pet_data in pets_data:
        pet_in = PetCreate(**pet_data)
        pet = await crud_pet.create_pet(pet_in=pet_in)
        pets.append(pet)
        print(f"Đã tạo pet: {pet.name} ({pet.species})")

    # Tạo sản phẩm mẫu
    products_data = [
        {"name": "Thức ăn cho chó cao cấp", "description": "Thức ăn dinh dưỡng cho chó mọi lứa tuổi", "price": 450000, "stock_quantity": 50, "category": "Thức ăn"},
        {"name": "Vòng cổ da", "description": "Vòng cổ da thật chất lượng cao", "price": 120000, "stock_quantity": 30, "category": "Phụ kiện"},
        {"name": "Thuốc trị ve rận", "description": "Thuốc nhỏ ngoài da trị ve rận hiệu quả", "price": 85000, "stock_quantity": 20, "category": "Thuốc"},
        {"name": "Lồng vận chuyển", "description": "Lồng nhựa an toàn cho thú cưng", "price": 350000, "stock_quantity": 15, "category": "Phụ kiện"},
        {"name": "Thức ăn cho mèo vị cá", "description": "Thức ăn ướt cho mèo vị cá ngừ", "price": 25000, "stock_quantity": 100, "category": "Thức ăn"},
    ]

    products = []
    for product_data in products_data:
        product_in = ProductCreate(**product_data)
        product = await crud_product.create_product(product_in=product_in)
        products.append(product)
        print(f"Đã tạo product: {product.name}")

    # Tạo dịch vụ mẫu
    services_data = [
        {"name": "Tắm rửa cơ bản", "description": "Dịch vụ tắm rửa và chải lông cơ bản", "price": 150000, "duration_minutes": 60, "category": "Chăm sóc"},
        {"name": "Cắt tỉa lông", "description": "Dịch vụ cắt tỉa lông chuyên nghiệp", "price": 200000, "duration_minutes": 90, "category": "Chăm sóc"},
        {"name": "Khám sức khỏe tổng quát", "description": "Khám sức khỏe định kỳ cho thú cưng", "price": 300000, "duration_minutes": 30, "category": "Y tế"},
        {"name": "Tiêm phòng", "description": "Tiêm phòng theo lịch khuyến nghị", "price": 250000, "duration_minutes": 15, "category": "Y tế"},
        {"name": "Chụp X-quang", "description": "Chụp X-quang chẩn đoán", "price": 500000, "duration_minutes": 45, "category": "Y tế"},
    ]

    services = []
    for service_data in services_data:
        service_in = ServiceCreate(**service_data)
        service = await crud_service.create_service(service_in=service_in)
        services.append(service)
        print(f"Đã tạo service: {service.name}")

    # # Tạo hồ sơ y tế mẫu
    # health_records_data = [
    #     {"pet_id": pets[0].id, "record_type": RecordType.VET_VISIT, "date": datetime.now().date(), "description": "Khám sức khỏe hàng tháng", "notes": "Thú cưng phát triển tốt"},
    #     {"pet_id": pets[1].id, "record_type": RecordType.VACCINATION, "date": datetime.now().date(), "description": "Tiêm phòng dại", "notes": "Tiêm thành công"},
    #     {"pet_id": pets[2].id, "record_type": RecordType.MEDICATION, "date": datetime.now().date(), "description": "Trị ve rận", "notes": "Đã điều trị xong"},
    # ]

    # for record_data in health_records_data:
    #     pet_obj = await Pet.get(record_data["pet_id"])
    #     record_in = HealthRecordCreate(**{k: v for k, v in record_data.items() if k != "pet_id"})
    #     record = await crud_health_record.create_health_record_for_pet(pet=pet_obj, record_in=record_in)
    #     print(f"Đã tạo health record cho pet {record.pet.id}")

    # Tạo sự kiện theo lịch mẫu
    events_data = [
        {"pet_id": pets[0].id, "event_type": EventType.APPOINTMENT, "title": "Tắm rửa định kỳ", "description": "Tắm rửa và chải lông cho Max", "event_datetime": datetime.now() + timedelta(hours=2), "status": "scheduled"},
        {"pet_id": pets[1].id, "event_type": EventType.APPOINTMENT, "title": "Khám sức khỏe", "description": "Khám định kỳ cho Bella", "event_datetime": datetime.now() + timedelta(days=1), "status": "scheduled"},
        {"pet_id": pets[2].id, "event_type": EventType.MEDICATION, "title": "Tiêm phòng hàng năm", "description": "Tiêm phòng cho Charlie", "event_datetime": datetime.now() + timedelta(days=3), "status": "scheduled"},
        {"pet_id": pets[3].id, "event_type": EventType.APPOINTMENT, "title": "Cắt tỉa lông", "description": "Cắt tỉa lông cho Luna", "event_datetime": datetime.now() + timedelta(days=5), "status": "scheduled"},
    ]

    for event_data in events_data:
        pet_obj = await Pet.get(event_data["pet_id"])
        event_in = ScheduledEventCreate(**{k: v for k, v in event_data.items() if k != "pet_id"})
        event = await crud_scheduled_event.create_event_for_pet(pet=pet_obj, event_in=event_in)
        print(f"Đã tạo scheduled event: {event.title}")

    print("Hoàn thành thêm dữ liệu mẫu!")
    print(f"Đã tạo: {len(users)} users, {len(pets)} pets, {len(products)} products, {len(services)} services, {len(events_data)} events")

if __name__ == "__main__":
    asyncio.run(main())