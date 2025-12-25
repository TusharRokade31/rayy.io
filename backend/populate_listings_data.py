"""
Script to populate missing images and sessions for all listings
Run with: python populate_listings_data.py
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

# Category-specific image URLs (high quality, relevant stock images)
CATEGORY_IMAGES = {
    "dance": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800",
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800",
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800"
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
        "https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800",
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"
    ],
    "coding": [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800"
    ],
    "music": [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800",
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800"
    ],
    "language": [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
        "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800",
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800"
    ],
    "stem": [
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800"
    ],
    "default": [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800"
    ]
}

async def get_category_slug(category_id):
    """Get category slug from category_id"""
    category = await db.categories.find_one({"id": category_id})
    if category and 'slug' in category:
        return category['slug']
    return 'default'

async def populate_images_for_listing(listing):
    """Add images to a listing if missing"""
    listing_id = listing['id']
    
    # Check if listing already has images
    if listing.get('media') and len(listing['media']) > 0:
        print(f"✓ Listing '{listing['title']}' already has {len(listing['media'])} images")
        return False
    
    # Get category slug
    category_slug = await get_category_slug(listing['category_id'])
    
    # Get appropriate images for this category
    if category_slug in CATEGORY_IMAGES:
        available_images = CATEGORY_IMAGES[category_slug]
    else:
        available_images = CATEGORY_IMAGES['default']
    
    # Select 2-3 random images
    num_images = random.randint(2, 3)
    selected_images = random.sample(available_images, min(num_images, len(available_images)))
    
    # Update listing with images
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"media": selected_images}}
    )
    
    print(f"✓ Added {len(selected_images)} images to '{listing['title']}'")
    return True

async def create_sessions_for_listing(listing):
    """Create upcoming sessions for a listing if missing"""
    listing_id = listing['id']
    
    # Check if listing already has sessions
    existing_sessions = await db.sessions.count_documents({"listing_id": listing_id})
    if existing_sessions > 0:
        print(f"✓ Listing '{listing['title']}' already has {existing_sessions} sessions")
        return False
    
    # Create sessions for the next 14 days
    sessions_created = 0
    now = datetime.now(timezone.utc)
    
    # Determine session frequency based on listing type
    if listing.get('is_online', False):
        # Online classes: 5-6 sessions per week
        days_with_sessions = [0, 1, 2, 4, 5]  # Mon, Tue, Wed, Fri, Sat
        times = ["10:00", "16:00", "18:00"]
    else:
        # Offline classes: 3-4 sessions per week
        days_with_sessions = [1, 3, 5, 6]  # Tue, Thu, Sat, Sun
        times = ["09:00", "11:00", "15:00", "17:00"]
    
    # Create sessions for next 14 days
    for day_offset in range(14):
        target_date = now + timedelta(days=day_offset + 1)  # Start from tomorrow
        weekday = target_date.weekday()
        
        # Skip if this day shouldn't have sessions
        if weekday not in days_with_sessions:
            continue
        
        # Select 1-2 random time slots for this day
        num_slots = random.randint(1, 2)
        selected_times = random.sample(times, num_slots)
        
        for time_str in selected_times:
            hour, minute = map(int, time_str.split(':'))
            start_at = target_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Skip if session is in the past
            if start_at < now:
                continue
            
            end_at = start_at + timedelta(minutes=listing['duration_minutes'])
            
            # Create session
            session = {
                "id": str(uuid.uuid4()),
                "listing_id": listing_id,
                "start_at": start_at,
                "end_at": end_at,
                "seats_total": random.randint(8, 20),
                "seats_reserved": 0,
                "allow_late_booking_minutes": 60,
                "price_override_inr": None,
                "staff_assigned": None,
                "status": "scheduled"
            }
            
            await db.sessions.insert_one(session)
            sessions_created += 1
    
    print(f"✓ Created {sessions_created} sessions for '{listing['title']}'")
    return True

async def main():
    print("=" * 60)
    print("POPULATING MISSING IMAGES AND SESSIONS FOR LISTINGS")
    print("=" * 60)
    
    # Get all active listings
    listings = await db.listings.find({"status": "active"}).to_list(None)
    total_listings = len(listings)
    
    print(f"\nFound {total_listings} active listings\n")
    
    images_added = 0
    sessions_created = 0
    
    for idx, listing in enumerate(listings, 1):
        print(f"\n[{idx}/{total_listings}] Processing: {listing['title']}")
        print("-" * 60)
        
        # Add images
        if await populate_images_for_listing(listing):
            images_added += 1
        
        # Create sessions
        if await create_sessions_for_listing(listing):
            sessions_created += 1
        
        # Small delay to avoid overwhelming the database
        await asyncio.sleep(0.1)
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total listings processed: {total_listings}")
    print(f"Listings with images added: {images_added}")
    print(f"Listings with sessions created: {sessions_created}")
    print(f"\n✅ Done! All listings now have images and sessions.")

if __name__ == "__main__":
    asyncio.run(main())
