import sys
import pathlib
import asyncio
import os

# đảm bảo import package app khi chạy script
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId

load_dotenv()  # đọc .env từ project root

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "pet_management")

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")  # dùng argon2  

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Dữ liệu mẫu
    products = [
        {"_id": ObjectId(), "name": "Dog Food", "sku": "DF001", "stock_quantity": 100, "price": 20.0},
        {"_id": ObjectId(), "name": "Vaccination Kit", "sku": "VK001", "stock_quantity": 50, "price": 15.0},
    ]

   # ...existing code...
    pets = [
    {"_id": ObjectId(), "name": "Bobby", "species": "Dog", "breed": "Labrador", "age": 3, "owner_email": "owner1@example.com", "owner_name": "Owner One"},
    {"_id": ObjectId(), "name": "Mimi", "species": "Cat", "breed": "Siamese", "age": 2, "owner_email": "owner2@example.com", "owner_name": "Owner Two"},
     ]
    users = [
        {
            "_id": ObjectId(),
            "email": "admin@example.com",
            "hashed_password": pwd_context.hash("admin123"),
            "is_active": True,
            "is_superuser": True,
            "full_name": "Administrator"
        }
    ]

    # Upsert từng document (chạy an toàn nhiều lần)
    for p in products:
        doc = p.copy()
        obj_id = doc.pop("_id", None)
        update_doc = {"$set": doc}
        if obj_id:
            update_doc["$setOnInsert"] = {"_id": obj_id}
        await db["products"].update_one({"sku": doc["sku"]}, update_doc, upsert=True)

    for pet in pets:
        doc = pet.copy()
        obj_id = doc.pop("_id", None)
        update_doc = {"$set": doc}
        if obj_id:
            update_doc["$setOnInsert"] = {"_id": obj_id}
        await db["pets"].update_one({"name": doc["name"]}, update_doc, upsert=True)

    for u in users:
        doc = u.copy()
        obj_id = doc.pop("_id", None)
        update_doc = {"$set": {k: v for k, v in doc.items() if k != "hashed_password"}}
        # đảm bảo hashed_password được set (không bị mất)
        update_doc["$set"]["hashed_password"] = doc["hashed_password"]
        if obj_id:
            update_doc["$setOnInsert"] = {"_id": obj_id}
        await db["users"].update_one({"email": doc["email"]}, update_doc, upsert=True)

    print("Seed: inserted/updated products, pets, users")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())