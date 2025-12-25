"""
Expanded Data Seeding Script for rayy
- Adds new categories (Pickleball, Cricket, Coaching Centers, Turf Sports, Elderly Activities)
- Creates diverse listings across all age groups including Elderly (60+)
- Includes slot booking activities
- Adds variety: music classes, yoga, park activities, sports coaching
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Gurgaon/NCR coordinates
GURGAON_COORDS = [
    {"lat": 28.4595, "lng": 77.0266, "area": "Cyber City"},
    {"lat": 28.4520, "lng": 77.0670, "area": "Golf Course Road"},
    {"lat": 28.4730, "lng": 77.0390, "area": "Sohna Road"},
    {"lat": 28.4210, "lng": 77.0860, "area": "Sector 56"},
    {"lat": 28.4420, "lng": 77.0470, "area": "DLF Phase 1"},
    {"lat": 28.4800, "lng": 77.0900, "area": "Sector 14"},
    {"lat": 28.4950, "lng": 77.0820, "area": "Sector 29"},
    {"lat": 28.4400, "lng": 77.1020, "area": "Sector 54"},
]

# Image URLs for different categories
IMAGE_URLS = {
    "pickleball": [
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
        "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800",
    ],
    "cricket": [
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800",
    ],
    "turf": [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800",
    ],
    "coaching": [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
    ],
    "yoga": [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    ],
    "music": [
        "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
    ],
    "elderly": [
        "https://images.unsplash.com/photo-1581579186913-45ac3e6efe93?w=800",
        "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800",
    ],
    "swimming": [
        "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800",
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800",
    ],
    "badminton": [
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
        "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800",
    ],
}

async def seed_categories():
    """Seed new and existing categories"""
    print("🏷️  Seeding categories...")
    
    categories = [
        # Existing categories
        {"id": str(uuid.uuid4()), "slug": "dance", "name": "Dance", "icon": "🕺"},
        {"id": str(uuid.uuid4()), "slug": "music", "name": "Music", "icon": "🎵"},
        {"id": str(uuid.uuid4()), "slug": "art", "name": "Art & Craft", "icon": "🎨"},
        {"id": str(uuid.uuid4()), "slug": "coding", "name": "Coding", "icon": "💻"},
        {"id": str(uuid.uuid4()), "slug": "martial_arts", "name": "Martial Arts", "icon": "🥋"},
        {"id": str(uuid.uuid4()), "slug": "fitness", "name": "Fitness", "icon": "💪"},
        {"id": str(uuid.uuid4()), "slug": "swimming", "name": "Swimming", "icon": "🏊"},
        
        # NEW categories
        {"id": str(uuid.uuid4()), "slug": "pickleball", "name": "Pickleball", "icon": "🏓"},
        {"id": str(uuid.uuid4()), "slug": "cricket", "name": "Cricket", "icon": "🏏"},
        {"id": str(uuid.uuid4()), "slug": "badminton", "name": "Badminton", "icon": "🏸"},
        {"id": str(uuid.uuid4()), "slug": "turf_sports", "name": "Turf Sports", "icon": "⚽"},
        {"id": str(uuid.uuid4()), "slug": "coaching", "name": "Coaching Centers", "icon": "📚"},
        {"id": str(uuid.uuid4()), "slug": "yoga", "name": "Yoga & Wellness", "icon": "🧘"},
        {"id": str(uuid.uuid4()), "slug": "elderly", "name": "Elderly Activities", "icon": "👴"},
        {"id": str(uuid.uuid4()), "slug": "slot_booking", "name": "Slot Booking", "icon": "📅"},
    ]
    
    # Delete existing and insert new
    await db.categories.delete_many({})
    await db.categories.insert_many(categories)
    print(f"✅ Seeded {len(categories)} categories")
    return categories

async def create_partner(name, email, phone, brand_name, city, area, coords):
    """Create a partner profile"""
    partner_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create user
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "phone": phone,
        "role": "partner_owner",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewgw.1f0H1QfVqMu",  # password123
        "onboarding_complete": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Create partner
    partner = {
        "id": partner_id,
        "owner_user_id": user_id,
        "brand_name": brand_name,
        "legal_name": brand_name,
        "description": f"Professional {brand_name} in {area}, {city}",
        "pan_number": f"ABCDE{random.randint(1000, 9999)}F",
        "aadhaar_number": f"{random.randint(100000000000, 999999999999)}",
        "bank_account_number": f"{random.randint(100000000000, 999999999999)}",
        "bank_ifsc": "ICIC0000240",
        "bank_account_holder_name": name,
        "bank_name": "ICICI Bank",
        "bank_account_type": "current",
        "address": f"Near {area}",
        "city": city,
        "lat": coords["lat"],
        "lng": coords["lng"],
        "kyc_status": "approved",
        "kyc_documents_submitted": True,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db.users.insert_one(user)
    await db.partners.insert_one(partner)
    
    return partner_id, user_id

async def create_listing(partner_id, title, category, description, age_min, age_max, price, duration, capacity, coords, area, trial_available=False):
    """Create a listing"""
    listing_id = str(uuid.uuid4())
    
    # Get image URLs based on category
    media = IMAGE_URLS.get(category, IMAGE_URLS["coaching"])[:2]
    
    listing = {
        "id": listing_id,
        "partner_id": partner_id,
        "title": title,
        "description": description,
        "category": category,
        "age_min": age_min,
        "age_max": age_max,
        "base_price_inr": price,
        "tax_percent": 18,
        "duration_minutes": duration,
        "max_capacity": capacity,
        "trial_available": trial_available,
        "trial_price_inr": round(price * 0.5) if trial_available else 0,
        "address": f"Near {area}",
        "city": "Gurgaon",
        "state": "Haryana",
        "pincode": "122001",
        "latitude": coords["lat"],
        "longitude": coords["lng"],
        "media": media,
        "is_online": False,
        "status": "active",
        "rating_avg": round(random.uniform(4.2, 4.9), 1),
        "rating_count": random.randint(15, 150),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db.listings.insert_one(listing)
    return listing_id

async def create_sessions(listing_id, count=10):
    """Create future sessions for a listing"""
    sessions = []
    base_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    for i in range(count):
        # Distribute sessions over next 30 days
        days_ahead = random.randint(1, 30)
        session_date = base_date + timedelta(days=days_ahead)
        
        # Random time slots
        hour = random.choice([7, 9, 11, 15, 17, 19])
        session_datetime = session_date.replace(hour=hour, minute=0)
        
        session = {
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "date": session_datetime.date().isoformat(),
            "time": session_datetime.time().isoformat(),
            "session_datetime": session_datetime,
            "start_at": session_datetime,
            "end_at": session_datetime + timedelta(hours=1),
            "seats_total": random.randint(8, 20),
            "seats_reserved": random.randint(0, 5),
            "price_inr": None,  # Use listing price
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc),
        }
        sessions.append(session)
    
    if sessions:
        await db.sessions.insert_many(sessions)
    
    return len(sessions)

async def seed_expanded_listings():
    """Seed comprehensive listings across all categories"""
    print("🎯 Seeding expanded listings...")
    
    total_listings = 0
    total_sessions = 0
    
    # 1. PICKLEBALL (Ages 12-60)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Rahul Sharma", "pickleball.guru@yuno.app", "9876543210",
        "Pickleball Arena Gurgaon", "Gurgaon", coords["area"], coords
    )
    
    pickleball_listings = [
        {"title": "Beginner Pickleball Training", "age_min": 12, "age_max": 50, "price": 600, "duration": 60},
        {"title": "Advanced Pickleball Coaching", "age_min": 15, "age_max": 60, "price": 900, "duration": 90},
        {"title": "Pickleball Court Slot Booking", "age_min": 12, "age_max": 70, "price": 400, "duration": 60},
    ]
    
    for listing_data in pickleball_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "pickleball",
            f"Professional {listing_data['title']} with certified coaches. Equipment provided.",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 12, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 15)
        total_listings += 1
        total_sessions += sessions_count
    
    # 2. CRICKET COACHING (Ages 6-18)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Virat Singh", "cricket.academy@yuno.app", "9876543211",
        "Champions Cricket Academy", "Gurgaon", coords["area"], coords
    )
    
    cricket_listings = [
        {"title": "Junior Cricket Coaching (6-12 yrs)", "age_min": 6, "age_max": 12, "price": 800, "duration": 90},
        {"title": "Senior Cricket Training (13-18 yrs)", "age_min": 13, "age_max": 18, "price": 1200, "duration": 120},
        {"title": "Weekend Cricket Camp", "age_min": 8, "age_max": 16, "price": 1500, "duration": 180},
    ]
    
    for listing_data in cricket_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "cricket",
            f"{listing_data['title']} - Professional coaching with match practice",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 16, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 20)
        total_listings += 1
        total_sessions += sessions_count
    
    # 3. TURF SPORTS - Slot Booking (Ages 8-60)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Amit Kumar", "turfmaster@yuno.app", "9876543212",
        "PlayZone Turf & Sports", "Gurgaon", coords["area"], coords
    )
    
    turf_listings = [
        {"title": "Football Turf - 60 Min Slot", "age_min": 8, "age_max": 60, "price": 1500, "duration": 60},
        {"title": "Cricket Turf - 90 Min Slot", "age_min": 10, "age_max": 60, "price": 2000, "duration": 90},
        {"title": "Multi-Sport Turf Booking", "age_min": 8, "age_max": 60, "price": 1800, "duration": 60},
    ]
    
    for listing_data in turf_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "turf_sports",
            f"{listing_data['title']} - Premium turf with floodlights, changing rooms, and equipment",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 22, coords, coords["area"]
        )
        sessions_count = await create_sessions(listing_id, 30)  # More slots for turf
        total_listings += 1
        total_sessions += sessions_count
    
    # 4. COACHING CENTERS (Ages 8-18)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Dr. Priya Mehta", "brainworks@yuno.app", "9876543213",
        "BrainWorks Coaching Institute", "Gurgaon", coords["area"], coords
    )
    
    coaching_listings = [
        {"title": "Math & Science Coaching (8-12 yrs)", "age_min": 8, "age_max": 12, "price": 1200, "duration": 90},
        {"title": "IIT-JEE Foundation (13-16 yrs)", "age_min": 13, "age_max": 16, "price": 2000, "duration": 120},
        {"title": "NEET Preparation (16-18 yrs)", "age_min": 16, "age_max": 18, "price": 2500, "duration": 150},
        {"title": "English Communication Skills", "age_min": 10, "age_max": 18, "price": 900, "duration": 60},
    ]
    
    for listing_data in coaching_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "coaching",
            f"{listing_data['title']} - Expert teachers, small batch size, concept clarity focus",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 15, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 25)
        total_listings += 1
        total_sessions += sessions_count
    
    # 5. ELDERLY ACTIVITIES (Ages 60-85)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Sunita Kapoor", "goldenage@yuno.app", "9876543214",
        "Golden Age Wellness Center", "Gurgaon", coords["area"], coords
    )
    
    elderly_listings = [
        {"title": "Senior Yoga & Meditation", "age_min": 60, "age_max": 85, "price": 500, "duration": 60},
        {"title": "Music Therapy for Elders", "age_min": 60, "age_max": 85, "price": 600, "duration": 60},
        {"title": "Morning Park Walk Group", "age_min": 60, "age_max": 85, "price": 300, "duration": 45},
        {"title": "Chair Yoga for Seniors", "age_min": 60, "age_max": 85, "price": 450, "duration": 45},
        {"title": "Art & Craft for Elders", "age_min": 60, "age_max": 85, "price": 550, "duration": 90},
    ]
    
    for listing_data in elderly_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "elderly",
            f"{listing_data['title']} - Specially designed for senior citizens with health monitoring",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 12, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 20)
        total_listings += 1
        total_sessions += sessions_count
    
    # 6. BADMINTON (Ages 8-60)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Saina Reddy", "shuttleking@yuno.app", "9876543215",
        "ShuttleKing Badminton Academy", "Gurgaon", coords["area"], coords
    )
    
    badminton_listings = [
        {"title": "Badminton Coaching for Kids", "age_min": 8, "age_max": 14, "price": 700, "duration": 60},
        {"title": "Adult Badminton Training", "age_min": 18, "age_max": 60, "price": 900, "duration": 60},
        {"title": "Badminton Court Slot Booking", "age_min": 10, "age_max": 60, "price": 500, "duration": 60},
    ]
    
    for listing_data in badminton_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "badminton",
            f"{listing_data['title']} - Professional courts with quality equipment and coaching",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 8, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 25)
        total_listings += 1
        total_sessions += sessions_count
    
    # 7. SWIMMING (Ages 4-70)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Raj Malhotra", "aquafit@yuno.app", "9876543216",
        "AquaFit Swimming Academy", "Gurgaon", coords["area"], coords
    )
    
    swimming_listings = [
        {"title": "Kids Swimming Classes (4-10 yrs)", "age_min": 4, "age_max": 10, "price": 1200, "duration": 60},
        {"title": "Teen Swimming Training (11-17 yrs)", "age_min": 11, "age_max": 17, "price": 1400, "duration": 60},
        {"title": "Adult Swimming Lessons", "age_min": 18, "age_max": 60, "price": 1500, "duration": 60},
        {"title": "Senior Aqua Therapy", "age_min": 60, "age_max": 75, "price": 1000, "duration": 45},
    ]
    
    for listing_data in swimming_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "swimming",
            f"{listing_data['title']} - Olympic-size pool with certified lifeguards and coaches",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 10, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 30)
        total_listings += 1
        total_sessions += sessions_count
    
    # 8. YOGA & WELLNESS (All Ages)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Anjali Sharma", "zenmaster@yuno.app", "9876543217",
        "Zen Yoga & Wellness Studio", "Gurgaon", coords["area"], coords
    )
    
    yoga_listings = [
        {"title": "Kids Yoga (5-12 yrs)", "age_min": 5, "age_max": 12, "price": 600, "duration": 45},
        {"title": "Power Yoga for Adults", "age_min": 18, "age_max": 60, "price": 800, "duration": 60},
        {"title": "Prenatal Yoga", "age_min": 22, "age_max": 40, "price": 900, "duration": 60},
        {"title": "Gentle Yoga for Seniors", "age_min": 60, "age_max": 85, "price": 500, "duration": 45},
        {"title": "Meditation & Mindfulness", "age_min": 15, "age_max": 85, "price": 400, "duration": 30},
    ]
    
    for listing_data in yoga_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "yoga",
            f"{listing_data['title']} - Certified instructors, peaceful environment, props provided",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 15, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 20)
        total_listings += 1
        total_sessions += sessions_count
    
    # 9. MUSIC CLASSES (Ages 5-85)
    coords = random.choice(GURGAON_COORDS)
    partner_id, _ = await create_partner(
        "Ravi Shankar", "melodymasters@yuno.app", "9876543218",
        "Melody Masters Music School", "Gurgaon", coords["area"], coords
    )
    
    music_listings = [
        {"title": "Keyboard for Kids (5-12 yrs)", "age_min": 5, "age_max": 12, "price": 1000, "duration": 45},
        {"title": "Guitar Classes (10-60 yrs)", "age_min": 10, "age_max": 60, "price": 1200, "duration": 60},
        {"title": "Vocal Music Training", "age_min": 8, "age_max": 70, "price": 900, "duration": 45},
        {"title": "Senior Music Appreciation", "age_min": 60, "age_max": 85, "price": 600, "duration": 60},
    ]
    
    for listing_data in music_listings:
        listing_id = await create_listing(
            partner_id, listing_data["title"], "music",
            f"{listing_data['title']} - Individual attention, instrument provided, performance opportunities",
            listing_data["age_min"], listing_data["age_max"], listing_data["price"],
            listing_data["duration"], 8, coords, coords["area"], trial_available=True
        )
        sessions_count = await create_sessions(listing_id, 20)
        total_listings += 1
        total_sessions += sessions_count
    
    print(f"✅ Created {total_listings} new listings with {total_sessions} sessions")

async def main():
    print("🌱 Starting expanded data seeding...")
    print("=" * 60)
    
    # Seed categories first
    categories = await seed_categories()
    
    # Seed expanded listings
    await seed_expanded_listings()
    
    print("=" * 60)
    print("✅ Expanded data seeding completed successfully!")
    print(f"📊 Summary:")
    print(f"   - Categories: 15 (including new: Pickleball, Cricket, Turf Sports, Coaching, Elderly)")
    print(f"   - New Partners: 9")
    print(f"   - New Listings: ~40+")
    print(f"   - New Sessions: ~800+")
    print(f"   - Age Range: 4-85 years (including Elderly category)")

if __name__ == "__main__":
    asyncio.run(main())
