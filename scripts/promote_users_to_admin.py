"""
Promote existing users (by email) to admin role.
Usage:
  python scripts/promote_users_to_admin.py emails.csv
  or
  python scripts/promote_users_to_admin.py user1@example.com user2@example.com

CSV should be a single column of emails (no header) or a header named 'email'.
"""
import sys
from pathlib import Path
import csv

# ensure project root is importable
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

import asyncio
from app.db.database import init_db
from app.models.user import UserRole
from app.models.user import User

from beanie import PydanticObjectId

async def promote_emails(emails):
    await init_db()
    promoted = []
    not_found = []
    for email in emails:
        email = email.strip()
        if not email:
            continue
        u = await User.find_one(User.email == email)
        if not u:
            not_found.append(email)
            continue
        # set role to admin
        u.role = UserRole.ADMIN
        await u.save()
        promoted.append(email)
    return promoted, not_found

def read_emails_from_csv(path):
    emails = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # try header first
        if 'email' in (h.lower() for h in reader.fieldnames or []):
            f.seek(0)
            reader = csv.DictReader(f)
            for r in reader:
                emails.append(r.get('email') or r.get('Email') or '')
        else:
            f.seek(0)
            reader = csv.reader(f)
            for row in reader:
                if row:
                    emails.append(row[0])
    return emails

async def main(argv):
    if len(argv) < 2:
        print('Usage: python scripts/promote_users_to_admin.py emails.csv OR list of emails')
        return
    if len(argv) == 2 and argv[1].endswith('.csv'):
        path = Path(argv[1])
        if not path.exists():
            print('CSV file not found:', path)
            return
        emails = read_emails_from_csv(path)
    else:
        emails = argv[1:]
    promoted, not_found = await promote_emails(emails)
    print('Promoted:', promoted)
    if not_found:
        print('Not found:', not_found)

if __name__ == '__main__':
    asyncio.run(main(sys.argv))
