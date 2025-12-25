#!/usr/bin/env python3
"""
Maintain sessions - runs daily to keep sessions fresh
Adds new sessions for 2 weeks out, removes past sessions
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

async def maintain_sessions():
    """Daily session maintenance"""
    
    print(f"🔧 Session Maintenance - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    two_weeks_out = now + timedelta(days=14)
    
    # Delete past sessions (older than yesterday)
    result = await db.sessions.delete_many({
        "datetime": {"$lt": yesterday.isoformat()}
    })
    print(f"🗑️  Deleted {result.deleted_count} past sessions")
    
    # Get all active listings
    listings = await db.listings.find(
        {"status": "active"},
        {"id": 1, "venue_id": 1, "trial_available": 1, "trial_price_inr": 1, 
         "base_price_inr": 1, "duration_minutes": 1, "title": 1}
    ).to_list(500)
    
    new_sessions = 0
    
    # For each listing, ensure they have sessions for the next 2 weeks
    for listing in listings:
        # Check what dates already have sessions
        existing_sessions = await db.sessions.find(
            {"listing_id": listing["id"]},
            {"date": 1}
        ).to_list(500)
        
        existing_dates = set(s["date"] for s in existing_sessions)
        
        # Add sessions for dates that don't exist
        for day_offset in range(14):
            session_date = (now + timedelta(days=day_offset)).date()
            date_str = session_date.isoformat()
            
            # Skip if this date already has sessions
            if date_str in existing_dates:
                continue
            
            # Create sessions for this new date
            time_slots = [
                {"hour": 9, "minute": 0},
                {"hour": 10, "minute": 30},
                {"hour": 14, "minute": 0},
                {"hour": 15, "minute": 30},
                {"hour": 17, "minute": 0},
                {"hour": 18, "minute": 30}
            ]
            
            selected_slots = random.sample(time_slots, random.randint(3, 4))
            
            for time_slot in selected_slots:
                session_datetime = datetime.combine(
                    session_date,
                    datetime.min.time()
                ).replace(
                    hour=time_slot["hour"],
                    minute=time_slot["minute"],
                    second=0,
                    microsecond=0,
                    tzinfo=timezone.utc
                )
                
                if session_datetime < now:
                    continue
                
                duration = listing.get("duration_minutes", 60)
                end_datetime = session_datetime + timedelta(minutes=duration)
                
                # Trial session
                if listing.get("trial_available") and listing.get("trial_price_inr"):
                    trial_session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing["id"],
                        "venue_id": listing.get("venue_id"),
                        "date": date_str,
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
                    new_sessions += 1
                
                # Regular session
                single_session = {
                    "id": str(uuid.uuid4()),
                    "listing_id": listing["id"],
                    "venue_id": listing.get("venue_id"),
                    "date": date_str,
                    "time": session_datetime.time().isoformat(),
                    "datetime": session_datetime.isoformat(),
                    "start_at": session_datetime.isoformat(),
                    "end_at": end_datetime.isoformat(),
                    "plan_type": "single",
                    "plan_name": "Single Session",
                    "price_inr": listing.get("base_price_inr", 500),
                    "capacity": random.randint(10, 20),
                    "seats_total": random.randint(10, 20),
                    "booked": 0,
                    "seats_reserved": 0,
                    "duration_minutes": duration,
                    "status": "scheduled",
                    "created_at": now.isoformat()
                }
                await db.sessions.insert_one(single_session)
                new_sessions += 1
    
    # Summary
    total_sessions = await db.sessions.count_documents({"status": "scheduled"})
    trial_sessions = await db.sessions.count_documents({"plan_type": "trial", "status": "scheduled"})
    
    print(f"✅ Added {new_sessions} new sessions")
    print(f"📊 Total active sessions: {total_sessions}")
    print(f"🎯 Trial sessions: {trial_sessions}")
    print(f"✨ Maintenance complete!\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(maintain_sessions())
