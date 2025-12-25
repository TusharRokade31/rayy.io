"""
Migration Script: Add timing_type to existing PlanOptions
This adds timing_type and reschedule_limit_minutes to all existing plan_options in listings
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/rayy_db')

async def migrate_timing_type():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.get_default_database()
    
    print("🔄 Starting migration: Add timing_type to PlanOptions...")
    
    # Find all listings with plan_options
    listings = await db.listings.find({"plan_options": {"$exists": True, "$ne": []}}).to_list(None)
    
    print(f"📊 Found {len(listings)} listings with plan_options")
    
    updated_count = 0
    
    for listing in listings:
        if "plan_options" in listing and listing["plan_options"]:
            updated_plan_options = []
            
            for plan in listing["plan_options"]:
                # Add timing_type if not present
                if "timing_type" not in plan:
                    # Default logic:
                    # Trial & Single → FLEXIBLE (user picks any slot)
                    # Weekly & Monthly → Check if they have batches, if yes FIXED, else FLEXIBLE
                    plan_type = plan.get("plan_type", "").lower()
                    
                    if plan_type in ["trial", "single"]:
                        plan["timing_type"] = "FLEXIBLE"
                    else:
                        # Check if listing has batches
                        has_batches = bool(listing.get("batches", []))
                        plan["timing_type"] = "FIXED" if has_batches else "FLEXIBLE"
                
                # Add reschedule_limit_minutes if not present
                if "reschedule_limit_minutes" not in plan:
                    plan["reschedule_limit_minutes"] = 30  # Default 30 minutes
                
                updated_plan_options.append(plan)
            
            # Update the listing
            result = await db.listings.update_one(
                {"_id": listing["_id"]},
                {"$set": {"plan_options": updated_plan_options}}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"✅ Updated listing: {listing.get('title', 'Unknown')} ({listing.get('id', 'N/A')})")
    
    print(f"\n✅ Migration complete! Updated {updated_count} listings")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_timing_type())
