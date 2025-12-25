#!/usr/bin/env python3
"""
Quick script to assign sample badges to listings for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def assign_sample_badges():
    """Assign badges to some listings for visual testing"""
    
    print("🎖️ Assigning sample badges to listings...")
    
    # Get first 10 active listings
    listings = await db.listings.find({"status": "active"}).limit(10).to_list(10)
    
    if not listings:
        print("❌ No listings found")
        return
    
    print(f"✅ Found {len(listings)} listings")
    
    # Assign different badges to different listings
    updates = []
    
    for idx, listing in enumerate(listings):
        badges = []
        
        # First 3 listings get "verified" badge
        if idx < 3:
            badges.append("verified")
            print(f"  ✓ {listing['title'][:40]} → Verified by rayy")
        
        # Listings 3-6 get "top_rated" badge
        if 3 <= idx < 6:
            badges.append("top_rated")
            # Also update rating to meet criteria
            await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": {"rating_avg": 4.7, "rating_count": 15}}
            )
            print(f"  ⭐ {listing['title'][:40]} → Top Rated")
        
        # Listings 6-8 get "founding_partner" badge
        if 6 <= idx < 8:
            badges.append("founding_partner")
            print(f"  🏆 {listing['title'][:40]} → Founding Partner")
        
        # Listing 8-9 get "popular" badge
        if 8 <= idx < 10:
            badges.append("popular")
            print(f"  🔥 {listing['title'][:40]} → Popular Choice")
        
        # Some listings get multiple badges
        if idx == 0:
            badges.extend(["top_rated", "popular"])
            await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": {"rating_avg": 4.8, "rating_count": 25}}
            )
            print(f"  ⭐🔥 {listing['title'][:40]} → Also Top Rated + Popular")
        
        if badges:
            await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": {"badges": badges}}
            )
    
    print("\n✅ Badges assigned successfully!")
    print("\n📊 Summary:")
    print(f"  • 3 listings with 'Verified by rayy' badge")
    print(f"  • 3 listings with 'Top Rated' badge")
    print(f"  • 2 listings with 'Founding Partner' badge")
    print(f"  • 2 listings with 'Popular Choice' badge")
    print(f"  • 1 listing with multiple badges")
    print("\n🎉 Refresh your homepage to see the badges!")

if __name__ == "__main__":
    asyncio.run(assign_sample_badges())
    print("✅ Script complete!")
