"""
Direct Production Database Seeding Script
Run this on production server with production MongoDB URL
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
from datetime import datetime, timezone, timedelta
import uuid
from passlib.context import CryptContext
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get MongoDB URL from environment or command line
PROD_MONGO_URL = os.environ.get('PROD_MONGO_URL') or os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'yuno_db')

if len(sys.argv) > 1:
    PROD_MONGO_URL = sys.argv[1]

print(f"🌱 SEEDING DATABASE")
print(f"   MongoDB URL: {PROD_MONGO_URL[:30]}...")
print(f"   Database: {DB_NAME}")
print()

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
        "description": "Introduction to coding using Scratch. Create games, animations, and interactive stories while learning programming concepts.",
        "duration_minutes": 75
    },
    {
        "title": "Karate for Kids",
        "subtitle": "Discipline, respect, and self-defense",
        "category": "sports",
        "age_min": 6,
        "age_max": 14,
        "base_price_inr": 549,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Traditional karate training focusing on discipline, respect, and physical fitness. Learn self-defense techniques.",
        "duration_minutes": 60
    },
    {
        "title": "Guitar Basics",
        "subtitle": "Play your favorite songs",
        "category": "music",
        "age_min": 8,
        "age_max": 16,
        "base_price_inr": 799,
        "trial_price_inr": 149,
        "city": "Gurgaon",
        "description": "Learn guitar fundamentals - chords, strumming patterns, and your favorite songs. Perfect for beginners.",
        "duration_minutes": 45
    },
    {
        "title": "Science Lab Adventures",
        "subtitle": "Hands-on experiments and discovery",
        "category": "science",
        "age_min": 7,
        "age_max": 12,
        "base_price_inr": 649,
        "trial_price_inr": 129,
        "city": "Gurgaon",
        "description": "Exciting science experiments! Make slime, create volcanoes, learn about chemistry and physics through fun activities.",
        "duration_minutes": 90
    },
    {
        "title": "Chess Champions",
        "subtitle": "Strategic thinking and problem-solving",
        "category": "board_games",
        "age_min": 6,
        "age_max": 14,
        "base_price_inr": 499,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Learn chess from basics to advanced strategies. Improve critical thinking, patience, and concentration.",
        "duration_minutes": 60
    },
    {
        "title": "Public Speaking & Drama",
        "subtitle": "Build confidence on stage",
        "category": "drama",
        "age_min": 8,
        "age_max": 15,
        "base_price_inr": 599,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Develop public speaking skills through drama and theater. Overcome stage fright and express yourself confidently.",
        "duration_minutes": 75
    },
    {
        "title": "Basketball Skills",
        "subtitle": "Dribbling, shooting, and teamwork",
        "category": "sports",
        "age_min": 8,
        "age_max": 15,
        "base_price_inr": 549,
        "trial_price_inr": 99,
        "city": "Gurgaon",
        "description": "Learn basketball fundamentals - dribbling, shooting, passing. Improve fitness and teamwork skills.",
        "duration_minutes": 90
    },
    {
        "title": "Yoga for Kids",
        "subtitle": "Flexibility, balance, and mindfulness",
        "category": "fitness",
        "age_min": 5,
        "age_max": 12,
        "base_price_inr": 449,
        "trial_price_inr": 79,
        "city": "Gurgaon",
        "description": "Kid-friendly yoga focusing on flexibility, balance, breathing techniques, and relaxation.",
        "duration_minutes": 45
    },
    {
        "title": "Robotics for Beginners",
        "subtitle": "Build and program your first robot",
        "category": "stem",
        "age_min": 9,
        "age_max": 14,
        "base_price_inr": 899,
        "trial_price_inr": 199,
        "city": "Gurgaon",
        "description": "Introduction to robotics using LEGO or Arduino kits. Build simple robots and learn basic programming.",
        "duration_minutes": 90
    },
    {
        "title": "Toddler Sensory Play",
        "subtitle": "Explore textures, colors, and sounds",
        "category": "toddler_play",
        "age_min": 2,
        "age_max": 4,
        "base_price_inr": 399,
        "trial_price_inr": 79,
        "city": "Gurgaon",
        "description": "Supervised sensory play activities for toddlers. Safe exploration of textures, colors, water play, and more.",
        "duration_minutes": 60
    }
]

# More trial listings (expanding to 40+ total)
MORE_LISTINGS = [
    {"title": "Swimming for Beginners", "subtitle": "Water confidence and basic strokes", "category": "sports", "age_min": 5, "age_max": 12, "base_price_inr": 699, "trial_price_inr": 149, "city": "Gurgaon", "description": "Learn swimming basics in a safe environment. Build water confidence and learn basic strokes.", "duration_minutes": 45},
    {"title": "Piano Lessons", "subtitle": "Read music and play melodies", "category": "music", "age_min": 6, "age_max": 14, "base_price_inr": 799, "trial_price_inr": 149, "city": "Gurgaon", "description": "Learn piano fundamentals - reading music, finger exercises, and playing simple melodies.", "duration_minutes": 45},
    {"title": "Football Skills Training", "subtitle": "Dribbling, passing, and scoring", "category": "sports", "age_min": 6, "age_max": 14, "base_price_inr": 549, "trial_price_inr": 99, "city": "Gurgaon", "description": "Develop football skills - dribbling, passing, shooting. Learn teamwork and sportsmanship.", "duration_minutes": 75},
    {"title": "Pottery & Clay Modeling", "subtitle": "Create your own ceramic art", "category": "art", "age_min": 7, "age_max": 14, "base_price_inr": 649, "trial_price_inr": 129, "city": "Gurgaon", "description": "Hands-on pottery and clay modeling. Create bowls, pots, and sculptures while learning about ceramics.", "duration_minutes": 90},
    {"title": "Taekwondo Training", "subtitle": "Korean martial art for discipline", "category": "sports", "age_min": 6, "age_max": 14, "base_price_inr": 549, "trial_price_inr": 99, "city": "Gurgaon", "description": "Learn Taekwondo kicks, blocks, and patterns. Build discipline, confidence, and physical fitness.", "duration_minutes": 60},
    {"title": "Cooking for Kids", "subtitle": "Simple recipes and kitchen safety", "category": "life_skills", "age_min": 7, "age_max": 13, "base_price_inr": 599, "trial_price_inr": 129, "city": "Gurgaon", "description": "Learn simple recipes, kitchen safety, and basic cooking techniques. Make pizzas, cookies, and more!", "duration_minutes": 90},
    {"title": "Origami Art", "subtitle": "Japanese paper folding craft", "category": "art", "age_min": 6, "age_max": 12, "base_price_inr": 399, "trial_price_inr": 79, "city": "Gurgaon", "description": "Learn the art of origami. Create animals, flowers, and objects using traditional paper folding techniques.", "duration_minutes": 60},
    {"title": "Cricket Coaching", "subtitle": "Batting, bowling, and fielding", "category": "sports", "age_min": 7, "age_max": 15, "base_price_inr": 549, "trial_price_inr": 99, "city": "Gurgaon", "description": "Professional cricket coaching. Learn batting techniques, bowling actions, and fielding skills.", "duration_minutes": 90},
    {"title": "Classical Dance", "subtitle": "Bharatanatyam or Kathak", "category": "dance", "age_min": 6, "age_max": 14, "base_price_inr": 649, "trial_price_inr": 129, "city": "Gurgaon", "description": "Learn classical Indian dance forms. Develop grace, rhythm, and cultural appreciation.", "duration_minutes": 75},
    {"title": "Magic & Illusion", "subtitle": "Learn amazing magic tricks", "category": "performing_arts", "age_min": 8, "age_max": 15, "base_price_inr": 499, "trial_price_inr": 99, "city": "Gurgaon", "description": "Learn card tricks, coin magic, and illusions. Develop showmanship and presentation skills.", "duration_minutes": 60},
]

TRIAL_LISTINGS.extend(MORE_LISTINGS)

async def seed_database():
    """Main seeding function"""
    try:
        client = AsyncIOMotorClient(PROD_MONGO_URL)
        db = client[DB_NAME]
        
        # Test connection
        await db.command('ping')
        print("✅ MongoDB connection successful")
        print()
        
        # Clear existing trial-related data
        print("🗑️  Clearing existing data...")
        await db.listings.delete_many({"trial_available": True})
        await db.sessions.delete_many({})
        print("   Cleared trial listings and sessions")
        print()
        
        # Create partner accounts
        print("👥 Creating partner accounts...")
        partner_ids = []
        for i in range(5):
            partner_id = str(uuid.uuid4())
            partner_user_id = str(uuid.uuid4())
            
            # Create partner user
            await db.users.update_one(
                {"email": f"partner{i+1}@rrray.com"},
                {"$set": {
                    "id": partner_user_id,
                    "name": f"Partner {i+1}",
                    "email": f"partner{i+1}@rrray.com",
                    "password": pwd_context.hash("Partner@2025"),
                    "phone": f"+9198765{i:05d}",
                    "role": "partner_owner",
                    "created_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
            
            # Create partner profile
            await db.partners.update_one(
                {"id": partner_id},
                {"$set": {
                    "id": partner_id,
                    "owner_user_id": partner_user_id,
                    "business_name": f"Kids Academy {i+1}",
                    "status": "approved",
                    "created_at": datetime.now(timezone.utc)
                }},
                upsert=True
            )
            
            partner_ids.append(partner_id)
        
        print(f"   Created {len(partner_ids)} partner accounts")
        print()
        
        # Create listings with sessions
        print("📝 Creating trial listings...")
        listings_created = 0
        sessions_created = 0
        
        for listing_data in TRIAL_LISTINGS:
            listing_id = str(uuid.uuid4())
            partner_id = random.choice(partner_ids)
            
            # Create listing
            listing = {
                "id": listing_id,
                "partner_id": partner_id,
                "title": listing_data["title"],
                "subtitle": listing_data["subtitle"],
                "description": listing_data["description"],
                "category": listing_data["category"],
                "listing_type": "class",
                "age_min": listing_data["age_min"],
                "age_max": listing_data["age_max"],
                "duration_minutes": listing_data["duration_minutes"],
                "base_price_inr": listing_data["base_price_inr"],
                "trial_available": True,
                "trial_price_inr": listing_data["trial_price_inr"],
                "location_type": "in_person",
                "city": listing_data["city"],
                "status": "active",
                "rating": round(4.2 + random.random() * 0.7, 1),
                "total_reviews": random.randint(10, 150),
                "total_bookings": random.randint(50, 300),
                "images": [],
                "created_at": datetime.now(timezone.utc)
            }
            
            await db.listings.insert_one(listing)
            listings_created += 1
            
            # Create sessions for next 14 days
            start_date = datetime.now(timezone.utc)
            for day_offset in range(14):
                session_date = start_date + timedelta(days=day_offset)
                
                # Skip Sundays
                if session_date.weekday() == 6:
                    continue
                
                # Create 2-3 sessions per day
                num_sessions = random.randint(2, 3)
                for session_num in range(num_sessions):
                    hour = 10 + (session_num * 3)  # 10 AM, 1 PM, 4 PM
                    
                    session_start = session_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                    session_end = session_start + timedelta(minutes=listing_data["duration_minutes"])
                    
                    session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing_id,
                        "start_at": session_start,
                        "end_at": session_end,
                        "seats_total": random.randint(10, 20),
                        "seats_booked": random.randint(0, 5),
                        "status": "scheduled",
                        "created_at": datetime.now(timezone.utc)
                    }
                    
                    await db.sessions.insert_one(session)
                    sessions_created += 1
            
            if listings_created % 5 == 0:
                print(f"   Created {listings_created} listings...")
        
        print(f"✅ Created {listings_created} trial listings")
        print(f"✅ Created {sessions_created} sessions")
        print()
        
        # Create test reviewer account
        print("🧪 Creating test account...")
        reviewer_id = str(uuid.uuid4())
        await db.users.update_one(
            {"email": "reviewer@rrray.com"},
            {"$set": {
                "id": reviewer_id,
                "name": "Apple Reviewer",
                "email": "reviewer@rrray.com",
                "password": pwd_context.hash("TestReview2025!"),
                "phone": "+919999999999",
                "role": "customer",
                "created_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        await db.wallets.update_one(
            {"user_id": reviewer_id},
            {"$set": {
                "user_id": reviewer_id,
                "balance": 10,
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        print("   Created reviewer@rrray.com account (password: TestReview2025!)")
        print()
        
        # Final verification
        print("🔍 Verification:")
        total_listings = await db.listings.count_documents({})
        trial_listings = await db.listings.count_documents({"trial_available": True})
        total_sessions = await db.sessions.count_documents({})
        total_users = await db.users.count_documents({})
        
        print(f"   Total listings: {total_listings}")
        print(f"   Trial listings: {trial_listings}")
        print(f"   Total sessions: {total_sessions}")
        print(f"   Total users: {total_users}")
        print()
        
        print("✅ SEEDING COMPLETE!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ SEEDING FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("="*60)
    print("  rayy PRODUCTION DATABASE SEEDING")
    print("="*60)
    print()
    
    asyncio.run(seed_database())
