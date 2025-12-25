"""
Add comprehensive trial listings with available sessions for this week
Ensures variety in categories, locations, and times
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

# Trial listing data with diverse categories
TRIAL_LISTINGS = [
    {
        "title": "Hip-Hop Dance for Beginners",
        "subtitle": "Learn cool moves and build confidence",
        "category": "dance",
        "age_min": 8,
        "age_max": 14,
        "base_price_inr": 499,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Fun hip-hop dance class for kids! Learn popular dance moves, improve coordination, and perform with confidence.",
        "duration_minutes": 60
    },
    {
        "title": "Creative Art & Painting",
        "subtitle": "Express yourself through colors",
        "category": "art",
        "age_min": 5,
        "age_max": 12,
        "base_price_inr": 599,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Explore different art techniques, from watercolors to acrylics. Develop creativity and fine motor skills.",
        "duration_minutes": 90
    },
    {
        "title": "Scratch Coding for Kids",
        "subtitle": "Create your first game or animation",
        "category": "coding",
        "age_min": 7,
        "age_max": 12,
        "base_price_inr": 699,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Introduction to coding using Scratch. Kids will create their own games and animations!",
        "duration_minutes": 60,
        "is_online": True
    },
    {
        "title": "Kids Yoga & Mindfulness",
        "subtitle": "Balance body and mind",
        "category": "fitness",
        "age_min": 6,
        "age_max": 12,
        "base_price_inr": 449,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Fun yoga poses, breathing exercises, and mindfulness activities for kids.",
        "duration_minutes": 45
    },
    {
        "title": "Junior Chess Academy",
        "subtitle": "Strategic thinking for young minds",
        "category": "chess",
        "age_min": 6,
        "age_max": 14,
        "base_price_inr": 599,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Learn chess from basics to intermediate level. Improve strategic thinking and concentration.",
        "duration_minutes": 60
    },
    {
        "title": "Keyboard & Piano Basics",
        "subtitle": "Start your musical journey",
        "category": "music",
        "age_min": 5,
        "age_max": 15,
        "base_price_inr": 799,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Learn to play your favorite songs on keyboard. Understanding notes, chords, and melodies.",
        "duration_minutes": 45
    },
    {
        "title": "Swimming for Beginners",
        "subtitle": "Water safety and swim techniques",
        "category": "swimming",
        "age_min": 5,
        "age_max": 12,
        "base_price_inr": 899,
        "trial_price_inr": 199,
        "city": "Gurgaon",
        "description": "Professional swimming instruction focusing on water safety, breathing techniques, and basic strokes.",
        "duration_minutes": 45
    },
    {
        "title": "Drama & Theatre Workshop",
        "subtitle": "Build confidence through acting",
        "category": "drama",
        "age_min": 7,
        "age_max": 14,
        "base_price_inr": 549,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Explore acting, improvisation, and storytelling. Great for building confidence and public speaking.",
        "duration_minutes": 75
    },
    {
        "title": "Robotics & STEM Lab",
        "subtitle": "Build and program robots",
        "category": "robotics",
        "age_min": 8,
        "age_max": 14,
        "base_price_inr": 999,
        "trial_price_inr": 199,
        "city": "Gurgaon",
        "description": "Hands-on robotics and STEM education. Build robots, learn programming, and explore engineering.",
        "duration_minutes": 90
    },
    {
        "title": "Karate for Kids",
        "subtitle": "Discipline, respect, and self-defense",
        "category": "martial_arts",
        "age_min": 6,
        "age_max": 14,
        "base_price_inr": 649,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Traditional karate training focusing on discipline, self-defense, and physical fitness.",
        "duration_minutes": 60
    },
    {
        "title": "Toddler Playgroup",
        "subtitle": "Social & motor skills development",
        "category": "toddler_play",
        "age_min": 1,
        "age_max": 3,
        "base_price_inr": 399,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Sensory play, music, art activities designed for toddlers. Parent participation encouraged.",
        "duration_minutes": 60
    },
    {
        "title": "Basketball Training",
        "subtitle": "Dribble, shoot, score!",
        "category": "sports",
        "age_min": 8,
        "age_max": 15,
        "base_price_inr": 599,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Professional basketball coaching focusing on fundamentals, teamwork, and game strategies.",
        "duration_minutes": 75
    },
    {
        "title": "Guitar Classes for Kids",
        "subtitle": "Strum your favorite songs",
        "category": "music",
        "age_min": 7,
        "age_max": 15,
        "base_price_inr": 749,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Learn acoustic guitar from scratch. Chords, strumming patterns, and play-along songs.",
        "duration_minutes": 45
    },
    {
        "title": "Pottery & Clay Modeling",
        "subtitle": "Create with your hands",
        "category": "art",
        "age_min": 6,
        "age_max": 14,
        "base_price_inr": 649,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Learn pottery wheel techniques, hand-building, and clay modeling. Create functional art!",
        "duration_minutes": 90
    },
    {
        "title": "Public Speaking & Debate",
        "subtitle": "Find your voice",
        "category": "drama",
        "age_min": 9,
        "age_max": 16,
        "base_price_inr": 699,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Develop confidence in public speaking, debating, and presentation skills.",
        "duration_minutes": 60
    }
]

async def create_or_get_partner():
    """Create or get trial listings partner"""
    partner_email = "trials@rrray.com"
    
    # Check if partner exists
    user = await db.users.find_one({"email": partner_email})
    if user:
        partner = await db.partners.find_one({"user_id": user["id"]})
        if partner:
            print(f"✅ Using existing partner: {partner['id']}")
            return partner["id"], user["id"]
    
    # Create new partner
    user_id = str(uuid.uuid4())
    partner_id = str(uuid.uuid4())
    
    user_doc = {
        "id": user_id,
        "email": partner_email,
        "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtRwAcS7AcYe",  # "trials123"
        "name": "Trial Classes Partner",
        "role": "partner_owner",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    partner_doc = {
        "id": partner_id,
        "user_id": user_id,
        "brand_name": "rayy Trial Classes",
        "legal_name": "Trial Classes Provider",
        "status": "approved",
        "kyc_status": "verified",
        "verification_status": "verified",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    await db.partners.insert_one(partner_doc)
    
    print(f"✅ Created new partner: {partner_id}")
    return partner_id, user_id

async def create_venue(partner_id, city):
    """Create or get venue for partner"""
    venue = await db.venues.find_one({"partner_id": partner_id, "city": city})
    if venue:
        return venue["id"]
    
    venue_id = str(uuid.uuid4())
    venue_doc = {
        "id": venue_id,
        "partner_id": partner_id,
        "name": f"rayy Trial Center - {city}",
        "address": f"Sector 57, {city}",
        "city": city,
        "state": "Haryana",
        "pincode": "122001",
        "latitude": 28.4211 + random.uniform(-0.05, 0.05),
        "longitude": 77.0856 + random.uniform(-0.05, 0.05),
        "facilities": ["Air Conditioned", "Parking", "Washrooms", "Waiting Area"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.venues.insert_one(venue_doc)
    print(f"  ✅ Created venue: {venue_id}")
    return venue_id

async def create_listing_with_sessions(partner_id, listing_data):
    """Create a listing with trial available and sessions"""
    
    listing_id = str(uuid.uuid4())
    
    # Get or create venue (skip for online classes)
    venue_id = None
    if not listing_data.get("is_online", False):
        venue_id = await create_venue(partner_id, listing_data["city"])
    
    # Create listing
    listing_doc = {
        "id": listing_id,
        "partner_id": partner_id,
        "venue_id": venue_id,
        "title": listing_data["title"],
        "subtitle": listing_data.get("subtitle", ""),
        "description": listing_data["description"],
        "category": listing_data["category"],
        "age_min": listing_data["age_min"],
        "age_max": listing_data["age_max"],
        "base_price_inr": listing_data["base_price_inr"],
        "trial_price_inr": listing_data["trial_price_inr"],
        "trial_available": True,
        "duration_minutes": listing_data["duration_minutes"],
        "city": listing_data["city"],
        "is_online": listing_data.get("is_online", False),
        "status": "active",
        "rating": round(random.uniform(4.2, 4.9), 1),
        "total_reviews": random.randint(15, 85),
        "total_bookings": random.randint(50, 200),
        "featured": random.choice([True, False]),
        "verified": True,
        "images": [
            f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1700000000000)}",
            f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1700000000000)}"
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.listings.insert_one(listing_doc)
    print(f"  ✅ Created listing: {listing_data['title']} ({listing_id})")
    
    # Create sessions for next 7 days
    sessions_created = 0
    
    for day_offset in range(7):
        session_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
        
        # Morning, Afternoon, Evening slots
        time_slots = [
            {"hour": 9, "minute": 0},
            {"hour": 11, "minute": 30},
            {"hour": 15, "minute": 0},
            {"hour": 17, "minute": 30}
        ]
        
        # Create 2-3 sessions per day
        num_slots = random.randint(2, 3)
        for time_slot in random.sample(time_slots, num_slots):
            session_datetime = session_date.replace(
                hour=time_slot["hour"],
                minute=time_slot["minute"],
                second=0,
                microsecond=0
            )
            
            # Trial session
            trial_session = {
                "id": str(uuid.uuid4()),
                "listing_id": listing_id,
                "venue_id": venue_id,
                "date": session_datetime.date().isoformat(),
                "time": session_datetime.time().isoformat(),
                "datetime": session_datetime.isoformat(),
                "plan_type": "trial",
                "plan_name": "Trial Session",
                "price_inr": listing_data["trial_price_inr"],
                "capacity": random.randint(10, 20),
                "booked": random.randint(0, 5),
                "duration_minutes": listing_data["duration_minutes"],
                "status": "upcoming",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.sessions.insert_one(trial_session)
            sessions_created += 1
            
            # Single session (regular price)
            single_session = {
                "id": str(uuid.uuid4()),
                "listing_id": listing_id,
                "venue_id": venue_id,
                "date": session_datetime.date().isoformat(),
                "time": session_datetime.time().isoformat(),
                "datetime": session_datetime.isoformat(),
                "plan_type": "single",
                "plan_name": "Single Session",
                "price_inr": listing_data["base_price_inr"],
                "capacity": random.randint(10, 20),
                "booked": random.randint(0, 8),
                "duration_minutes": listing_data["duration_minutes"],
                "status": "upcoming",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.sessions.insert_one(single_session)
            sessions_created += 1
    
    print(f"    ✅ Created {sessions_created} sessions")
    return listing_id

async def ensure_all_listings_have_sessions():
    """Ensure existing listings have sessions too"""
    print("\n📋 Checking existing listings for sessions...")
    
    all_listings = await db.listings.find({"status": "active"}).to_list(200)
    print(f"Found {len(all_listings)} active listings")
    
    for listing in all_listings:
        # Check if listing has sessions in next 7 days
        today = datetime.now(timezone.utc).date()
        future_date = (datetime.now(timezone.utc) + timedelta(days=7)).date()
        
        sessions = await db.sessions.find({
            "listing_id": listing["id"],
            "date": {"$gte": today.isoformat(), "$lte": future_date.isoformat()}
        }).to_list(100)
        
        if len(sessions) < 10:  # If less than 10 sessions
            print(f"  📝 Adding sessions for: {listing.get('title', listing['id'])}")
            
            # Get venue
            venue_id = listing.get("venue_id")
            
            sessions_added = 0
            for day_offset in range(7):
                session_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
                
                time_slots = [
                    {"hour": 10, "minute": 0},
                    {"hour": 15, "minute": 0},
                    {"hour": 18, "minute": 0}
                ]
                
                for time_slot in random.sample(time_slots, 2):
                    session_datetime = session_date.replace(
                        hour=time_slot["hour"],
                        minute=time_slot["minute"],
                        second=0,
                        microsecond=0
                    )
                    
                    # Create trial session if trial is available
                    if listing.get("trial_available") and listing.get("trial_price_inr"):
                        trial_session = {
                            "id": str(uuid.uuid4()),
                            "listing_id": listing["id"],
                            "venue_id": venue_id,
                            "date": session_datetime.date().isoformat(),
                            "time": session_datetime.time().isoformat(),
                            "datetime": session_datetime.isoformat(),
                            "plan_type": "trial",
                            "plan_name": "Trial Session",
                            "price_inr": listing["trial_price_inr"],
                            "capacity": random.randint(10, 20),
                            "booked": random.randint(0, 3),
                            "duration_minutes": listing.get("duration_minutes", 60),
                            "status": "upcoming",
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        await db.sessions.insert_one(trial_session)
                        sessions_added += 1
                    
                    # Create regular session
                    regular_session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing["id"],
                        "venue_id": venue_id,
                        "date": session_datetime.date().isoformat(),
                        "time": session_datetime.time().isoformat(),
                        "datetime": session_datetime.isoformat(),
                        "plan_type": "single",
                        "plan_name": "Single Session",
                        "price_inr": listing.get("base_price_inr", 500),
                        "capacity": random.randint(10, 20),
                        "booked": random.randint(0, 5),
                        "duration_minutes": listing.get("duration_minutes", 60),
                        "status": "upcoming",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.sessions.insert_one(regular_session)
                    sessions_added += 1
            
            if sessions_added > 0:
                print(f"    ✅ Added {sessions_added} sessions")

async def main():
    print("🚀 Adding Trial Listings with Sessions for This Week\n")
    
    # Create or get partner
    partner_id, user_id = await create_or_get_partner()
    
    # Create trial listings with sessions
    print(f"\n📝 Creating {len(TRIAL_LISTINGS)} trial listings...\n")
    created_count = 0
    
    for listing_data in TRIAL_LISTINGS:
        try:
            await create_listing_with_sessions(partner_id, listing_data)
            created_count += 1
        except Exception as e:
            print(f"  ❌ Error creating {listing_data['title']}: {str(e)}")
    
    print(f"\n✅ Successfully created {created_count} trial listings")
    
    # Ensure all existing listings have sessions
    await ensure_all_listings_have_sessions()
    
    # Summary
    total_listings = await db.listings.count_documents({"status": "active"})
    total_sessions = await db.sessions.count_documents({
        "date": {"$gte": datetime.now(timezone.utc).date().isoformat()}
    })
    trial_sessions = await db.sessions.count_documents({
        "plan_type": "trial",
        "date": {"$gte": datetime.now(timezone.utc).date().isoformat()}
    })
    
    print(f"\n" + "="*60)
    print("📊 DATABASE SUMMARY")
    print("="*60)
    print(f"Total Active Listings: {total_listings}")
    print(f"Total Upcoming Sessions: {total_sessions}")
    print(f"Trial Sessions Available: {trial_sessions}")
    print("="*60)
    print("\n✨ All trial listings have been created with bookable sessions!")
    print("🎯 All existing listings now have sessions available!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
