from typing import List, Optional
from beanie import PydanticObjectId 

from app.models.pet import Pet
from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordCreate
from app.schemas.health_record import HealthRecordUpdate
async def create_health_record_for_pet(
    pet: Pet, 
    record_in: HealthRecordCreate
) -> HealthRecord:
    """
    Tạo một bản ghi y tế mới cho một thú cưng cụ thể.
    """
    # Tạo một đối tượng HealthRecord từ dữ liệu schema
    record = HealthRecord(
        **record_in.model_dump(),
        pet=pet  # Gán liên kết tới đối tượng Pet
    )
    
    # Lưu vào MongoDB
    await record.insert()
    return record

async def get_health_records_for_pet(pet_id: PydanticObjectId) -> List[HealthRecord]:
    """
    Lấy danh sách tất cả các bản ghi y tế của một thú cưng.
    """
    # Tìm tất cả các record có trường 'pet._id' khớp với pet_id
    records = await HealthRecord.find(HealthRecord.pet.id == pet_id).to_list()
    return records 

async def get_health_record_by_id(record_id: PydanticObjectId) -> Optional[HealthRecord]:
    """
    Lấy một bản ghi y tế bằng ID của nó.
    """
    return await HealthRecord.get(record_id)

async def update_health_record(
    record: HealthRecord, 
    record_in: HealthRecordUpdate
) -> HealthRecord:
    """
    Cập nhật thông tin một bản ghi y tế.
    """
    update_data = record_in.model_dump(exclude_unset=True)
    record = record.model_copy(update=update_data)
    await record.save()
    return record 

async def delete_health_record(record: HealthRecord) -> None:
    """
    Xóa một bản ghi y tế khỏi database.
    """
    await record.delete()
    return None