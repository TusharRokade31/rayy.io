"""
Fix session status to 'scheduled' for upcoming sessions
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def fix_session_statuses():
    print("🔧 Fixing session statuses...")
    
    now = datetime.now(timezone.utc)
    
    # Update all upcoming sessions to 'scheduled' status
    result = await db.sessions.update_many(
        {
            "status": "upcoming",
            "datetime": {"$gte": now.isoformat()}
        },
        {
            "$set": {"status": "scheduled"}
        }
    )
    
    print(f"✅ Updated {result.modified_count} sessions from 'upcoming' to 'scheduled'")
    
    # Count sessions by status
    total_sessions = await db.sessions.count_documents({})
    scheduled_sessions = await db.sessions.count_documents({"status": "scheduled"})
    upcoming_by_date = await db.sessions.count_documents({
        "datetime": {"$gte": now.isoformat()}
    })
    
    print(f"\n📊 Session Status Summary:")
    print(f"   Total sessions: {total_sessions}")
    print(f"   Scheduled status: {scheduled_sessions}")
    print(f"   Upcoming by date: {upcoming_by_date}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_session_statuses())
