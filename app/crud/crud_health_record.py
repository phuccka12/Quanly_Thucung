from typing import List, Optional
from beanie import PydanticObjectId 

from app.models.pet import Pet
from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordCreate
from app.schemas.health_record import HealthRecordUpdate
from app.models.product import Product
from bson import ObjectId
from app.core.config import settings
async def create_health_record_for_pet(
    pet: Pet, 
    record_in: HealthRecordCreate
) -> HealthRecord:
    """
    Tạo một bản ghi y tế mới cho một thú cưng cụ thể.
    """
    # Nếu có sản phẩm được sử dụng, cố gắng giảm tồn kho trước khi tạo record.
    motor_coll = Product.get_motor_collection()
    decremented = []  # keep track to rollback if needed

    try:
        if record_in.used_products:
            for up in record_in.used_products:
                pid = ObjectId(str(up.product_id))
                q = int(up.quantity)
                # Attempt atomic decrement only if enough stock
                res = await motor_coll.update_one(
                    {"_id": pid, "stock_quantity": {"$gte": q}},
                    {"$inc": {"stock_quantity": -q}}
                )
                if res.modified_count == 0:
                    # Not enough stock or product not found
                    raise ValueError(f"Insufficient stock for product {up.product_id}")
                decremented.append((pid, q))

        # Nếu đến đây, các cập nhật tồn kho thành công - tạo HealthRecord
        record = HealthRecord(
            **record_in.dict(),
            pet=pet
        )
        await record.insert()
        return record
    except Exception as e:
        # rollback any decremented stock
        if decremented:
            for pid, q in decremented:
                try:
                    await motor_coll.update_one({"_id": pid}, {"$inc": {"stock_quantity": q}})
                except Exception:
                    # If rollback fails, log/print - but continue raising original
                    print(f"CRITICAL: Failed to rollback stock for {pid}")
        # Re-raise as HTTP-friendly error upstream; here just raise
        raise

async def get_health_records_for_pet(pet_id: PydanticObjectId) -> List[HealthRecord]:
    """
    Lấy danh sách tất cả các bản ghi y tế của một thú cưng.
    """
    # Tìm tất cả các record có trường 'pet._id' khớp với pet_id
    records = await HealthRecord.find({"pet.$id": pet_id}).to_list()
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
    update_data = record_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    await record.save()
    return record 

async def delete_health_record(record: HealthRecord) -> None:
    """
    Xóa một bản ghi y tế khỏi database.
    """
    await record.delete()
    return None