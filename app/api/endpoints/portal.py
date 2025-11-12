from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.pet import PetCreate, PetRead
from app.schemas.scheduled_event import ScheduledEventCreate, ScheduledEventRead
from app.models.pet import Pet
from app.models.scheduled_event import ScheduledEvent

# CRUD helpers
from app.crud import crud_pet, crud_scheduled_event, crud_health_record, crud_product, crud_service
from app.schemas.product import ProductRead
from app.schemas.service import ServiceRead
from app.schemas.pet import PetUpdate
from app.schemas.health_record import HealthRecordRead, HealthRecordCreate, HealthRecordUpdate
from app.models.health_record import UsedProduct, UsedService

router = APIRouter()


@router.get("/pets", response_model=List[PetRead])
async def get_my_pets(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: str | None = None
):
    """Return list of pets owned by the current user (paginated)."""
    pets, total = await crud_pet.get_pets_for_owner(owner_email=current_user.email, skip=skip, limit=limit, search=search)
    out = []
    for p in pets:
        d = p.dict()
        d["id"] = str(p.id)
        out.append(d)
    return out


@router.post("/pets", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def create_pet_for_user(pet_in: PetCreate, current_user: User = Depends(get_current_user)):
    """Create a new pet and associate it with the current user as owner."""
    owner_name = current_user.full_name or current_user.email
    pet = await crud_pet.create_pet_for_owner(owner_email=current_user.email, owner_name=owner_name, pet_in=pet_in)
    d = pet.dict()
    d["id"] = str(pet.id)
    return d


@router.get("/pets/{pet_id}", response_model=PetRead)
async def get_my_pet(pet_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    d = pet.dict()
    d["id"] = str(pet.id)
    return d


@router.put("/pets/{pet_id}", response_model=PetRead)
async def update_my_pet(pet_id: PydanticObjectId, pet_in: PetUpdate, current_user: User = Depends(get_current_user)):
    """Update a pet owned by current user."""
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    updated = await crud_pet.update_pet(pet, pet_in)
    d = updated.dict()
    d["id"] = str(updated.id)
    return d


@router.delete("/pets/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_pet(pet_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    await crud_pet.delete_pet(pet)
    return None


@router.post("/pets/{pet_id}/scheduled-events", response_model=ScheduledEventRead, status_code=status.HTTP_201_CREATED)
async def create_event_for_my_pet(pet_id: PydanticObjectId, event_in: ScheduledEventCreate, current_user: User = Depends(get_current_user)):
    try:
        event = await crud_scheduled_event.create_event_for_pet_owner(pet_id=str(pet_id), owner_email=current_user.email, event_in=event_in)
    except ValueError as e:
        # Map ValueError messages to appropriate HTTP status codes so the client
        # gets a helpful response instead of a generic 404. If the underlying
        # error indicates the pet was not found or doesn't belong to the user,
        # return 404. Otherwise treat it as a bad request (validation/business rule).
        msg = str(e) or "Invalid request"
        if "does not belong" in msg or "Pet not found" in msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    resp = event.dict()
    resp["id"] = str(event.id)
    # event.pet may be a Beanie Link (with async fetch()) or a raw/embedded Pet object
    pet = None
    try:
        # try Link.fetch() first
        if hasattr(event.pet, "fetch"):
            pet = await event.pet.fetch()
        else:
            pet = event.pet
    except Exception:
        # fallback: try to load by id
        try:
            pet_ref = getattr(event, 'pet', None)
            pet_id_val = getattr(pet_ref, 'id', None) or getattr(pet_ref, '_id', None)
            if pet_id_val:
                pet = await Pet.get(pet_id_val)
        except Exception:
            pet = None

    resp["pet_id"] = str(pet.id) if pet else None
    resp["pet_name"] = getattr(pet, 'name', None) if pet else None
    resp["owner_name"] = getattr(pet, 'owner_name', None) if pet else None
    # include optional linked catalog ids
    resp["service_id"] = str(getattr(event, 'service_id', None)) if getattr(event, 'service_id', None) else None
    resp["product_id"] = str(getattr(event, 'product_id', None)) if getattr(event, 'product_id', None) else None
    return resp


@router.get("/scheduled-events", response_model=List[ScheduledEventRead])
async def get_my_scheduled_events(current_user: User = Depends(get_current_user)):
    """Return scheduled events for all pets owned by current user."""
    events = await crud_scheduled_event.get_events_for_owner(owner_email=current_user.email)
    out = []
    for e in events:
        pet = await e.pet.fetch()
        d = e.dict()
        d["id"] = str(e.id)
        d["pet_id"] = str(e.pet.ref.id) if hasattr(e.pet, 'ref') else (str(e.pet.id) if hasattr(e.pet, 'id') else None)
        d["pet_name"] = pet.name if pet else None
        d["owner_name"] = pet.owner_name if pet else None
        # include optional linked catalog ids in listing
        d["service_id"] = str(getattr(e, 'service_id', None)) if getattr(e, 'service_id', None) else None
        d["product_id"] = str(getattr(e, 'product_id', None)) if getattr(e, 'product_id', None) else None
        out.append(d)
    return out


@router.delete('/scheduled-events/{event_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_scheduled_event(event_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    """Allow pet owners to delete (cancel) a scheduled event that belongs to one of their pets.

    Cancellation policy (Lai logic):
    - If the event is more than 24 hours in the future, allow user to cancel immediately.
    - If the event is within 24 hours, disallow self-cancellation and instruct the user to call support.
    """
    event = await ScheduledEvent.get(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    # Resolve pet id from event.pet which may be a Link or embedded
    pet_id_val = None
    try:
        pet_ref = getattr(event, 'pet', None)
        if pet_ref is not None:
            if hasattr(pet_ref, 'ref'):
                pet_id_val = getattr(pet_ref.ref, 'id', None)
            else:
                pet_id_val = getattr(pet_ref, 'id', None) or getattr(pet_ref, '_id', None)
    except Exception:
        pet_id_val = None

    if not pet_id_val:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Event has no pet reference')

    # Verify ownership
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id_val), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    # Enforce Lai cancellation rule: allow if >24 hours away
    from datetime import datetime, timedelta

    try:
        event_dt = event.event_datetime
        now = datetime.utcnow()
        delta = event_dt - now
        # if event datetime is naive but represents UTC, this works; else consider normalizing at creation
        if delta.total_seconds() < 0:
            # past events cannot be cancelled
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Cannot cancel past events')
        if delta < timedelta(hours=6):
            # within 6 hours -> disallow self-cancel
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail='Sự kiện sắp diễn ra (trong vòng 6 giờ). Vui lòng gọi số hỗ trợ để hủy.')
    except HTTPException:
        raise
    except Exception:
        # If anything goes wrong when parsing dates, be conservative and disallow
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Không thể hủy sự kiện này hiện tại. Vui lòng liên hệ hỗ trợ.')

    await event.delete()
    return None


@router.get("/pets/{pet_id}/health-records")
async def get_my_pet_health_records(pet_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    """Return health records for a pet owned by the current user, serialized to JSON-safe dicts."""
    records = await crud_health_record.get_health_records_for_pet_owner(pet_id=pet_id, owner_email=current_user.email)
    out = []
    for r in records:
        # Determine pet id reliably from a Link or embedded document
        try:
            rec_pet = getattr(r, 'pet', None)
            pet_id_val = None
            if rec_pet is not None:
                if hasattr(rec_pet, 'ref'):
                    pet_id_val = getattr(rec_pet.ref, 'id', None)
                else:
                    pet_id_val = getattr(rec_pet, 'id', None) or getattr(rec_pet, '_id', None)
            pet_id_str = str(pet_id_val) if pet_id_val else str(pet_id)
        except Exception:
            pet_id_str = str(pet_id)

        # Build a JSON-serializable dict similar to HealthRecordRead
        rec = {
            'id': str(r.id),
            'pet_id': pet_id_str,
            'record_type': getattr(r, 'record_type', None),
            'date': getattr(r, 'date', None),
            'description': getattr(r, 'description', None),
            'notes': getattr(r, 'notes', None),
            'next_due_date': getattr(r, 'next_due_date', None),
            'weight_kg': getattr(r, 'weight_kg', None),
            'used_products': _convert_used_products(getattr(r, 'used_products', None)),
            'used_services': _convert_used_services(getattr(r, 'used_services', None)),
        }
        out.append(rec)
    return out


def _convert_used_products(used_products: list | None):
    if not used_products:
        return None
    out = []
    for up in used_products:
        if hasattr(up, "product_id"):
            out.append({"product_id": up.product_id, "quantity": int(up.quantity), "unit_price": float(up.unit_price)})
        elif isinstance(up, dict):
            out.append({"product_id": up.get("product_id"), "quantity": int(up.get("quantity")), "unit_price": float(up.get("unit_price"))})
        else:
            out.append(up)
    return out


def _convert_used_services(used_services: list | None):
    if not used_services:
        return None
    out = []
    for us in used_services:
        if hasattr(us, "name"):
            out.append({"name": us.name, "price": float(us.price)})
        elif isinstance(us, dict):
            out.append({"name": us.get("name"), "price": float(us.get("price"))})
        else:
            out.append(us)
    return out


@router.post("/pets/{pet_id}/health-records", response_model=HealthRecordRead, status_code=status.HTTP_201_CREATED)
async def create_health_record_for_my_pet(
    pet_id: PydanticObjectId,
    record_in: HealthRecordCreate,
    current_user: User = Depends(get_current_user)
):
    # Ensure pet belongs to current user
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

    try:
        new_record = await crud_health_record.create_health_record_for_pet(pet=pet, record_in=record_in)
    except ValueError as e:
        # propagate meaningful errors (e.g., insufficient stock)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return HealthRecordRead(
        id=new_record.id,
        pet_id=new_record.pet.ref.id if hasattr(new_record.pet, 'ref') else new_record.pet.id,
        record_type=new_record.record_type,
        date=new_record.date,
        description=new_record.description,
        notes=new_record.notes,
        next_due_date=new_record.next_due_date,
        weight_kg=new_record.weight_kg,
        used_products=_convert_used_products(new_record.used_products),
        used_services=_convert_used_services(new_record.used_services)
    )


@router.get("/pets/{pet_id}/health-records/{record_id}", response_model=HealthRecordRead)
async def get_my_pet_health_record_by_id(
    pet_id: PydanticObjectId,
    record_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    # Verify ownership
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")

    record = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    # ensure record belongs to pet
    rec_pet_id = getattr(record.pet, 'ref', None).id if hasattr(record.pet, 'ref') else getattr(record.pet, 'id', None)
    if str(rec_pet_id) != str(pet_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    return HealthRecordRead(
        id=record.id,
        pet_id=pet_id,
        record_type=record.record_type,
        date=record.date,
        description=record.description,
        notes=record.notes,
        next_due_date=record.next_due_date,
        weight_kg=record.weight_kg,
        used_products=_convert_used_products(record.used_products),
        used_services=_convert_used_services(record.used_services)
    )


@router.put("/health-records/{record_id}", response_model=HealthRecordRead)
async def update_my_health_record(
    record_id: PydanticObjectId,
    record_in: HealthRecordUpdate,
    current_user: User = Depends(get_current_user)
):
    existing = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    # verify ownership via pet
    pet_ref = getattr(existing, 'pet', None)
    pet_id_val = getattr(pet_ref, 'ref', None).id if hasattr(pet_ref, 'ref') else getattr(pet_ref, 'id', None)
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id_val), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    updated = await crud_health_record.update_health_record(record=existing, record_in=record_in)

    return HealthRecordRead(
        id=updated.id,
        pet_id=pet_id_val,
        record_type=updated.record_type,
        date=updated.date,
        description=updated.description,
        notes=updated.notes,
        next_due_date=updated.next_due_date,
        weight_kg=updated.weight_kg,
        used_products=_convert_used_products(updated.used_products),
        used_services=_convert_used_services(updated.used_services)
    )


@router.delete("/health-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_health_record(record_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    existing = await crud_health_record.get_health_record_by_id(record_id=record_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    # verify owner
    pet_ref = getattr(existing, 'pet', None)
    pet_id_val = getattr(pet_ref, 'ref', None).id if hasattr(pet_ref, 'ref') else getattr(pet_ref, 'id', None)
    pet = await crud_pet.get_pet_by_id_for_owner(pet_id=str(pet_id_val), owner_email=current_user.email)
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found")

    await crud_health_record.delete_health_record(record=existing)
    return None


# Read-only product endpoints for portal users
@router.get('/products/paginated')
async def portal_read_products_paginated(
    *,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    current_user: User = Depends(get_current_user)
):
    products, total = await crud_product.get_all_products_with_count(skip=skip, limit=limit, search=search)
    data = []
    for p in products:
        pd = p.dict()
        pd['id'] = str(p.id)
        data.append(pd)
    return { 'data': data, 'total': total, 'skip': skip, 'limit': limit }


@router.get('/products/{product_id}', response_model=ProductRead)
async def portal_get_product(product_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    prod = await crud_product.get_product(product_id=product_id)
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
    pd = prod.dict()
    pd['id'] = str(prod.id)
    return pd


# Read-only service endpoints for portal users
@router.get('/services/paginated')
async def portal_read_services_paginated(
    *,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    current_user: User = Depends(get_current_user)
):
    services, total = await crud_service.get_all_services_with_count(skip=skip, limit=limit, search=search)
    data = []
    for s in services:
        sd = s.dict()
        sd['id'] = str(s.id)
        data.append(sd)
    return { 'data': data, 'total': total, 'skip': skip, 'limit': limit }


@router.get('/services/{service_id}', response_model=ServiceRead)
async def portal_get_service(service_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    svc = await crud_service.get_service(service_id=service_id)
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Service not found')
    sd = svc.dict()
    sd['id'] = str(svc.id)
    return sd
