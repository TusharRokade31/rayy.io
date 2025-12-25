"""
Add Badge System to Partners and Listings
- Verified by rayy badge (for both partners and listings)
- Founding Partner badge (permanent, for early partners)
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

async def add_badge_fields():
    """Add badge fields to partners and listings"""
    print("🏆 Adding badge system to database...")
    
    # Update all partners with badge fields
    partners_result = await db.partners.update_many(
        {},
        {
            "$set": {
                "verified_by_rrray": False,
                "founding_partner": False,
                "founding_partner_date": None,
                "badges": []  # Array to store all badges
            }
        }
    )
    
    print(f"✅ Updated {partners_result.modified_count} partners with badge fields")
    
    # Update all listings with badge fields
    listings_result = await db.listings.update_many(
        {},
        {
            "$set": {
                "verified_by_rrray": False,
                "badges": []  # Array to store all badges
            }
        }
    )
    
    print(f"✅ Updated {listings_result.modified_count} listings with badge fields")

async def verify_updates():
    """Verify the updates"""
    print("\n🔍 Verifying updates...")
    
    # Check a sample partner
    sample_partner = await db.partners.find_one({}, {"_id": 0, "brand_name": 1, "verified_by_rrray": 1, "founding_partner": 1})
    if sample_partner:
        print(f"   Sample Partner: {sample_partner.get('brand_name')}")
        print(f"   - Verified: {sample_partner.get('verified_by_rrray')}")
        print(f"   - Founding Partner: {sample_partner.get('founding_partner')}")
    
    # Check a sample listing
    sample_listing = await db.listings.find_one({}, {"_id": 0, "title": 1, "verified_by_rrray": 1})
    if sample_listing:
        print(f"   Sample Listing: {sample_listing.get('title')}")
        print(f"   - Verified: {sample_listing.get('verified_by_rrray')}")

async def main():
    print("🔧 Setting up badge system...")
    print("=" * 60)
    
    await add_badge_fields()
    await verify_updates()
    
    print("\n" + "=" * 60)
    print("✅ Badge system setup completed!")
    print("\n📝 Available Badges:")
    print("   1. ✓ Verified by rayy - Trust badge for quality partners/listings")
    print("   2. 🌟 Founding Partner - Permanent badge for early partners")
    print("\nAdmins can now assign these badges from the admin panel!")

if __name__ == "__main__":
    asyncio.run(main())
