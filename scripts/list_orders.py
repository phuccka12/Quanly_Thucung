import json
from pymongo import MongoClient
from app.core.config import settings

def main():
    url = settings.MONGODB_URL
    dbname = settings.DATABASE_NAME
    print(f"Connecting to MongoDB: {url} database: {dbname}")
    client = MongoClient(url)
    db = client[dbname]
    orders = list(db.orders.find())
    print(f"Found {len(orders)} orders in 'orders' collection")
    for o in orders:
        # Convert ObjectId and datetime to strings
        o = json.loads(json.dumps(o, default=str))
        print(json.dumps(o, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
