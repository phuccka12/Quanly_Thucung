from fastapi import APIRouter, Depends, status, HTTPException,Response 
from typing import List, Optional
from app.crud import crud_pet
from app.schemas.pet import PetCreate, PetRead , PetUpdate
from app.crud.crud_pet import (
    create_pet,
    get_all_pets,
    get_pet_by_id,
    update_pet,
    delete_pet,
)
from app.api.deps import get_current_admin_user
from app.models.user import User # Cần import User để type hint
from beanie import PydanticObjectId
from app.schemas.health_record import HealthRecordCreate, HealthRecordRead
from app.crud import crud_health_record
router = APIRouter()


@router.post('/cleanup', summary='Cleanup placeholder values in pets (admin only)')
async def cleanup_pets_placeholders(current_admin: User = Depends(get_current_admin_user)):
    """Admin-only utility to replace literal 'string' placeholders in pet documents."""
    from app.crud.crud_pet import cleanup_placeholder_strings
    result = await cleanup_placeholder_strings()
    return result

@router.post("/", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def create_new_pet(
    *,
    pet_in: PetCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Tạo một hồ sơ thú cưng mới. (Chỉ dành cho Admin)
    """
    return await create_pet(pet_in=pet_in)

#Hàm lấy tất cả pet
@router.get("/", response_model=List[PetRead])
async def read_all_pets(
    *,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None, # <-- Thêm tham số search vào đây
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách tất cả thú cưng với phân trang và tìm kiếm. (Admin only)
    """
    return await crud_pet.get_all_pets(skip=skip, limit=limit, search=search)

#Hàm lấy pet theo ID
@router.get("/{pet_id}", response_model=PetRead)
async def read_pet_by_id(
    *,
    pet_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy thông tin chi tiết của một thú cưng bằng ID. (Chỉ dành cho Admin)
    """
    pet = await get_pet_by_id(pet_id=pet_id)
    
    # Rất quan trọng: Xử lý trường hợp không tìm thấy pet
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    return pet

#Hàm cập nhật pet
@router.put("/{pet_id}", response_model=PetRead)
async def update_pet_by_id(
    *,
    pet_id: PydanticObjectId,
    pet_in: PetUpdate, # Dữ liệu cập nhật từ request body
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Cập nhật thông tin một thú cưng. (Chỉ dành cho Admin)
    """
    # 1. Lấy pet hiện tại từ DB
    existing_pet = await get_pet_by_id(pet_id=pet_id)
    if not existing_pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    
    # 2. Gọi hàm CRUD để cập nhật
    updated_pet = await update_pet(pet=existing_pet, pet_in=pet_in)
    return updated_pet 

#Hàm xóa pet
@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet_by_id(
    *,
    pet_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Xóa một hồ sơ thú cưng. (Chỉ dành cho Admin)
    """
    # 1. Tìm pet trong DB
    pet_to_delete = await crud_pet.get_pet_by_id(pet_id=pet_id)
    if not pet_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    
    # 2. Gọi hàm CRUD để xóa
    await crud_pet.delete_pet(pet=pet_to_delete)
    
    # 3. Trả về response 204
    return Response(status_code=status.HTTP_204_NO_CONTENT) 


@router.post("/{pet_id}/health-records", response_model=HealthRecordRead, status_code=status.HTTP_201_CREATED)
async def create_new_health_record(
    *,
    pet_id: PydanticObjectId,
    record_in: HealthRecordCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    pet = await crud_pet.get_pet_by_id(pet_id=pet_id)
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    
    new_record = await crud_health_record.create_health_record_for_pet(pet=pet, record_in=record_in)
    
    # Cách xử lý đơn giản và đúng nhất
    response_data = new_record.model_dump()
    response_data["pet_id"] = pet_id
    return response_data

@router.get("/{pet_id}/health-records", response_model=List[HealthRecordRead])
async def read_health_records(
    *,
    pet_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    pet = await crud_pet.get_pet_by_id(pet_id=pet_id)
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
        
    records = await crud_health_record.get_health_records_for_pet(pet_id=pet_id)
    
    # Cách xử lý đơn giản và đúng nhất
    response_list = []
    for record in records:
        record_data = record.model_dump()
        record_data["pet_id"] = pet_id
        response_list.append(record_data)
        
    return response_list