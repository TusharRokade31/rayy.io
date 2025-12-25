"""
Update Elderly Listings Age Range to 50+
Update age_min from 60 to 50 for all elderly activity listings
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def update_elderly_age_range():
    """Update elderly listings to start from age 50"""
    print("👴 Updating elderly activity age range to 50+...")
    
    # Update all elderly category listings
    result = await db.listings.update_many(
        {"category": "elderly"},
        {
            "$set": {
                "age_min": 50,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} elderly listings")
    
    # Verify the updates
    elderly_listings = await db.listings.find(
        {"category": "elderly"},
        {"_id": 0, "title": 1, "age_min": 1, "age_max": 1}
    ).to_list(length=None)
    
    print("\n📋 Elderly activities (Age Range):")
    for listing in elderly_listings:
        print(f"   • {listing['title']}: Age {listing['age_min']}-{listing['age_max']}")

async def update_other_adult_listings():
    """Update other adult-focused listings to appropriate ranges"""
    print("\n👨 Updating adult activity age ranges...")
    
    # Update yoga and wellness adult listings
    result1 = await db.listings.update_many(
        {
            "category": "yoga",
            "age_min": {"$gte": 18},
            "age_max": {"$lte": 60},
            "title": {"$regex": "Adult|Power"}
        },
        {
            "$set": {
                "age_max": 49,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update swimming adult lessons
    result2 = await db.listings.update_many(
        {
            "category": "swimming",
            "age_min": {"$gte": 18},
            "age_max": {"$gte": 60},
            "title": {"$regex": "Adult"}
        },
        {
            "$set": {
                "age_max": 49,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update senior aqua therapy to start at 50
    result3 = await db.listings.update_many(
        {
            "title": {"$regex": "Senior|Aqua Therapy"}
        },
        {
            "$set": {
                "age_min": 50,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    print(f"✅ Updated {result1.modified_count + result2.modified_count + result3.modified_count} adult listings")

async def main():
    print("🔧 Updating age ranges...")
    print("=" * 60)
    
    await update_elderly_age_range()
    await update_other_adult_listings()
    
    print("\n" + "=" * 60)
    print("✅ Age range updates completed!")
    print("\n📝 New Age Ranges:")
    print("   - Adults: 19-49 years")
    print("   - Elderly ∞: 50-85 years")

if __name__ == "__main__":
    asyncio.run(main())
