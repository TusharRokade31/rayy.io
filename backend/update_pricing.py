"""
Update All Listings with Affordable Pricing (₹99-₹399)
This script will update existing listings to have standard pricing
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

# New affordable price ranges by category
PRICE_RANGES = {
    "dance": 199,
    "music": 249,
    "art": 149,
    "coding": 299,
    "martial_arts": 199,
    "fitness": 149,
    "swimming": 299,
    "pickleball": 199,
    "cricket": 249,
    "badminton": 179,
    "turf_sports": 399,  # Slot booking can be higher
    "coaching": 299,
    "yoga": 149,
    "elderly": 99,  # Most affordable for seniors
    "slot_booking": 199,
    "default": 199
}

async def update_listing_prices():
    """Update all listings to affordable pricing"""
    print("💰 Updating all listings to affordable pricing (₹99-₹399)...")
    
    # Get all listings
    listings = await db.listings.find({}, {"_id": 0}).to_list(length=None)
    print(f"Found {len(listings)} listings to update")
    
    updated_count = 0
    for listing in listings:
        category = listing.get("category", "default")
        new_price = PRICE_RANGES.get(category, PRICE_RANGES["default"])
        
        # Update the listing
        await db.listings.update_one(
            {"id": listing["id"]},
            {
                "$set": {
                    "base_price_inr": new_price,
                    "trial_price_inr": round(new_price * 0.5) if listing.get("trial_available") else 0,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        updated_count += 1
    
    print(f"✅ Updated {updated_count} listings with new pricing")
    
    # Show some examples
    print("\n📊 Sample pricing by category:")
    for category, price in sorted(PRICE_RANGES.items()):
        count = await db.listings.count_documents({"category": category})
        if count > 0:
            print(f"   {category}: ₹{price}/session ({count} listings)")

async def ensure_plans_visible():
    """Ensure all listings have proper structure for plans"""
    print("\n📋 Ensuring plans structure is correct...")
    
    # Update all listings to ensure they're set up for plans
    result = await db.listings.update_many(
        {},
        {
            "$set": {
                "plans_enabled": True,
                "weekly_discount_percent": 10,
                "monthly_discount_percent": 25,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} listings with plans configuration")

async def verify_listings():
    """Verify a few listings to ensure they're accessible"""
    print("\n🔍 Verifying sample listings...")
    
    # Get a few listings from different categories
    sample_categories = ["elderly", "pickleball", "coaching", "yoga", "turf_sports"]
    
    for category in sample_categories:
        listing = await db.listings.find_one({"category": category}, {"_id": 0})
        if listing:
            print(f"   ✅ {category}: {listing['title']} - ₹{listing['base_price_inr']}")
            
            # Check sessions count
            sessions_count = await db.sessions.count_documents({"listing_id": listing["id"]})
            print(f"      Sessions: {sessions_count}")

async def main():
    print("🔧 Starting pricing update and verification...")
    print("=" * 60)
    
    # Update prices
    await update_listing_prices()
    
    # Ensure plans are visible
    await ensure_plans_visible()
    
    # Verify listings
    await verify_listings()
    
    print("\n" + "=" * 60)
    print("✅ All updates completed successfully!")
    print("\n📝 Summary:")
    print("   - All listings now priced between ₹99-₹399")
    print("   - Trial classes: 50% of regular price")
    print("   - Weekly plans: 10% discount (4 sessions)")
    print("   - Monthly plans: 25% discount (12 sessions)")
    print("   - Elderly activities: Most affordable at ₹99")

if __name__ == "__main__":
    asyncio.run(main())
