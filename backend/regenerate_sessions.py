#!/usr/bin/env python3
"""
Regenerate all sessions with current dates
Fixes: No sessions available issue after deployment
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid
from dotenv import load_dotenv
import random

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def regenerate_sessions():
    """Delete old sessions and create new ones for next 14 days"""
    
    print("🔄 Regenerating Sessions with Current Dates\n")
    
    # Delete all old sessions
    result = await db.sessions.delete_many({})
    print(f"🗑️  Deleted {result.deleted_count} old sessions")
    
    # Get all active listings
    listings = await db.listings.find(
        {"status": "active"},
        {"id": 1, "venue_id": 1, "trial_available": 1, "trial_price_inr": 1, 
         "base_price_inr": 1, "duration_minutes": 1, "title": 1}
    ).to_list(500)
    
    print(f"📋 Found {len(listings)} active listings\n")
    
    total_sessions = 0
    now = datetime.now(timezone.utc)
    
    # Create sessions for next 14 days
    for listing in listings:
        listing_sessions = 0
        
        for day_offset in range(14):  # 2 weeks of sessions
            session_date = now + timedelta(days=day_offset)
            
            # Multiple time slots per day
            time_slots = [
                {"hour": 9, "minute": 0},
                {"hour": 10, "minute": 30},
                {"hour": 14, "minute": 0},
                {"hour": 15, "minute": 30},
                {"hour": 17, "minute": 0},
                {"hour": 18, "minute": 30}
            ]
            
            # Create 3-4 sessions per day
            num_slots = random.randint(3, 4)
            selected_slots = random.sample(time_slots, num_slots)
            
            for time_slot in selected_slots:
                session_datetime = session_date.replace(
                    hour=time_slot["hour"],
                    minute=time_slot["minute"],
                    second=0,
                    microsecond=0
                )
                
                # Skip if time has already passed today
                if session_datetime < now:
                    continue
                
                duration = listing.get("duration_minutes", 60)
                end_datetime = session_datetime + timedelta(minutes=duration)
                
                # Create trial session if available
                if listing.get("trial_available") and listing.get("trial_price_inr"):
                    trial_session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing["id"],
                        "venue_id": listing.get("venue_id"),
                        "date": session_datetime.date().isoformat(),
                        "time": session_datetime.time().isoformat(),
                        "datetime": session_datetime.isoformat(),
                        "start_at": session_datetime.isoformat(),
                        "end_at": end_datetime.isoformat(),
                        "plan_type": "trial",
                        "plan_name": "Trial Session",
                        "price_inr": listing["trial_price_inr"],
                        "capacity": random.randint(10, 20),
                        "seats_total": random.randint(10, 20),
                        "booked": 0,
                        "seats_reserved": 0,
                        "duration_minutes": duration,
                        "status": "scheduled",
                        "created_at": now.isoformat()
                    }
                    await db.sessions.insert_one(trial_session)
                    listing_sessions += 1
                    total_sessions += 1
                
                # Create single session
                single_session = {
                    "id": str(uuid.uuid4()),
                    "listing_id": listing["id"],
                    "venue_id": listing.get("venue_id"),
                    "date": session_datetime.date().isoformat(),
                    "time": session_datetime.time().isoformat(),
                    "datetime": session_datetime.isoformat(),
                    "start_at": session_datetime.isoformat(),
                    "end_at": end_datetime.isoformat(),
                    "plan_type": "single",
                    "plan_name": "Single Session",
                    "price_inr": listing.get("base_price_inr", 500),
                    "capacity": random.randint(10, 20),
                    "seats_total": random.randint(10, 20),
                    "booked": random.randint(0, 3),
                    "seats_reserved": random.randint(0, 3),
                    "duration_minutes": duration,
                    "status": "scheduled",
                    "created_at": now.isoformat()
                }
                await db.sessions.insert_one(single_session)
                listing_sessions += 1
                total_sessions += 1
        
        if listing_sessions > 0:
            print(f"  ✅ {listing.get('title', listing['id'])[:40]}: {listing_sessions} sessions")
    
    print(f"\n🎉 Session Regeneration Complete!")
    print(f"   Total sessions created: {total_sessions}")
    print(f"   Average per listing: {total_sessions / len(listings):.1f}")
    print(f"   Date range: {now.date()} to {(now + timedelta(days=14)).date()}")
    
    # Verify
    trial_count = await db.sessions.count_documents({"plan_type": "trial", "status": "scheduled"})
    upcoming_count = await db.sessions.count_documents({
        "status": "scheduled",
        "datetime": {"$gte": now.isoformat()}
    })
    
    print(f"\n📊 Verification:")
    print(f"   Trial sessions: {trial_count}")
    print(f"   Upcoming sessions: {upcoming_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(regenerate_sessions())
