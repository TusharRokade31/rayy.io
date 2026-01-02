"""
Bulk add sessions for all listings until January 2026
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "rayy_db")


async def add_sessions_for_all_listings():
    """Add sessions for all active listings until January 2026"""
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔍 Fetching all active listings...")
    
    # Get all active listings
    listings = await db.listings.find(
        {"status": "active"},
        {"_id": 0, "id": 1, "title": 1, "listing_type": 1}
    ).to_list(1000)
    
    print(f"📊 Found {len(listings)} active listings")
    
    # Date range: Now to January 31, 2026
    start_date = datetime.now(timezone.utc)
    end_date = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)
    
    print(f"📅 Creating sessions from {start_date.date()} to {end_date.date()}")
    
    total_sessions_added = 0
    
    for listing in listings:
        listing_id = listing["id"]
        title = listing.get("title", "Unknown")
        listing_type = listing.get("listing_type", "class")
        
        print(f"\n📝 Processing: {title[:50]}...")
        
        # Check existing sessions
        existing_count = await db.sessions.count_documents({"listing_id": listing_id})
        print(f"   Existing sessions: {existing_count}")
        
        # Generate sessions based on listing type
        sessions_to_add = []
        
        if listing_type in ["workshop", "camp"]:
            # Workshops and camps: Weekly sessions on weekends
            current = start_date
            while current <= end_date:
                # Saturday sessions
                if current.weekday() == 5:  # Saturday
                    for hour in [10, 14]:  # 10 AM and 2 PM
                        session_time = current.replace(hour=hour, minute=0, second=0)
                        sessions_to_add.append({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "start_at": session_time,
                            "end_at": session_time + timedelta(hours=2),
                            "seats_total": 20,
                            "seats_booked": 0,
                            "seats_available": 20,
                            "is_bookable": True,
                            "status": "scheduled",
                            "created_at": datetime.now(timezone.utc)
                        })
                
                # Sunday sessions
                if current.weekday() == 6:  # Sunday
                    for hour in [11, 15]:  # 11 AM and 3 PM
                        session_time = current.replace(hour=hour, minute=0, second=0)
                        sessions_to_add.append({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "start_at": session_time,
                            "end_at": session_time + timedelta(hours=2),
                            "seats_total": 20,
                            "seats_booked": 0,
                            "seats_available": 20,
                            "is_bookable": True,
                            "status": "scheduled",
                            "created_at": datetime.now(timezone.utc)
                        })
                
                current += timedelta(days=1)
        
        else:
            # Regular classes: Multiple sessions per week
            current = start_date
            while current <= end_date:
                # Weekday sessions (Monday to Friday)
                if current.weekday() < 5:  # Monday-Friday
                    for hour in [16, 17, 18]:  # 4 PM, 5 PM, 6 PM
                        session_time = current.replace(hour=hour, minute=0, second=0)
                        sessions_to_add.append({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "start_at": session_time,
                            "end_at": session_time + timedelta(hours=1),
                            "seats_total": 15,
                            "seats_booked": 0,
                            "seats_available": 15,
                            "is_bookable": True,
                            "status": "scheduled",
                            "created_at": datetime.now(timezone.utc)
                        })
                
                # Saturday sessions
                elif current.weekday() == 5:  # Saturday
                    for hour in [9, 11, 14, 16]:  # 9 AM, 11 AM, 2 PM, 4 PM
                        session_time = current.replace(hour=hour, minute=0, second=0)
                        sessions_to_add.append({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "start_at": session_time,
                            "end_at": session_time + timedelta(hours=1),
                            "seats_total": 15,
                            "seats_booked": 0,
                            "seats_available": 15,
                            "is_bookable": True,
                            "status": "scheduled",
                            "created_at": datetime.now(timezone.utc)
                        })
                
                # Sunday sessions
                elif current.weekday() == 6:  # Sunday
                    for hour in [10, 12, 15]:  # 10 AM, 12 PM, 3 PM
                        session_time = current.replace(hour=hour, minute=0, second=0)
                        sessions_to_add.append({
                            "id": str(uuid.uuid4()),
                            "listing_id": listing_id,
                            "start_at": session_time,
                            "end_at": session_time + timedelta(hours=1),
                            "seats_total": 15,
                            "seats_booked": 0,
                            "seats_available": 15,
                            "is_bookable": True,
                            "status": "scheduled",
                            "created_at": datetime.now(timezone.utc)
                        })
                
                current += timedelta(days=1)
        
        # Insert sessions
        if sessions_to_add:
            result = await db.sessions.insert_many(sessions_to_add)
            added = len(result.inserted_ids)
            total_sessions_added += added
            print(f"   ✅ Added {added} sessions")
        else:
            print(f"   ⚠️ No sessions to add")
    
    print(f"\n🎉 COMPLETE!")
    print(f"📊 Total sessions added: {total_sessions_added}")
    print(f"📅 Sessions available until: January 31, 2026")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_sessions_for_all_listings())
