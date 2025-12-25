"""
Update Elderly Listings to 50+ (infinity)
Set age_max to 999 to represent infinity
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

async def update_elderly_to_infinity():
    """Update elderly listings to 50-infinity (50-999)"""
    print("👴 Updating elderly activities to 50+ (infinity)...")
    
    # Update all elderly category listings
    result = await db.listings.update_many(
        {"category": "elderly"},
        {
            "$set": {
                "age_min": 50,
                "age_max": 999,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} elderly listings")
    
    # Verify the updates
    elderly_listings = await db.listings.find(
        {"category": "elderly"},
        {"_id": 0, "title": 1, "age_min": 1, "age_max": 1, "base_price_inr": 1}
    ).to_list(length=None)
    
    print("\n📋 Elderly Activities (Age 50+):")
    for listing in elderly_listings:
        age_display = f"{listing['age_min']}+" if listing['age_max'] >= 999 else f"{listing['age_min']}-{listing['age_max']}"
        print(f"   • {listing['title']}: Age {age_display}, ₹{listing['base_price_inr']}")

async def main():
    print("🔧 Updating elderly age range to infinity...")
    print("=" * 60)
    
    await update_elderly_to_infinity()
    
    print("\n" + "=" * 60)
    print("✅ Update completed!")
    print("\n📝 New Configuration:")
    print("   - Elderly: Age 50+ (no upper limit)")
    print("   - Display: Shows as '50+' on frontend")
    print("   - Database: age_min=50, age_max=999")

if __name__ == "__main__":
    asyncio.run(main())
