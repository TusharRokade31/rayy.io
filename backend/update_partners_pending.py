#!/usr/bin/env python3
"""
Update existing partners to pending status so admin can approve them
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

async def update_partners_to_pending():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'yuno')
    db = client[db_name]
    
    print("Updating existing partners to 'pending' status...")
    
    # Find all partners with status 'draft' or 'active' (not already approved/pending/rejected)
    partners = await db.partners.find({
        "status": {"$in": ["draft", "active"]}
    }, {"_id": 0}).to_list(None)
    
    print(f"Found {len(partners)} partners to update")
    
    # Update to pending status
    result = await db.partners.update_many(
        {"status": {"$in": ["draft", "active"]}},
        {
            "$set": {
                "status": "pending",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    print(f"✅ Updated {result.modified_count} partners to 'pending' status")
    
    # Show current status distribution
    all_partners = await db.partners.find({}, {"_id": 0, "brand_name": 1, "status": 1}).to_list(None)
    status_counts = {}
    for p in all_partners:
        status = p.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print(f"\nCurrent partner status distribution:")
    for status, count in status_counts.items():
        print(f"  {status}: {count}")
    
    client.close()
    print("\n✅ Done! Partners are now ready for admin approval.")

if __name__ == "__main__":
    asyncio.run(update_partners_to_pending())
