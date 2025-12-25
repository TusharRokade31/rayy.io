import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
sys.path.append('/app/backend')
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

async def add_more_categories():
    # Get environment variables
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'yuno_db').strip('"')
    
    print(f"Connecting to: {mongo_url}")
    print(f"Database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    new_categories = [
        {"id": str(uuid.uuid4()), "slug": "music", "name": "Music", "icon": "🎵"},
        {"id": str(uuid.uuid4()), "slug": "swimming", "name": "Swimming", "icon": "🏊"},
        {"id": str(uuid.uuid4()), "slug": "drama", "name": "Drama", "icon": "🎭"},
        {"id": str(uuid.uuid4()), "slug": "yoga", "name": "Yoga", "icon": "🧘"},
        {"id": str(uuid.uuid4()), "slug": "robotics", "name": "Robotics", "icon": "🤖"},
        {"id": str(uuid.uuid4()), "slug": "chess", "name": "Chess", "icon": "♟️"}
    ]
    
    print("\n🌱 Adding new categories...")
    for cat in new_categories:
        exists = await db.categories.find_one({"slug": cat["slug"]})
        if not exists:
            await db.categories.insert_one(cat)
            print(f"✅ Added: {cat['name']} {cat['icon']}")
        else:
            print(f"⏭️  Already exists: {cat['name']}")
    
    total = await db.categories.count_documents({})
    print(f"\n📊 Total categories: {total}")
    
    # List all categories
    print("\n📋 All categories:")
    async for cat in db.categories.find():
        print(f"   {cat['icon']} {cat['name']}")

if __name__ == "__main__":
    asyncio.run(add_more_categories())
