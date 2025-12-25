"""
Add sessions to workshops and camps
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid
import random

async def add_sessions():
    """Add sessions to workshops and camps"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['yuno_db']
    
    try:
        await db.command('ping')
        print("✅ MongoDB connection successful")
        
        # Get all workshops and camps without sessions
        workshops = await db.listings.find({
            "listing_type": {"$in": ["workshop", "camp"]},
            "status": "active"
        }, {"_id": 0}).to_list(None)
        
        print(f"\n📊 Found {len(workshops)} workshops/camps")
        
        sessions_created = 0
        
        for listing in workshops:
            listing_id = listing['id']
            listing_type = listing.get('listing_type', 'workshop')
            duration = listing.get('duration_minutes', 90)
            
            # Check if sessions already exist
            existing = await db.sessions.count_documents({"listing_id": listing_id})
            if existing > 0:
                print(f"  ⏭️  {listing['title']}: Already has {existing} sessions")
                continue
            
            # Create sessions for next 14 days
            start_date = datetime.now(timezone.utc)
            
            for day_offset in range(14):
                session_date = start_date + timedelta(days=day_offset)
                
                # Skip Sundays
                if session_date.weekday() == 6:
                    continue
                
                # Camps: 1 session per day (10 AM)
                # Workshops: 2-3 sessions per day
                num_sessions = 1 if listing_type == "camp" else random.randint(2, 3)
                
                for session_num in range(num_sessions):
                    if listing_type == "camp":
                        hour = 10  # 10 AM for camps
                    else:
                        hour = 10 + (session_num * 3)  # 10 AM, 1 PM, 4 PM for workshops
                    
                    session_start = session_date.replace(
                        hour=hour,
                        minute=0,
                        second=0,
                        microsecond=0
                    )
                    session_end = session_start + timedelta(minutes=duration)
                    
                    session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing_id,
                        "start_at": session_start,
                        "end_at": session_end,
                        "seats_total": random.randint(15, 25),
                        "seats_booked": random.randint(0, 3),
                        "status": "scheduled",
                        "created_at": datetime.now(timezone.utc)
                    }
                    
                    await db.sessions.insert_one(session)
                    sessions_created += 1
            
            session_count = await db.sessions.count_documents({"listing_id": listing_id})
            print(f"  ✅ {listing['title']}: Created {session_count} sessions")
        
        print(f"\n🎉 COMPLETE! Created {sessions_created} new sessions")
        
        # Summary
        total_sessions = await db.sessions.count_documents({})
        print(f"\n📊 Database now has {total_sessions} total sessions")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("="*60)
    print("  ADDING SESSIONS TO WORKSHOPS AND CAMPS")
    print("="*60)
    print()
    
    asyncio.run(add_sessions())
