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
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "rayy_db")
    
    print(f"Connecting to: {mongo_url}")
    print(f"Database: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Define the Nested Structure
    categories_data = [
        {
            "slug": "sports",
            "name": "Sports",
            "icon": "⚽",
            "subcategories": [
                {"id": str(uuid.uuid4()), "slug": "cricket", "name": "Cricket", "icon": "🏏"},
                {"id": str(uuid.uuid4()), "slug": "football", "name": "Football", "icon": "⚽"},
                {"id": str(uuid.uuid4()), "slug": "swimming", "name": "Swimming", "icon": "🏊"},
                {"id": str(uuid.uuid4()), "slug": "badminton", "name": "Badminton", "icon": "🏸"},
                {"id": str(uuid.uuid4()), "slug": "skating", "name": "Skating", "icon": "🛼"}
            ]
        },
        {
            "slug": "activity",
            "name": "Activity",
            "icon": "🎭",
            "subcategories": [
                {"id": str(uuid.uuid4()), "slug": "dance", "name": "Dance", "icon": "💃"},
                {"id": str(uuid.uuid4()), "slug": "music", "name": "Music", "icon": "🎵"},
                {"id": str(uuid.uuid4()), "slug": "drama", "name": "Drama", "icon": "🎭"},
                {"id": str(uuid.uuid4()), "slug": "yoga", "name": "Yoga", "icon": "🧘"},
                {"id": str(uuid.uuid4()), "slug": "painting", "name": "Art & Craft", "icon": "🎨"}
            ]
        },
        {
            "slug": "educational",
            "name": "Educational",
            "icon": "📚",
            "subcategories": [
                {"id": str(uuid.uuid4()), "slug": "robotics", "name": "Robotics", "icon": "🤖"},
                {"id": str(uuid.uuid4()), "slug": "chess", "name": "Chess", "icon": "♟️"},
                {"id": str(uuid.uuid4()), "slug": "coding", "name": "Coding", "icon": "💻"},
                {"id": str(uuid.uuid4()), "slug": "abacus", "name": "Abacus", "icon": "🧮"}
            ]
        },
        {
            "slug": "playzone",
            "name": "Playzone",
            "icon": "🎮",
            "subcategories": [
                {"id": str(uuid.uuid4()), "slug": "arcade", "name": "Arcade", "icon": "🕹️"},
                {"id": str(uuid.uuid4()), "slug": "soft-play", "name": "Soft Play", "icon": "🧸"},
                {"id": str(uuid.uuid4()), "slug": "trampoline", "name": "Trampoline", "icon": "🤸"},
                {"id": str(uuid.uuid4()), "slug": "laser-tag", "name": "Laser Tag", "icon": "🔫"}
            ]
        }
    ]
    
    print("\n🌱 Seeding Categories and Subcategories...")

    # We use update_one with upsert=True. 
    # This updates the document if it exists, or creates it if it doesn't.
    for cat in categories_data:
        # Assign a UUID only if we are inserting a brand new doc, 
        # but here we rely on the query to find existing ones by slug.
        
        update_data = {
            "$set": {
                "name": cat["name"],
                "icon": cat["icon"],
                "subcategories": cat["subcategories"]
            },
            "$setOnInsert": {
                "id": str(uuid.uuid4()) # Only set ID on creation
            }
        }
        
        await db.categories.update_one(
            {"slug": cat["slug"]}, 
            update_data, 
            upsert=True
        )
        print(f"✅ Processed: {cat['name']} with {len(cat['subcategories'])} subcategories")

    total = await db.categories.count_documents({})
    print(f"\n📊 Total Main Categories: {total}")

if __name__ == "__main__":
    asyncio.run(add_more_categories())