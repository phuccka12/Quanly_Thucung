"""Helper script to create an admin user in the project's MongoDB using Beanie.

Run this with the project's virtualenv active:

    python scripts/create_admin.py

It will ask for email and password and create a user with role ADMIN.
"""
import asyncio
import getpass

from app.db.database import init_db
from app.core.config import settings
from app.crud import crud_user


async def main():
    # initialize db (init_beanie)
    await init_db()
    email = input('Admin email: ').strip()
    pw = getpass.getpass('Password (will be hidden): ')

    from app.schemas.user import UserCreate

    user_in = UserCreate(email=email, password=pw, full_name='Admin')
    created = await crud_user.create_user(user_in=user_in)
    print('Created user:', created.email, 'role=', created.role)


if __name__ == '__main__':
    asyncio.run(main())
