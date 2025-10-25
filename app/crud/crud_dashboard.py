from datetime import datetime, timedelta, timezone
from typing import Dict, List
from app.models.pet import Pet
from app.models.scheduled_event import ScheduledEvent
from app.models.health_record import HealthRecord, RecordType
from app.schemas.dashboard import DashboardData

async def get_dashboard_data() -> DashboardData:
    """
    Truy vấn và tính toán các số liệu nâng cao cho dashboard.
    """
    now = datetime.now(timezone.utc)
    in_24_hours = now + timedelta(days=1)
    in_30_days = now + timedelta(days=30)
    
    total_pets_count = await Pet.find_all().count()
    upcoming_events_count = await ScheduledEvent.find(
        ScheduledEvent.is_completed == False,
        ScheduledEvent.event_datetime >= now,
        ScheduledEvent.event_datetime <= in_24_hours
    ).count()
    total_health_records_count = await HealthRecord.find_all().count()
    due_vaccinations = await HealthRecord.find(
        HealthRecord.record_type == RecordType.VACCINATION,
        HealthRecord.next_due_date >= now,
        HealthRecord.next_due_date <= in_30_days
    ).count()

    # --- TRUY VẤN MỚI 1: THỐNG KÊ THEO LOÀI (AGGREGATION) ---
    species_pipeline = [
        {"$group": {"_id": "$species", "count": {"$sum": 1}}}
    ]
    
    # Beanie v1: lấy Motor collection từ model
    motor_collection = Pet.get_motor_collection()
    # motor_collection.aggregate(...) trả về cursor; dùng await motor cursor to_list
    species_result_cursor = motor_collection.aggregate(species_pipeline)
    species_result = await species_result_cursor.to_list(length=None)
    
    pets_by_species_dict = {item["_id"]: item["count"] for item in species_result if item["_id"]}

    # --- TRUY VẤN MỚI 2: LẤY 5 THÚ CƯNG MỚI NHẤT ---
    latest_pets_list = await Pet.find_all().sort(-Pet.id).limit(5).to_list()
    
    # Convert to dicts with string ids for frontend compatibility
    latest_pets_dicts = []
    for pet in latest_pets_list:
        pet_dict = pet.dict()
        pet_dict["id"] = str(pet.id)
        latest_pets_dicts.append(pet_dict)
    
    dashboard_data = DashboardData(
        total_pets=total_pets_count,
        upcoming_events_count=upcoming_events_count,
        total_health_records=total_health_records_count,
        due_vaccinations_count=due_vaccinations,
        pets_by_species=pets_by_species_dict,
        latest_pets=latest_pets_dicts
    )
    
    return dashboard_data