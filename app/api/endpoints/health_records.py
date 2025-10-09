from fastapi import APIRouter, Depends, status, HTTPException , Response
from beanie import PydanticObjectId

from app.schemas.health_record import HealthRecordRead, HealthRecordUpdate , HealthRecordCreate
from app.crud import crud_health_record
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()

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

    # Xử lý response để trả về cho khớp schema
    response_data = updated_record.model_dump()
    response_data["pet_id"] = updated_record.pet.ref.id
    return response_data

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