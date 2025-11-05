import sys
from pathlib import Path

# Ensure project root is on sys.path so `from app...` imports work when running scripts
sys.path.append(str(Path(__file__).resolve().parents[1]))

import asyncio
from app.db.database import init_db

async def main():
    await init_db()
    from app.models.health_record import HealthRecord

    recs = await HealthRecord.find_all().to_list()
    print('HealthRecord count:', len(recs))
    for i, r in enumerate(recs[:10]):
        print('\n--- record', i+1, '---')
        try:
            print('id:', str(r.id))
        except Exception:
            pass
        try:
            print('date:', getattr(r, 'date', None))
        except Exception:
            pass
        try:
            print('used_products:', r.used_products)
        except Exception:
            print('used_products: <error reading>')
        try:
            print('used_services:', r.used_services)
        except Exception:
            print('used_services: <error reading>')

if __name__ == '__main__':
    asyncio.run(main())
