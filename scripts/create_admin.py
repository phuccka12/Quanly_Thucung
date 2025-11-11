"""Helper script to create an admin user in the project's MongoDB using Beanie.

Run this with the project's virtualenv active:

    python scripts/create_admin.py

It will ask for email and password and create a user with role ADMIN.
"""
import asyncio
import getpass
import sys
from pathlib import Path

# Ensure project root is on sys.path so we can import `app` when running the script
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import init_db
from app.core.config import settings
from app.crud import crud_user


async def main():
    # initialize db (init_beanie)
    await init_db()
    email = input('Admin email: ').strip()
    pw = getpass.getpass('Password (will be hidden): ')

    from app.schemas.user import UserCreate
    from app.models.user import UserRole

    user_in = UserCreate(email=email, password=pw, full_name='Admin')
    # explicitly request ADMIN role for this helper script
    created = await crud_user.create_user(user_in=user_in, role=UserRole.ADMIN)
    print('Created user:', created.email, 'role=', created.role)


if __name__ == '__main__':
    asyncio.run(main())
