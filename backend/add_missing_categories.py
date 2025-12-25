"""
Add missing categories: Activity, Sports, Educational, Playzone
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'yuno_db'

async def add_categories():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        # Categories to add
        new_categories = [
            {
                "id": str(uuid4()),
                "slug": "sports",
                "name": "Sports",
                "icon": "⚽"
            },
            {
                "id": str(uuid4()),
                "slug": "activity",
                "name": "Activity",
                "icon": "🎭"
            },
            {
                "id": str(uuid4()),
                "slug": "educational",
                "name": "Educational",
                "icon": "📚"
            },
            {
                "id": str(uuid4()),
                "slug": "playzone",
                "name": "Playzone",
                "icon": "🎮"
            }
        ]
        
        print("Adding missing categories...")
        
        for category in new_categories:
            # Check if already exists
            existing = await db.categories.find_one({"slug": category["slug"]})
            if existing:
                print(f"  ⏭️  {category['name']} already exists")
            else:
                await db.categories.insert_one(category)
                print(f"  ✅ Added {category['name']}")
        
        print("\n✅ Categories updated successfully!")
        
        # Show all categories
        print("\n📋 All categories:")
        categories = await db.categories.find({}, {"_id": 0, "name": 1, "slug": 1, "icon": 1}).to_list(None)
        for cat in categories:
            print(f"  {cat['icon']} {cat['name']} ({cat['slug']})")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_categories())
