from pydantic import BaseModel, Field
from typing import List, Dict
from .pet import PetRead

class DashboardData(BaseModel):
    total_pets: int
    upcoming_events_count: int
    total_health_records: int
    due_vaccinations_count: int
    pets_by_species: Dict[str, int] = Field(default_factory=dict)  # Mappings, e.g. {"dog": 12, "cat": 5}
    latest_pets: List[dict] = Field(default_factory=list)  # Latest pets - list of objects (kept generic as dict to avoid circular imports)
    revenue_by_date: Dict[str, float] = Field(default_factory=dict)  # Revenue by date for charts
    services_usage: Dict[str, int] = Field(default_factory=dict)  # Services usage statistics
    health_stats: Dict[str, int] = Field(default_factory=dict)  # Health record statistics by type
    events_by_month: Dict[str, int] = Field(default_factory=dict)  # Events by month
    pet_status_stats: Dict[str, int] = Field(default_factory=dict)  # Pet status statistics