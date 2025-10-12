from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from beanie import PydanticObjectId

from app.schemas.scheduled_event import ScheduledEventCreate, ScheduledEventRead
from app.crud import crud_scheduled_event, crud_pet
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()

@router.post("/for-pet/{pet_id}", response_model=ScheduledEventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    *,
    pet_id: PydanticObjectId,
    event_in: ScheduledEventCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Tạo một sự kiện mới cho một thú cưng cụ thể. (Chỉ dành cho Admin)
    """
    pet = await crud_pet.get_pet_by_id(pet_id=pet_id)
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pet with id {pet_id} not found",
        )
    
    new_event = await crud_scheduled_event.create_event_for_pet(pet=pet, event_in=event_in)
    
    response_data = new_event.model_dump()
    response_data["pet_id"] = pet_id
    return response_data

@router.get("/upcoming", response_model=List[ScheduledEventRead])
async def get_upcoming(
    *,
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách các sự kiện sắp diễn ra. (Chỉ dành cho Admin)
    """
    events = await crud_scheduled_event.get_upcoming_events(skip=skip, limit=limit)
    
    response_list = []
    for event in events:
        event_data = event.model_dump()
        event_data["pet_id"] = event.pet.ref.id
        response_list.append(event_data)
        
    return response_list