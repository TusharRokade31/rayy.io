import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def setup_geo_index():
    """Create 2dsphere index on venues collection"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Create 2dsphere index on venues
    try:
        await db.venues.create_index([("location", "2dsphere")])
        print("✅ Created 2dsphere index on venues.location")
    except Exception as e:
        print(f"Index creation result: {e}")
    
    # Verify index
    indexes = await db.venues.list_indexes().to_list(None)
    print(f"\n📊 Venues indexes:")
    for idx in indexes:
        print(f"  - {idx.get('name')}: {idx.get('key')}")
    
    # Check if venues have location data
    venues_with_location = await db.venues.count_documents({"location": {"$exists": True}})
    total_venues = await db.venues.count_documents({})
    print(f"\n📍 Venues with location: {venues_with_location}/{total_venues}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_geo_index())
