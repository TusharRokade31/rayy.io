#!/usr/bin/env python3
"""
Migration script to convert existing listings to flexible booking system
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, date, timedelta
from dotenv import load_dotenv
from pathlib import Path
import uuid

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def migrate_listings():
    """Migrate all existing listings to flexible booking format"""
    
    print("🚀 Starting flexible booking migration...")
    print("=" * 60)
    
    # Get all listings
    listings = await db.listings.find({}, {"_id": 0}).to_list(None)
    print(f"📋 Found {len(listings)} listings to migrate")
    
    migrated_count = 0
    skipped_count = 0
    
    for listing in listings:
        listing_id = listing["id"]
        
        # Skip if already migrated
        if listing.get("plan_options") or listing.get("batches"):
            print(f"⏭️  Skipping {listing['title']} (already has flexible booking)")
            skipped_count += 1
            continue
        
        print(f"\n📝 Migrating: {listing['title']}")
        
        # Extract pricing info
        base_price = listing.get("base_price_inr", 1000)
        trial_available = listing.get("trial_available", False)
        trial_price = listing.get("trial_price_inr")
        duration_minutes = listing.get("duration_minutes", 60)
        
        # Create default plan options
        plan_options = []
        
        # Trial plan
        if trial_available and trial_price:
            plan_options.append({
                "id": str(uuid.uuid4()),
                "plan_type": "trial",
                "name": "Trial Class",
                "description": "Try before you commit",
                "sessions_count": 1,
                "price_inr": trial_price,
                "discount_percent": 0,
                "validity_days": 30,
                "is_active": True
            })
            print(f"   ✅ Added Trial plan (₹{trial_price})")
        
        # Single session
        plan_options.append({
            "id": str(uuid.uuid4()),
            "plan_type": "single",
            "name": "Single Session",
            "description": "Pay as you go",
            "sessions_count": 1,
            "price_inr": base_price,
            "discount_percent": 0,
            "validity_days": 30,
            "is_active": True
        })
        print(f"   ✅ Added Single plan (₹{base_price})")
        
        # Weekly plan (4 sessions, 10% off)
        weekly_price = int(base_price * 4 * 0.9)
        plan_options.append({
            "id": str(uuid.uuid4()),
            "plan_type": "weekly",
            "name": "Weekly Plan",
            "description": "4 sessions per month",
            "sessions_count": 4,
            "price_inr": weekly_price,
            "discount_percent": 10,
            "validity_days": 60,
            "is_active": True
        })
        print(f"   ✅ Added Weekly plan (₹{weekly_price})")
        
        # Monthly plan (12 sessions, 25% off)
        monthly_price = int(base_price * 12 * 0.75)
        plan_options.append({
            "id": str(uuid.uuid4()),
            "plan_type": "monthly",
            "name": "Monthly Plan",
            "description": "12 sessions over 3 months",
            "sessions_count": 12,
            "price_inr": monthly_price,
            "discount_percent": 25,
            "validity_days": 90,
            "is_active": True
        })
        print(f"   ✅ Added Monthly plan (₹{monthly_price})")
        
        # Create default batch from existing sessions
        # Get a sample session to determine timing
        sample_session = await db.sessions.find_one(
            {"listing_id": listing_id, "status": "scheduled"},
            {"_id": 0}
        )
        
        batches = []
        
        if sample_session:
            # Extract timing info
            if "time" in sample_session:
                batch_time = sample_session["time"]
            elif "start_at" in sample_session:
                start_at = sample_session["start_at"]
                batch_time = f"{start_at.hour:02d}:{start_at.minute:02d}"
            else:
                batch_time = "17:00"  # Default
            
            # Create default batch
            default_batch = {
                "id": str(uuid.uuid4()),
                "name": "Default Batch",
                "days_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                "time": batch_time,
                "duration_minutes": duration_minutes,
                "capacity": 10,  # Default capacity
                "enrolled_count": 0,
                "plan_types": ["trial", "single", "weekly", "monthly"],
                "start_date": date.today().isoformat(),
                "end_date": None,
                "is_active": True
            }
            batches.append(default_batch)
            print(f"   ✅ Added Default Batch (time: {batch_time})")
            
            # Update existing sessions to link to this batch
            batch_id = default_batch["id"]
            result = await db.sessions.update_many(
                {"listing_id": listing_id},
                {"$set": {"batch_id": batch_id, "is_rescheduled": False}}
            )
            print(f"   ✅ Updated {result.modified_count} sessions with batch_id")
        
        # Update listing
        update_data = {
            "plan_options": plan_options,
            "batches": batches,
            "holidays": [],
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.listings.update_one(
            {"id": listing_id},
            {"$set": update_data}
        )
        
        migrated_count += 1
        print(f"   ✅ Migration complete for {listing['title']}")
    
    print("\n" + "=" * 60)
    print(f"✅ Migration complete!")
    print(f"   Migrated: {migrated_count} listings")
    print(f"   Skipped: {skipped_count} listings")
    print(f"   Total: {len(listings)} listings")
    print("=" * 60)


async def verify_migration():
    """Verify the migration was successful"""
    
    print("\n🔍 Verifying migration...")
    print("=" * 60)
    
    # Count listings with flexible booking
    listings_with_plans = await db.listings.count_documents({
        "plan_options": {"$exists": True, "$ne": []}
    })
    
    listings_with_batches = await db.listings.count_documents({
        "batches": {"$exists": True, "$ne": []}
    })
    
    total_listings = await db.listings.count_documents({})
    
    sessions_with_batch_id = await db.sessions.count_documents({
        "batch_id": {"$exists": True, "$ne": None}
    })
    
    total_sessions = await db.sessions.count_documents({})
    
    print(f"📊 Migration Results:")
    print(f"   Listings with plan_options: {listings_with_plans}/{total_listings}")
    print(f"   Listings with batches: {listings_with_batches}/{total_listings}")
    print(f"   Sessions with batch_id: {sessions_with_batch_id}/{total_sessions}")
    
    if listings_with_plans == total_listings and listings_with_batches == total_listings:
        print("✅ All listings migrated successfully!")
    else:
        print("⚠️  Some listings may not have been migrated")
    
    print("=" * 60)


async def main():
    """Main migration function"""
    try:
        await migrate_listings()
        await verify_migration()
        print("\n🎉 Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
