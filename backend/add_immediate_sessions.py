"""
Add sessions for TODAY and next 7 days for immediate testing
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid
from dotenv import load_dotenv
import random

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def add_immediate_sessions():
    print("🌱 Adding sessions for TODAY and next 7 days...")
    
    # Get all active listings
    listings = await db.listings.find({"status": "active"}).to_list(100)
    if not listings:
        print("❌ No active listings found.")
        return
    
    print(f"Found {len(listings)} active listings")
    
    session_plans = [
        {"type": "single", "name": "Single Session", "sessions": 1, "price_multiplier": 1.0},
        {"type": "weekly", "name": "Weekly Plan (4 sessions)", "sessions": 4, "price_multiplier": 0.9},
        {"type": "monthly", "name": "Monthly Plan (12 sessions)", "sessions": 12, "price_multiplier": 0.75},
    ]
    
    total_created = 0
    
    # Create sessions for next 7 days
    for day_offset in range(7):
        session_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
        
        print(f"\n📅 Creating sessions for {session_date.date()}")
        
        for listing in listings:
            # Get venue for this listing (if not online)
            venue_id = None
            if not listing.get("is_online", False):
                venue = await db.venues.find_one({"partner_id": listing["partner_id"]})
                if venue:
                    venue_id = venue["id"]
            
            # Create 2-3 sessions per day
            session_times = [
                {"hour": 10, "minute": 0},
                {"hour": 15, "minute": 0},
                {"hour": 18, "minute": 30}
            ]
            
            # Select 2 random time slots
            for time_slot in random.sample(session_times, 2):
                plan = random.choice(session_plans)
                
                session_datetime = session_date.replace(
                    hour=time_slot["hour"],
                    minute=time_slot["minute"],
                    second=0,
                    microsecond=0
                )
                
                # Calculate price based on plan
                base_price = listing.get("base_price_inr", 1000)
                session_price = int(base_price * plan["price_multiplier"])
                
                session = {
                    "id": str(uuid.uuid4()),
                    "listing_id": listing["id"],
                    "venue_id": venue_id,
                    "date": session_datetime.date().isoformat(),
                    "time": session_datetime.time().isoformat(),
                    "seats_total": random.randint(15, 30),
                    "seats_reserved": 0,  # No reservations yet for fresh testing
                    "price_inr": session_price,
                    "plan_type": plan["type"],
                    "plan_name": plan["name"],
                    "sessions_count": plan["sessions"],
                    "duration_minutes": listing.get("duration_minutes", 60),
                    "status": "scheduled",
                    "created_at": datetime.now(timezone.utc)
                }
                
                await db.sessions.insert_one(session)
                total_created += 1
        
        print(f"   ✅ Created {len(listings) * 2} sessions")
    
    print(f"\n✅ Successfully created {total_created} sessions!")
    print(f"📊 Sessions span from TODAY to {(datetime.now(timezone.utc) + timedelta(days=6)).date()}")
    print(f"⏰ Time slots: 10:00 AM, 3:00 PM, 6:30 PM")
    print(f"💰 Pricing: Single, Weekly (10% off), Monthly (25% off)")

if __name__ == "__main__":
    asyncio.run(add_immediate_sessions())
