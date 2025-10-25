from fastapi import APIRouter, Depends, status, HTTPException , Response
from beanie import PydanticObjectId
from typing import List

from app.schemas.health_record import HealthRecordRead, HealthRecordUpdate , HealthRecordCreate
from app.crud import crud_health_record, crud_pet
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()

@router.post("/for-pet/{pet_id}", response_model=HealthRecordRead, status_code=status.HTTP_201_CREATED)
async def create_health_record(
    *,
    pet_id: PydanticObjectId,
    record_in: HealthRecordCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Tạo một bản ghi y tế mới cho thú cưng. (Chỉ dành cho Admin)
    """
    pet = await crud_pet.get_pet_by_id(pet_id=pet_id)
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    
    new_record = await crud_health_record.create_health_record_for_pet(pet=pet, record_in=record_in)
    
    # Tạo HealthRecordRead object manually để tránh validation error
    return HealthRecordRead(
        id=new_record.id,
        pet_id=new_record.pet.ref.id if hasattr(new_record.pet, 'ref') else new_record.pet.id,
        record_type=new_record.record_type,
        date=new_record.date,
        description=new_record.description,
        notes=new_record.notes,
        next_due_date=new_record.next_due_date,
        weight_kg=new_record.weight_kg,
        used_products=new_record.used_products,
        used_services=new_record.used_services
    )

@router.get("/for-pet/{pet_id}", response_model=List[HealthRecordRead])
async def get_health_records_for_pet(
    *,
    pet_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách bản ghi y tế của một thú cưng. (Chỉ dành cho Admin)
    """
    records = await crud_health_record.get_health_records_for_pet(pet_id=pet_id)
    
    response_list = []
    for record in records:
        # Tạo HealthRecordRead object manually để tránh validation error
        record_data = HealthRecordRead(
            id=record.id,
            pet_id=record.pet.ref.id if hasattr(record.pet, 'ref') else record.pet.id,
            record_type=record.record_type,
            date=record.date,
            description=record.description,
            notes=record.notes,
            next_due_date=record.next_due_date,
            weight_kg=record.weight_kg,
            used_products=record.used_products,
            used_services=record.used_services
        )
        response_list.append(record_data)
    
    return response_list

@router.get("/{record_id}", response_model=HealthRecordRead)
async def get_health_record_by_id(
    *,
    record_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy chi tiết một bản ghi y tế. (Chỉ dành cho Admin)
    """
    record = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health record with id {record_id} not found",
        )
    
    # Tạo HealthRecordRead object manually để tránh validation error
    return HealthRecordRead(
        id=record.id,
        pet_id=record.pet.ref.id if hasattr(record.pet, 'ref') else record.pet.id,
        record_type=record.record_type,
        date=record.date,
        description=record.description,
        notes=record.notes,
        next_due_date=record.next_due_date,
        weight_kg=record.weight_kg,
        used_products=record.used_products,
        used_services=record.used_services
    )

@router.put("/{record_id}", response_model=HealthRecordRead)
async def update_health_record_by_id(
    *,
    record_id: PydanticObjectId,
    record_in: HealthRecordUpdate,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Cập nhật một bản ghi y tế. (Chỉ dành cho Admin)
    """
    existing_record = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not existing_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health record with id {record_id} not found",
        )
    
    updated_record = await crud_health_record.update_health_record(
        record=existing_record, record_in=record_in
    )

    # Tạo HealthRecordRead object manually để tránh validation error
    return HealthRecordRead(
        id=updated_record.id,
        pet_id=updated_record.pet.ref.id if hasattr(updated_record.pet, 'ref') else updated_record.pet.id,
        record_type=updated_record.record_type,
        date=updated_record.date,
        description=updated_record.description,
        notes=updated_record.notes,
        next_due_date=updated_record.next_due_date,
        weight_kg=updated_record.weight_kg,
        used_products=updated_record.used_products,
        used_services=updated_record.used_services
    )

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_record_by_id(
    *,
    record_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Xóa một bản ghi y tế. (Chỉ dành cho Admin)
    """
    record_to_delete = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not record_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Health record with id {record_id} not found",
        )
    
    await crud_health_record.delete_health_record(record=record_to_delete)
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)