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