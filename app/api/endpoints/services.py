
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from beanie import PydanticObjectId

from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceRead
from app.crud import crud_service
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()

@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_new_service(
    service_in: ServiceCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    service = await crud_service.create_service(service_in=service_in)
    # Return dict with string id for frontend compatibility
    service_dict = service.dict()
    service_dict["id"] = str(service.id)
    return service_dict

@router.get("", response_model=List[ServiceRead])
async def read_services(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user)
):
    return await crud_service.get_multi_services(skip=skip, limit=limit)

@router.get("/paginated")
async def read_services_paginated(
    *,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách dịch vụ với phân trang và tìm kiếm.
    """
    services, total = await crud_service.get_all_services_with_count(skip=skip, limit=limit, search=search)
    
    # Convert to dicts and set string id for frontend compatibility
    data = []
    for service in services:
        service_dict = service.dict()
        service_dict["id"] = str(service.id)
        data.append(service_dict)
    
    return {
        "data": data,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{service_id}", response_model=ServiceRead)
async def read_service_by_id(
    service_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    service = await crud_service.get_service(service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    # Return dict with string id for frontend compatibility
    service_dict = service.dict()
    service_dict["id"] = str(service.id)
    return service_dict

@router.put("/{service_id}", response_model=ServiceRead)
async def update_existing_service(
    service_id: PydanticObjectId,
    service_in: ServiceUpdate,
    current_admin: User = Depends(get_current_admin_user)
):
    service = await crud_service.get_service(service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    updated_service = await crud_service.update_service(service=service, service_in=service_in)
    # Return dict with string id for frontend compatibility
    service_dict = updated_service.dict()
    service_dict["id"] = str(updated_service.id)
    return service_dict

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_service(
    service_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    service = await crud_service.get_service(service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await crud_service.delete_service(service=service)