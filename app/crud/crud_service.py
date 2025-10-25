from typing import List, Optional
from beanie import PydanticObjectId
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


async def create_service(service_in: ServiceCreate) -> Service:
    svc = Service(**service_in.dict())
    await svc.insert()
    return svc


async def get_service(service_id: PydanticObjectId) -> Optional[Service]:
    return await Service.get(service_id)


async def get_multi_services(skip: int = 0, limit: int = 100) -> List[Service]:
    return await Service.find_all().skip(skip).limit(limit).to_list()

async def get_all_services_with_count(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None
) -> tuple[List[Service], int]:
    """
    Lấy danh sách dịch vụ với tổng số lượng cho phân trang.
    """
    query = Service.find_all()
    
    if search:
        # Tìm kiếm không phân biệt hoa thường trong tên dịch vụ
        search_regex = {"$regex": search, "$options": "i"}
        query = Service.find({"name": search_regex})
        
    # Lấy tổng số
    total = await query.count()
    
    # Lấy data với phân trang
    services = await query.skip(skip).limit(limit).to_list()
    
    return services, total


async def update_service(service: Service, service_in: ServiceUpdate) -> Service:
    update_data = service_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    await service.save()
    return service


async def delete_service(service: Service) -> None:
    await service.delete()
    return None
