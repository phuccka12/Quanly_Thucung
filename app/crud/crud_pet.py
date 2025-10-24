from typing import List, Optional
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate

async def create_pet(pet_in: PetCreate) -> Pet:
    """
    Tạo một hồ sơ thú cưng mới trong database.
    """
    # Tạo một đối tượng Pet model từ dữ liệu schema PetCreate
    pet = Pet(**pet_in.model_dump())
    
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
        # Tìm trong cả trường 'name' của thú cưng và 'owner_name' của chủ
        search_regex = {"$regex": search, "$options": "i"}
        query = Pet.find(
            {
                "$or": [
                    {"name": search_regex},
                    {"owner_name": search_regex},
                ]
            }
        )
        
    pets = await query.skip(skip).limit(limit).to_list()
    return pets

async def get_pet_by_id(pet_id: str) -> Optional[Pet]:
    """ 
    Lấy thông tin một thú cưng theo ID.
    """
    pet = await Pet.get(pet_id)
    return pet
async def update_pet(pet: Pet, pet_in: PetUpdate) -> Pet:
    """
    Cập nhật thông tin một thú cưng.
    """
    # Lấy dữ liệu cần update, chỉ lấy các trường được cung cấp
    update_data = pet_in.model_dump(exclude_unset=True)
    
    # Cập nhật đối tượng pet hiện tại với dữ liệu mới
    pet = pet.model_copy(update=update_data)
    
    # Lưu lại vào database
    await pet.save()
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
