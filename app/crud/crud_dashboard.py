from datetime import datetime, timedelta, timezone
from typing import Dict, List
from app.models.pet import Pet
from app.models.scheduled_event import ScheduledEvent
from app.models.health_record import HealthRecord, RecordType
from app.models.service import Service
from app.schemas.dashboard import DashboardData

async def get_dashboard_data() -> DashboardData:
    """
    Truy vấn và tính toán các số liệu nâng cao cho dashboard.
    """
    try:
        now = datetime.now(timezone.utc)
        in_24_hours = now + timedelta(days=1)
        in_30_days = now + timedelta(days=30)
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)

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

        print(f"Basic stats - Pets: {total_pets_count}, Events: {upcoming_events_count}, Health: {total_health_records_count}, Vaccinations: {due_vaccinations}")

        # --- THỐNG KÊ THEO LOÀI ---
        species_pipeline = [
            {"$group": {"_id": "$species", "count": {"$sum": 1}}}
        ]

        motor_collection = Pet.get_motor_collection()
        species_result_cursor = motor_collection.aggregate(species_pipeline)
        species_result = await species_result_cursor.to_list(length=None)
        pets_by_species_dict = {item["_id"]: item["count"] for item in species_result if item["_id"]}
        print(f"Pets by species: {pets_by_species_dict}")

        # --- THÚ CƯNG MỚI NHẤT ---
        latest_pets_list = await Pet.find_all().sort(-Pet.id).limit(5).to_list()
        latest_pets_dicts = []
        for pet in latest_pets_list:
            pet_dict = pet.dict()
            pet_dict["id"] = str(pet.id)
            latest_pets_dicts.append(pet_dict)
        print(f"Latest pets count: {len(latest_pets_dicts)}")
        revenue_by_date = {}
        try:
            # Đơn giản hóa: chỉ tính tổng cost từ health records
            revenue_pipeline = [
                {"$match": {"date": {"$gte": last_7_days, "$lte": now}}},
                {"$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$date"}
                    },
                    "total": {"$sum": "$total_cost"}
                }},
                {"$sort": {"_id": 1}}
            ]

            health_motor_collection = HealthRecord.get_motor_collection()
            revenue_result = await health_motor_collection.aggregate(revenue_pipeline).to_list(length=None)
            revenue_by_date = {item["_id"]: item["total"] for item in revenue_result}
            print(f"Revenue data: {revenue_by_date}")
        except Exception as e:
            print(f"Error in revenue aggregation: {e}")
            revenue_by_date = {}

        # --- PHÂN BỐ DỊCH VỤ ĐƯỢC SỬ DỤNG ---
        services_usage = {}
        try:
            # Kiểm tra sample record để debug
            sample_record = await HealthRecord.find_one()
            print(f"Sample health record: {sample_record}")
            if sample_record:
                print(f"Used services: {getattr(sample_record, 'used_services', 'NOT FOUND')}")
                print(f"Used products: {getattr(sample_record, 'used_products', 'NOT FOUND')}")

            # Thử aggregation đơn giản hơn
            services_pipeline = [
                {"$match": {"used_services": {"$exists": True, "$ne": []}}},
                {"$unwind": "$used_services"},
                {"$group": {"_id": "$used_services.name", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]

            services_result = await health_motor_collection.aggregate(services_pipeline).to_list(length=None)
            services_usage = {item["_id"]: item["count"] for item in services_result if item["_id"]}
            print(f"Services usage data: {services_usage}")
        except Exception as e:
            print(f"Error in services aggregation: {e}")
            services_usage = {}

        # --- THỐNG KÊ SỨC KHỎE THEO LOẠI ---
        health_stats = {}
        try:
            health_stats_pipeline = [
                {"$group": {"_id": "$record_type", "count": {"$sum": 1}}}
            ]

            health_stats_result = await health_motor_collection.aggregate(health_stats_pipeline).to_list(length=None)
            health_stats = {item["_id"]: item["count"] for item in health_stats_result}
            print(f"Health stats: {health_stats}")
        except Exception as e:
            print(f"Error in health stats aggregation: {e}")
            health_stats = {}

        # --- LỊCH HẸN THEO THÁNG ---
        events_by_month = {}
        try:
            events_pipeline = [
                {"$match": {"event_datetime": {"$gte": last_30_days, "$lte": now}}},
                {"$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m", "date": "$event_datetime"}
                    },
                    "count": {"$sum": 1}
                }},
                {"$sort": {"_id": 1}}
            ]

            events_motor_collection = ScheduledEvent.get_motor_collection()
            events_result = await events_motor_collection.aggregate(events_pipeline).to_list(length=None)
            events_by_month = {item["_id"]: item["count"] for item in events_result}
            print(f"Events by month: {events_by_month}")
        except Exception as e:
            print(f"Error in events aggregation: {e}")
            events_by_month = {}

        # --- THỐNG KÊ TRẠNG THÁI THÚ CƯNG ---
        pet_status_stats = {}
        try:
            pet_status_pipeline = [
                {"$match": {"status": {"$ne": None}}},  # Filter out null status
                {"$group": {"_id": "$status", "count": {"$sum": 1}}}
            ]

            pet_status_result = await motor_collection.aggregate(pet_status_pipeline).to_list(length=None)
            pet_status_stats = {item["_id"]: item["count"] for item in pet_status_result if item["_id"] is not None}
            print(f"Pet status stats: {pet_status_stats}")
        except Exception as e:
            print(f"Error in pet status aggregation: {e}")
            pet_status_stats = {}

        dashboard_data = DashboardData(
            total_pets=total_pets_count,
            upcoming_events_count=upcoming_events_count,
            total_health_records=total_health_records_count,
            due_vaccinations_count=due_vaccinations,
            pets_by_species=pets_by_species_dict,
            latest_pets=latest_pets_dicts,
            revenue_by_date=revenue_by_date,
            services_usage=services_usage,
            health_stats=health_stats,
            events_by_month=events_by_month,
            pet_status_stats=pet_status_stats
        )

        return dashboard_data

    except Exception as e:
        print(f"Error in get_dashboard_data: {e}")
        import traceback
        traceback.print_exc()
        # Return empty dashboard data on error
        return DashboardData(
            total_pets=0,
            upcoming_events_count=0,
            total_health_records=0,
            due_vaccinations_count=0,
            pets_by_species={},
            latest_pets=[],
            revenue_by_date={},
            services_usage={},
            health_stats={},
            events_by_month={},
            pet_status_stats={}
        )