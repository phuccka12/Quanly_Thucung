"""
Create multiple admin users from a CSV file.
CSV columns: email,password,full_name (header or without header: email,password,full_name)
Usage:
  python scripts/bulk_create_admins.py admins.csv

This will call the existing CRUD to create users (which currently creates ADMIN role by default in this codebase).
"""
import sys
from pathlib import Path
import csv

# ensure project root is importable
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

import asyncio
from app.db.database import init_db
from app.schemas.user import UserCreate
from app.crud import crud_user


def read_rows(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames and set([h.lower() for h in reader.fieldnames]) >= set(['email','password']):
            for r in reader:
                rows.append((r.get('email'), r.get('password'), r.get('full_name') or ''))
        else:
            f.seek(0)
            reader2 = csv.reader(f)
            for r in reader2:
                if not r: continue
                # assume email,password,full_name order
                email = r[0]
                pw = r[1] if len(r) > 1 else 'password123'
                name = r[2] if len(r) > 2 else ''
                rows.append((email, pw, name))
    return rows

async def main(argv):
    if len(argv) != 2 or not argv[1].endswith('.csv'):
        print('Usage: python scripts/bulk_create_admins.py admins.csv')
        return
    path = Path(argv[1])
    if not path.exists():
        print('File not found:', path)
        return
    rows = read_rows(path)
    await init_db()
    created = []
    failed = []
    for email, pw, name in rows:
        try:
            user_in = UserCreate(email=email.strip(), password=pw.strip(), full_name=name.strip() or 'Admin')
            u = await crud_user.create_user(user_in=user_in)
            created.append(u.email)
        except Exception as e:
            failed.append((email, str(e)))
    print('Created:', created)
    if failed:
        print('Failed:', failed)

if __name__ == '__main__':
    asyncio.run(main(sys.argv))
