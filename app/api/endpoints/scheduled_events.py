from fastapi import APIRouter, Depends, status, HTTPException
from typing import List, Optional
from beanie import PydanticObjectId

from app.schemas.scheduled_event import ScheduledEventCreate, ScheduledEventRead, ScheduledEventPaginatedResponse
from app.crud import crud_scheduled_event, crud_pet
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.scheduled_event import ScheduledEvent

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
    
    response_data = {
        "id": new_event.id,
        "pet_id": pet_id,
        "pet_name": pet.name,
        "owner_name": pet.owner_name,
        "title": new_event.title,
        "event_datetime": new_event.event_datetime,
        "event_type": new_event.event_type,
        "description": new_event.description,
        "is_completed": new_event.is_completed
    }
    return response_data

@router.get("/upcoming", response_model=ScheduledEventPaginatedResponse)
async def get_upcoming(
    *,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách các sự kiện sắp diễn ra. (Chỉ dành cho Admin)
    """
    events, total = await crud_scheduled_event.get_upcoming_events_with_count(skip=skip, limit=limit, search=search)
    
    response_list = []
    for event in events:
        # Lấy thông tin pet để include tên và chủ sở hữu
        pet = await event.pet.fetch()
        event_data = {
            "id": event.id,
            "pet_id": event.pet.ref.id,
            "pet_name": pet.name if pet else "Unknown Pet",
            "owner_name": pet.owner_name if pet else "Unknown Owner",
            "title": event.title,
            "event_datetime": event.event_datetime,
            "event_type": event.event_type,
            "description": event.description,
            "is_completed": event.is_completed
        }
        response_list.append(event_data)
    
    return {
        "data": response_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.put("/{event_id}", response_model=ScheduledEventRead)
async def update_event(
    *,
    event_id: PydanticObjectId,
    event_in: ScheduledEventCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Cập nhật một sự kiện. (Chỉ dành cho Admin)
    """
    event = await ScheduledEvent.get(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )
    
    # Cập nhật các field
    for field, value in event_in.dict().items():
        setattr(event, field, value)
    
    await event.save()
    
    # Lấy thông tin pet để include tên và chủ sở hữu
    pet = await event.pet.fetch()
    response_data = {
        "id": event.id,
        "pet_id": event.pet.ref.id,
        "pet_name": pet.name if pet else "Unknown Pet",
        "owner_name": pet.owner_name if pet else "Unknown Owner",
        "title": event.title,
        "event_datetime": event.event_datetime,
        "event_type": event.event_type,
        "description": event.description,
        "is_completed": event.is_completed
    }
    return response_data

@router.delete("/{event_id}")
async def delete_event(
    *,
    event_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Xóa một sự kiện. (Chỉ dành cho Admin)
    """
    event = await ScheduledEvent.get(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )
    
    await event.delete()
    return {"message": "Event deleted successfully"}