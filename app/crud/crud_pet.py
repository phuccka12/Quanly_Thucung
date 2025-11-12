from typing import List, Optional
import datetime
import logging
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate

async def create_pet(pet_in: PetCreate) -> Pet:
    """
    Tạo một hồ sơ thú cưng mới trong database.
    """
    # Tạo một đối tượng Pet model từ dữ liệu schema PetCreate
    pet = Pet(**pet_in.dict())
    
    # Dùng Beanie để lưu vào MongoDB
    await pet.insert()
    return pet

async def get_all_pets(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None # Thêm tham số search
) -> List[Pet]:
    """
    Lấy danh sách thú cưng từ database với phân trang và tìm kiếm.
    """
    query = Pet.find_all()
    
    # Nếu có tham số search, thêm điều kiện lọc vào câu truy vấn
    if search:
        # Sử dụng regex để tìm kiếm không phân biệt hoa thường
        # Sử dụng regex để tìm kiếm không phân biệt hoa thường
        # Tìm theo 'owner_name' (tên chủ nuôi) hoặc 'species' (loài)
        search_regex = {"$regex": search, "$options": "i"}
        query = Pet.find(
            {
                "$or": [
                    {"owner_name": search_regex},
                    {"species": search_regex},
                ]
            }
        )
        
    pets = await query.skip(skip).limit(limit).to_list()
    return pets

async def get_all_pets_with_count(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> tuple[List[Pet], int]:
    """
    Lấy danh sách thú cưng với tổng số lượng cho phân trang.
    """
    query = Pet.find_all()
    
    if search:
        # Search by owner name or species (loài)
        search_regex = {"$regex": search, "$options": "i"}
        query = Pet.find(
            {
                "$or": [
                    {"owner_name": search_regex},
                    {"species": search_regex},
                ]
            }
        )
    
    # Lấy tổng số
    total = await query.count()
    
    # Lấy data với phân trang
    pets = await query.skip(skip).limit(limit).to_list()
    
    return pets, total

async def get_pet_by_id(pet_id: str) -> Optional[Pet]:
    """ 
    Lấy thông tin một thú cưng theo ID.
    """
    pet = await Pet.get(pet_id)
    return pet


async def get_pets_for_owner(
    owner_email: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> tuple[List[Pet], int]:
    """
    Lấy danh sách thú cưng thuộc về một chủ (owner_email) với phân trang và tìm kiếm.
    Trả về (pets, total)
    """
    query = Pet.find({"owner_email": owner_email})
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query = Pet.find({"owner_email": owner_email, "$or": [{"name": search_regex}, {"breed": search_regex}]})
    total = await query.count()
    pets = await query.skip(skip).limit(limit).to_list()
    return pets, total


async def create_pet_for_owner(owner_email: str, owner_name: str, pet_in: PetCreate) -> Pet:
    """
    Tạo pet và gán owner_email/owner_name trước khi lưu.
    """
    # Prevent duplicate owner fields if client accidentally included them
    pet_data = pet_in.dict()
    pet_data.pop('owner_email', None)
    pet_data.pop('owner_name', None)
    pet = Pet(**pet_data, owner_email=owner_email, owner_name=owner_name)
    await pet.insert()
    return pet


async def get_pet_by_id_for_owner(pet_id: str, owner_email: str) -> Optional[Pet]:
    pet = await Pet.get(pet_id)
    if not pet:
        return None
    if getattr(pet, 'owner_email', None) != owner_email:
        return None
    return pet
async def update_pet(pet: Pet, pet_in: PetUpdate) -> Pet:
    """
    Cập nhật thông tin một thú cưng.
    """
    # Lấy dữ liệu cần update, chỉ lấy các trường được cung cấp
    update_data = pet_in.dict(exclude_unset=True)

    # Normalize types coming from frontend: convert strings to proper types
    logger = logging.getLogger("app.crud.pet")
    for key, value in list(update_data.items()):
        # Convert date_of_birth if it's a string
        if key == "date_of_birth" and value is not None:
            if isinstance(value, str):
                try:
                    update_data[key] = datetime.date.fromisoformat(value)
                except Exception:
                    try:
                        update_data[key] = datetime.datetime.fromisoformat(value).date()
                    except Exception:
                        logger.debug("Could not parse date_of_birth=%r", value)
        # Convert weight_kg to float if it's a string
        if key == "weight_kg" and value is not None:
            if isinstance(value, str):
                try:
                    update_data[key] = float(value)
                except Exception:
                    logger.debug("Could not parse weight_kg=%r", value)

    logger.info("Updating pet %s with: %s", getattr(pet, 'id', '<unknown>'), update_data)

    # Cập nhật đối tượng pet hiện tại với dữ liệu mới
    for field, value in update_data.items():
        # ensure no problematic non-serializable types remain
        if isinstance(value, datetime.date):
            # convert to ISO string to avoid encoder issues
            setattr(pet, field, value.isoformat())
        else:
            setattr(pet, field, value)

    # Lưu lại vào database - catch and log encoding errors for debugging
    try:
        await pet.save()
    except Exception as e:
        logger.exception("Failed to save pet %s after update; update_data=%s", getattr(pet, 'id', '<unknown>'), update_data)
        raise
    return pet 
# Hàm xóa pet
async def delete_pet(pet: Pet) -> None:
    """         
    Xóa một hồ sơ thú cưng khỏi database.
    """
    await pet.delete()
    return None


async def cleanup_placeholder_strings() -> dict:
    """
    Scan pets collection for fields containing the literal value 'string'
    and replace with appropriate empty values. Returns a summary dict.
    This is intended as an admin maintenance utility to fix bad seed data.
    """
    # We'll use raw motor collection operations for bulk updates
    coll = Pet.get_motor_collection()
    # Fields we want to clean and their replacement logic
    fields_to_clean = [
        ('name', ''),
        ('species', ''),
        ('breed', ''),
        ('gender', None),
        ('date_of_birth', None),
        ('owner_name', ''),
        ('owner_phone', None),
        ('avatar_url', None),
    ]

    total_updated = 0
    details = {}
    for field, replacement in fields_to_clean:
        query = {field: 'string'}
        update = {'$set': {field: replacement}}
        result = await coll.update_many(query, update)
        details[field] = result.modified_count
        total_updated += result.modified_count

    return {'total_updated': total_updated, 'per_field': details}
