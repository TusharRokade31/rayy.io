"""
Seed script to add 30 diverse listings with trial classes, sessions, and pricing plans
Run with: python seed_more_listings.py
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

# Categories with their emojis
CATEGORIES = {
    "dance": {"name": "Dance", "emoji": "💃"},
    "art": {"name": "Art & Craft", "emoji": "🎨"},
    "coding": {"name": "Coding", "emoji": "💻"},
    "sports": {"name": "Sports", "emoji": "⚽"},
    "music": {"name": "Music", "emoji": "🎵"},
    "fitness": {"name": "Fitness", "emoji": "💪"}
}

# Listing templates with realistic Indian context
LISTINGS_DATA = [
    # Dance Classes
    {
        "title": "Classical Bharatanatyam for Beginners",
        "description": "Learn the ancient art of Bharatanatyam with certified instructors. Perfect for beginners aged 6-14.",
        "category": "dance",
        "age_min": 6,
        "age_max": 14,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 1200,
        "duration_minutes": 60,
        "equipment": "Comfortable clothing, ankle bells (will be provided initially)"
    },
    {
        "title": "Hip Hop Dance Crew",
        "description": "High-energy hip hop dance sessions for teens. Learn latest moves and perform in shows!",
        "category": "dance",
        "age_min": 11,
        "age_max": 18,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 199,
        "base_price_inr": 1500,
        "duration_minutes": 90,
        "equipment": "Comfortable sports wear, sneakers"
    },
    {
        "title": "Kathak Dance - Traditional & Contemporary",
        "description": "Master Kathak with renowned instructors. Both traditional and fusion styles taught.",
        "category": "dance",
        "age_min": 8,
        "age_max": 16,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 349,
        "base_price_inr": 1800,
        "duration_minutes": 75,
        "equipment": "Practice ghungroos, comfortable attire"
    },
    {
        "title": "Bollywood Dance Fitness",
        "description": "Fun Bollywood dance workout combining fitness and entertainment. Burn calories while learning iconic moves!",
        "category": "dance",
        "age_min": 10,
        "age_max": 20,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 249,
        "base_price_inr": 1400,
        "duration_minutes": 60,
        "equipment": "Comfortable workout clothes, water bottle"
    },
    
    # Art & Craft
    {
        "title": "Creative Art Studio for Kids",
        "description": "Explore painting, sketching, and crafts. Develop creativity and fine motor skills.",
        "category": "art",
        "age_min": 5,
        "age_max": 12,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 1600,
        "duration_minutes": 90,
        "equipment": "All materials provided"
    },
    {
        "title": "Digital Art & Animation Basics",
        "description": "Learn digital illustration and basic animation using iPad and Procreate. Perfect for aspiring digital artists.",
        "category": "art",
        "age_min": 10,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 499,
        "base_price_inr": 2200,
        "duration_minutes": 90,
        "equipment": "iPad/tablet with stylus (can be provided for rental)"
    },
    {
        "title": "Clay Modeling & Pottery",
        "description": "Hands-on pottery and clay modeling. Create functional and decorative pieces.",
        "category": "art",
        "age_min": 7,
        "age_max": 15,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 449,
        "base_price_inr": 1900,
        "duration_minutes": 120,
        "equipment": "Apron, all materials provided"
    },
    {
        "title": "Mandala Art & Zentangle",
        "description": "Learn therapeutic mandala art and zentangle patterns. Improves focus and mindfulness.",
        "category": "art",
        "age_min": 8,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 1300,
        "duration_minutes": 60,
        "equipment": "Basic art supplies needed (list provided)"
    },
    {
        "title": "Comic Book Creation Workshop",
        "description": "Create your own comics! Learn character design, storytelling, and panel layout.",
        "category": "art",
        "age_min": 9,
        "age_max": 16,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 1700,
        "duration_minutes": 90,
        "equipment": "Sketchbook, pencils, erasers"
    },
    
    # Coding
    {
        "title": "Scratch Programming for Young Coders",
        "description": "Introduction to coding through Scratch. Create games and animations. No prior experience needed!",
        "category": "coding",
        "age_min": 7,
        "age_max": 12,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 199,
        "base_price_inr": 1500,
        "duration_minutes": 60,
        "equipment": "Laptop/desktop with internet"
    },
    {
        "title": "Python Programming Fundamentals",
        "description": "Learn Python from basics to intermediate. Build real projects and games.",
        "category": "coding",
        "age_min": 11,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 2000,
        "duration_minutes": 90,
        "equipment": "Laptop with Python installed (setup help provided)"
    },
    {
        "title": "Web Development - HTML, CSS, JavaScript",
        "description": "Build your own websites! Learn front-end development from scratch to deployment.",
        "category": "coding",
        "age_min": 12,
        "age_max": 20,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 2500,
        "duration_minutes": 120,
        "equipment": "Laptop with VS Code installed"
    },
    {
        "title": "Robotics & Arduino for Teens",
        "description": "Learn robotics, electronics, and Arduino programming. Build working robots!",
        "category": "coding",
        "age_min": 13,
        "age_max": 18,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 599,
        "base_price_inr": 3000,
        "duration_minutes": 120,
        "equipment": "Arduino kit provided during class"
    },
    {
        "title": "App Development with MIT App Inventor",
        "description": "Create Android apps without complex coding. Visual programming for mobile apps.",
        "category": "coding",
        "age_min": 10,
        "age_max": 16,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 349,
        "base_price_inr": 1800,
        "duration_minutes": 75,
        "equipment": "Computer with Chrome browser, Android phone (optional)"
    },
    
    # Sports & Fitness
    {
        "title": "Junior Cricket Academy",
        "description": "Professional cricket coaching for all skill levels. Batting, bowling, and fielding techniques.",
        "category": "sports",
        "age_min": 7,
        "age_max": 16,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 1800,
        "duration_minutes": 90,
        "equipment": "Cricket bat, pads, helmet (available for rent)"
    },
    {
        "title": "Football Skills Training",
        "description": "Develop football skills with certified coaches. Dribbling, passing, shooting, and team play.",
        "category": "sports",
        "age_min": 6,
        "age_max": 15,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 249,
        "base_price_inr": 1600,
        "duration_minutes": 75,
        "equipment": "Football boots, shin guards, water bottle"
    },
    {
        "title": "Badminton Training Academy",
        "description": "Master badminton techniques with state-level coaches. Singles and doubles strategies.",
        "category": "sports",
        "age_min": 8,
        "age_max": 18,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 1900,
        "duration_minutes": 60,
        "equipment": "Badminton racket, sports shoes, shuttlecocks provided"
    },
    {
        "title": "Yoga for Kids & Teens",
        "description": "Build flexibility, strength, and mindfulness through yoga. Improve focus and reduce stress.",
        "category": "fitness",
        "age_min": 7,
        "age_max": 17,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 199,
        "base_price_inr": 1200,
        "duration_minutes": 45,
        "equipment": "Yoga mat, comfortable clothing"
    },
    {
        "title": "Table Tennis Pro Training",
        "description": "Professional table tennis coaching. From basics to advanced techniques and match strategies.",
        "category": "sports",
        "age_min": 7,
        "age_max": 16,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 249,
        "base_price_inr": 1500,
        "duration_minutes": 60,
        "equipment": "Table tennis racket (provided), sports shoes"
    },
    {
        "title": "Swimming Lessons - All Levels",
        "description": "Learn swimming from certified instructors. Safety, strokes, and competitive swimming techniques.",
        "category": "sports",
        "age_min": 5,
        "age_max": 15,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 2200,
        "duration_minutes": 60,
        "equipment": "Swimming costume, goggles, swim cap"
    },
    
    # Music
    {
        "title": "Keyboard & Piano Fundamentals",
        "description": "Learn keyboard/piano from basics. Read music notation, play songs, and develop technique.",
        "category": "music",
        "age_min": 6,
        "age_max": 16,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 1800,
        "duration_minutes": 60,
        "equipment": "Keyboard/piano at home"
    },
    {
        "title": "Guitar Classes - Acoustic & Electric",
        "description": "Master guitar playing! Chords, scales, songs, and music theory for all skill levels.",
        "category": "music",
        "age_min": 8,
        "age_max": 20,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 449,
        "base_price_inr": 2000,
        "duration_minutes": 60,
        "equipment": "Acoustic/electric guitar, picks"
    },
    {
        "title": "Vocal Music - Hindustani Classical",
        "description": "Learn Hindustani classical vocal music. Ragas, taans, and classical compositions.",
        "category": "music",
        "age_min": 7,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 349,
        "base_price_inr": 1600,
        "duration_minutes": 60,
        "equipment": "Tanpura app on phone/tablet"
    },
    {
        "title": "Drums & Percussion Masterclass",
        "description": "Rock, jazz, and fusion drumming. Learn rhythm patterns and solo techniques.",
        "category": "music",
        "age_min": 9,
        "age_max": 20,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 499,
        "base_price_inr": 2500,
        "duration_minutes": 75,
        "equipment": "Drumsticks (provided), practice pad"
    },
    {
        "title": "Carnatic Vocal Music",
        "description": "Traditional Carnatic music training. Varnams, kritis, and alapana techniques.",
        "category": "music",
        "age_min": 6,
        "age_max": 16,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 349,
        "base_price_inr": 1600,
        "duration_minutes": 60,
        "equipment": "Tanpura app, notebook for notation"
    },
    
    # Additional Popular Classes
    {
        "title": "Chess Strategy & Tactics",
        "description": "Improve chess skills with grandmaster-trained coaches. Openings, middle game, and endgame strategies.",
        "category": "fitness",
        "age_min": 6,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 249,
        "base_price_inr": 1400,
        "duration_minutes": 60,
        "equipment": "Chess board (physical or online account)"
    },
    {
        "title": "Public Speaking & Debate Club",
        "description": "Develop confidence, communication skills, and critical thinking through debates and presentations.",
        "category": "fitness",
        "age_min": 10,
        "age_max": 18,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 349,
        "base_price_inr": 1500,
        "duration_minutes": 90,
        "equipment": "None"
    },
    {
        "title": "Mental Math & Vedic Mathematics",
        "description": "Master speed math techniques. Calculate faster than calculators using Vedic methods!",
        "category": "coding",
        "age_min": 7,
        "age_max": 14,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 299,
        "base_price_inr": 1300,
        "duration_minutes": 60,
        "equipment": "Notebook, pencil"
    },
    {
        "title": "Theatre & Drama Workshop",
        "description": "Explore acting, improvisation, and stage performance. Build confidence and creativity.",
        "category": "art",
        "age_min": 8,
        "age_max": 17,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 449,
        "base_price_inr": 1900,
        "duration_minutes": 120,
        "equipment": "Comfortable clothing"
    },
    {
        "title": "Martial Arts - Karate & Self Defense",
        "description": "Learn karate basics, self-defense techniques, and discipline. Build confidence and fitness.",
        "category": "sports",
        "age_min": 6,
        "age_max": 16,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 399,
        "base_price_inr": 2000,
        "duration_minutes": 75,
        "equipment": "Karate gi (can be purchased later)"
    },
    {
        "title": "Science Experiments Lab",
        "description": "Hands-on science experiments! Physics, chemistry, and biology made fun and exciting.",
        "category": "coding",
        "age_min": 8,
        "age_max": 14,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 499,
        "base_price_inr": 2200,
        "duration_minutes": 90,
        "equipment": "Lab coat, safety goggles (provided)"
    }
]

# Indian cities with coordinates
CITIES = [
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Delhi", "lat": 28.7041, "lng": 77.1025},
    {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946},
    {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"name": "Kolkata", "lat": 22.5726, "lng": 88.3639},
    {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"name": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    {"name": "Lucknow", "lat": 26.8467, "lng": 80.9462}
]

async def seed_listings():
    print("🌱 Starting to seed 30 new listings...")
    
    # Get existing partners
    partners = await db.partners.find({"status": "active"}).to_list(100)
    if not partners:
        print("❌ No active partners found. Please seed partners first.")
        return
    
    print(f"Found {len(partners)} active partners")
    
    created_count = 0
    
    for idx, listing_template in enumerate(LISTINGS_DATA):
        try:
            # Select random partner and city
            partner = random.choice(partners)
            city_data = random.choice(CITIES)
            
            # Create listing
            listing_id = str(uuid.uuid4())
            listing = {
                "id": listing_id,
                "partner_id": partner["id"],
                "title": listing_template["title"],
                "description": listing_template["description"],
                "category": listing_template["category"],
                "age_min": listing_template["age_min"],
                "age_max": listing_template["age_max"],
                "base_price_inr": listing_template["base_price_inr"],
                "duration_minutes": listing_template["duration_minutes"],
                "is_online": listing_template["is_online"],
                "trial_available": listing_template["trial_available"],
                "trial_price_inr": listing_template["trial_price_inr"],
                "equipment": listing_template["equipment"],
                "media": [f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1700000000000)}-default"],
                "rating_avg": round(random.uniform(4.0, 5.0), 1),
                "rating_count": random.randint(5, 50),
                "status": "active",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.listings.insert_one(listing)
            print(f"✅ Created listing {idx + 1}/30: {listing['title']}")
            
            # Create venue if not online
            if not listing["is_online"]:
                venue = {
                    "id": str(uuid.uuid4()),
                    "partner_id": partner["id"],
                    "name": f"{partner['brand_name']} - {city_data['name']} Center",
                    "address": f"123 Main Road, {city_data['name']}",
                    "city": city_data['name'],
                    "lat": city_data['lat'] + random.uniform(-0.05, 0.05),
                    "lng": city_data['lng'] + random.uniform(-0.05, 0.05),
                    "created_at": datetime.now(timezone.utc)
                }
                await db.venues.insert_one(venue)
                venue_id = venue["id"]
            else:
                venue_id = None
            
            # Create multiple sessions with different pricing plans
            session_plans = [
                {"type": "single", "name": "Single Session", "sessions": 1, "price_multiplier": 1.0},
                {"type": "weekly", "name": "Weekly Plan (4 sessions)", "sessions": 4, "price_multiplier": 0.9},
                {"type": "monthly", "name": "Monthly Plan (12 sessions)", "sessions": 12, "price_multiplier": 0.75},
                {"type": "quarterly", "name": "Quarterly Plan (36 sessions)", "sessions": 36, "price_multiplier": 0.65}
            ]
            
            # Create sessions for next 30 days
            for day_offset in range(30):
                session_date = datetime.now(timezone.utc) + timedelta(days=day_offset)
                
                # Skip some random days to make it realistic
                if random.random() < 0.3:  # 30% chance to skip
                    continue
                
                # Create 2-3 sessions per day at different times
                session_times = [
                    {"hour": 9, "minute": 0},
                    {"hour": 15, "minute": 30},
                    {"hour": 18, "minute": 0}
                ]
                
                for time_slot in random.sample(session_times, random.randint(1, 2)):
                    # Select random pricing plan
                    plan = random.choice(session_plans)
                    
                    session_datetime = session_date.replace(
                        hour=time_slot["hour"],
                        minute=time_slot["minute"],
                        second=0,
                        microsecond=0
                    )
                    
                    session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing_id,
                        "venue_id": venue_id,
                        "date": session_datetime.date().isoformat(),
                        "time": session_datetime.time().isoformat(),
                        "seats_total": random.randint(10, 25),
                        "seats_reserved": random.randint(0, 5),
                        "price_inr": int(listing["base_price_inr"] * plan["price_multiplier"]),
                        "plan_type": plan["type"],
                        "plan_name": plan["name"],
                        "sessions_count": plan["sessions"],
                        "duration_minutes": listing["duration_minutes"],
                        "status": "scheduled",
                        "created_at": datetime.now(timezone.utc)
                    }
                    
                    await db.sessions.insert_one(session)
            
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating listing {idx + 1}: {str(e)}")
    
    print(f"\n✅ Successfully created {created_count} listings with sessions!")
    print("📊 Summary:")
    print(f"   - {created_count} new listings")
    print(f"   - Multiple sessions per listing (daily schedule)")
    print(f"   - 4 pricing plans: Single, Weekly, Monthly, Quarterly")
    print(f"   - All have trial classes available")
    print(f"   - Mix of online and offline classes")
    print(f"   - Distributed across {len(CITIES)} cities")

if __name__ == "__main__":
    asyncio.run(seed_listings())
