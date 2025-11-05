import sys
from pathlib import Path

# Ensure project root is on sys.path so `from app...` imports work when running scripts
sys.path.append(str(Path(__file__).resolve().parents[1]))

import asyncio
from datetime import datetime, timedelta

from app.db.database import init_db


async def main():
    await init_db()

    from app.models.product import Product
    from app.models.pet import Pet
    from app.models.health_record import HealthRecord, UsedProduct, UsedService

    # Create sample products if none exist
    existing = await Product.find_all().to_list()
    if not existing:
        print('Seeding products...')
        p1 = Product(name='Vaccine A', description='Vaccine phòng bệnh A', price=20.0, stock_quantity=100, category='Vaccine')
        p2 = Product(name='Thuốc x', description='Thuốc trị ký sinh', price=15.0, stock_quantity=50, category='Medicine')
        p3 = Product(name='Bông băng', description='Vật tư y tế', price=2.5, stock_quantity=200, category='Supply')
        await p1.insert()
        await p2.insert()
        await p3.insert()
        products = [p1, p2, p3]
    else:
        products = existing

    # Create sample pets if none exist
    pets_exist = await Pet.find_all().to_list()
    if not pets_exist:
        print('Seeding pets...')
        pet1 = Pet(name='Bingo', species='Dog', breed='Corgi', owner_name='Alice', owner_email='alice@example.com', owner_phone='0123456789')
        pet2 = Pet(name='Mittens', species='Cat', breed='Siamese', owner_name='Bob', owner_email='bob@example.com', owner_phone='0987654321')
        await pet1.insert()
        await pet2.insert()
        pets = [pet1, pet2]
    else:
        pets = pets_exist

    # Create sample health records referencing products and services
    print('Seeding health records...')
    # create a few records over the last week
    today = datetime.utcnow()
    recs = []
    # For each pet create 2 records
    for i, pet in enumerate(pets[:2]):
        # Record 1: vaccination with used product (vaccine)
        prod = products[0]
        up = UsedProduct(product_id=str(prod.id), quantity=1, unit_price=prod.price)
        us = UsedService(name='Tiêm phòng cơ bản', price=30.0)
        hr1 = HealthRecord(pet=pet, record_type='vaccination', date=today - timedelta(days=3 + i), description='Tiêm phòng định kỳ', used_products=[up], used_services=[us])
        await hr1.insert()
        recs.append(hr1)

        # Record 2: vet visit with medication
        prod2 = products[1]
        up2 = UsedProduct(product_id=str(prod2.id), quantity=2, unit_price=prod2.price)
        us2 = UsedService(name='Khám bệnh', price=40.0)
        hr2 = HealthRecord(pet=pet, record_type='vet_visit', date=today - timedelta(days=1 + i), description='Khám chữa bệnh', used_products=[up2], used_services=[us2])
        await hr2.insert()
        recs.append(hr2)

    print(f'Inserted {len(recs)} health records.')


if __name__ == '__main__':
    asyncio.run(main())
