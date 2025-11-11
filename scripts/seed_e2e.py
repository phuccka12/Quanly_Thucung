"""Seed script for end-to-end tests.

Creates two accounts (admin and user) if they don't exist. Use for local E2E checks.

Run with project's venv active:
    python scripts/seed_e2e.py
"""
import asyncio
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import init_db
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.models.user import UserRole


async def main():
    await init_db()

    admin_email = "admin-e2e@example.com"
    admin_pw = "AdminPass123!"
    user_email = "user-e2e@example.com"
    user_pw = "UserPass123!"

    # create or promote admin
    existing = await crud_user.get_user_by_email(admin_email)
    if existing:
        print("Admin exists:", existing.email, "role=", existing.role)
        if existing.role != UserRole.ADMIN:
            existing.role = UserRole.ADMIN
            await existing.save()
            print("Promoted existing user to ADMIN")
    else:
        user_in = UserCreate(email=admin_email, password=admin_pw, full_name="E2E Admin")
        created = await crud_user.create_user(user_in=user_in, role=UserRole.ADMIN)
        print("Created admin:", created.email, "role=", created.role)

    # create normal user
    existing_u = await crud_user.get_user_by_email(user_email)
    if existing_u:
        print("User exists:", existing_u.email, "role=", existing_u.role)
    else:
        user_in = UserCreate(email=user_email, password=user_pw, full_name="E2E User")
        created_u = await crud_user.create_user(user_in=user_in)
        print("Created user:", created_u.email, "role=", created_u.role)

    print("Seeding complete. Admin credentials:", admin_email, admin_pw)
    print("User credentials:", user_email, user_pw)


if __name__ == "__main__":
    asyncio.run(main())

