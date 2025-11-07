# scripts/list_admins.py
import asyncio, sys
from pathlib import Path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import init_db
from app.models.user import User

async def main():
    await init_db()
    admins = await User.find(User.role == 'admin').to_list()
    print(f'Found {len(admins)} admin users:')
    for a in admins:
        print('-', getattr(a, 'email', None), 'role=', getattr(a, 'role', None))

if __name__ == '__main__':
    asyncio.run(main())