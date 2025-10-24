from typing import List, Optional
from beanie import PydanticObjectId
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate


async def create_service(service_in: ServiceCreate) -> Service:
    svc = Service(**service_in.model_dump())
    await svc.insert()
    return svc


async def get_service(service_id: PydanticObjectId) -> Optional[Service]:
    return await Service.get(service_id)


async def get_multi_services(skip: int = 0, limit: int = 100) -> List[Service]:
    return await Service.find_all().skip(skip).limit(limit).to_list()


async def update_service(service: Service, service_in: ServiceUpdate) -> Service:
    update_data = service_in.model_dump(exclude_unset=True)
    service = service.model_copy(update=update_data)
    await service.save()
    return service


async def delete_service(service: Service) -> None:
    await service.delete()
    return None
