"""
Add More Sessions to All Listings
Ensure every listing has at least 30 future sessions for plans to work
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import os
import random
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def add_sessions_to_listing(listing_id, count=40):
    """Add future sessions for a listing"""
    sessions = []
    base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    for i in range(count):
        # Distribute sessions over next 45 days
        days_ahead = random.randint(1, 45)
        session_date = base_date + timedelta(days=days_ahead)
        
        # Random time slots (morning, afternoon, evening)
        hour = random.choice([7, 8, 9, 10, 11, 15, 16, 17, 18, 19])
        session_datetime = session_date.replace(hour=hour, minute=0)
        
        session = {
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "date": session_datetime.date().isoformat(),
            "time": session_datetime.time().isoformat(),
            "session_datetime": session_datetime,
            "start_at": session_datetime,
            "end_at": session_datetime + timedelta(hours=1),
            "seats_total": random.randint(10, 20),
            "seats_reserved": 0,  # Start fresh
            "price_inr": None,  # Use listing price
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc),
        }
        sessions.append(session)
    
    if sessions:
        await db.sessions.insert_many(sessions)
    
    return len(sessions)

async def ensure_all_listings_have_sessions():
    """Ensure all listings have enough sessions"""
    print("📅 Adding more sessions to all listings...")
    
    # Get all active listings
    listings = await db.listings.find({"status": "active"}, {"_id": 0, "id": 1, "title": 1}).to_list(length=None)
    print(f"Found {len(listings)} active listings")
    
    total_sessions_added = 0
    
    for listing in listings:
        listing_id = listing["id"]
        
        # Count existing future sessions
        today = datetime.now(timezone.utc).date().isoformat()
        existing_sessions = await db.sessions.count_documents({
            "listing_id": listing_id,
            "status": "scheduled",
            "date": {"$gte": today}
        })
        
        # Add more if needed (target 40 sessions minimum)
        if existing_sessions < 40:
            sessions_to_add = 40 - existing_sessions
            added = await add_sessions_to_listing(listing_id, sessions_to_add)
            total_sessions_added += added
            print(f"   ✅ {listing['title']}: Added {added} sessions (had {existing_sessions})")
        else:
            print(f"   ✓ {listing['title']}: Already has {existing_sessions} sessions")
    
    print(f"\n✅ Added {total_sessions_added} new sessions across all listings")

async def verify_plans_availability():
    """Verify that plans are now available"""
    print("\n🔍 Verifying plans availability...")
    
    # Sample a few listings
    sample_listings = await db.listings.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "title": 1, "category": 1}
    ).limit(5).to_list(length=5)
    
    for listing in sample_listings:
        today = datetime.now(timezone.utc).date().isoformat()
        sessions_count = await db.sessions.count_documents({
            "listing_id": listing["id"],
            "status": "scheduled",
            "date": {"$gte": today}
        })
        
        weekly_available = sessions_count >= 4
        monthly_available = sessions_count >= 12
        
        status = "✅" if monthly_available else ("⚠️" if weekly_available else "❌")
        print(f"   {status} {listing['title']}: {sessions_count} sessions")
        print(f"      Weekly Plan: {'Available' if weekly_available else 'Not Available'}")
        print(f"      Monthly Plan: {'Available' if monthly_available else 'Not Available'}")

async def main():
    print("🔧 Adding sessions to ensure plans are available...")
    print("=" * 60)
    
    await ensure_all_listings_have_sessions()
    await verify_plans_availability()
    
    print("\n" + "=" * 60)
    print("✅ Session update completed!")
    print("\n📝 Summary:")
    print("   - All listings now have 40+ future sessions")
    print("   - Weekly plans (4 sessions) available for all")
    print("   - Monthly plans (12 sessions) available for all")

if __name__ == "__main__":
    asyncio.run(main())
