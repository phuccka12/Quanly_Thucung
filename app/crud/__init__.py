"""CRUD helpers to interact with the database models.

Expose submodules so importing like `from app.crud import crud_dashboard` works.
"""

# Re-export commonly used crud modules here. This keeps import sites simple
# (e.g. `from app.crud import crud_dashboard`). Add new modules here as needed.
from . import crud_dashboard, crud_pet, crud_user, crud_scheduled_event, crud_health_record

__all__ = [
	"crud_dashboard",
	"crud_pet",
	"crud_user",
	"crud_scheduled_event",
	"crud_health_record",
]
