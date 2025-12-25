import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import uuid
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_data():
    print("🌱 Seeding YUNO database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.partners.delete_many({})
    await db.venues.delete_many({})
    await db.categories.delete_many({})
    await db.listings.delete_many({})
    await db.sessions.delete_many({})
    await db.bookings.delete_many({})
    await db.credit_plans.delete_many({})
    await db.wallets.delete_many({})
    await db.credit_ledger.delete_many({})
    await db.ratings.delete_many({})
    
    # Categories
    categories = [
        {"id": str(uuid.uuid4()), "slug": "dance", "name": "Dance", "icon": "🕺"},
        {"id": str(uuid.uuid4()), "slug": "coding", "name": "Coding", "icon": "💻"},
        {"id": str(uuid.uuid4()), "slug": "karate", "name": "Martial Arts", "icon": "🥋"},
        {"id": str(uuid.uuid4()), "slug": "art", "name": "Art & Craft", "icon": "🎨"},
        {"id": str(uuid.uuid4()), "slug": "toddler", "name": "Toddler Play", "icon": "👶"},
        {"id": str(uuid.uuid4()), "slug": "fitness", "name": "Fitness", "icon": "💪"},
    ]
    await db.categories.insert_many(categories)
    print(f"✓ Created {len(categories)} categories")
    
    # Credit Plans
    plans = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter",
            "monthly_price_inr": 799,
            "credits_per_month": 30,
            "rollover": False,
            "rollover_cap": None,
            "validity_days": 30,
            "trial_credits": 5
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Family",
            "monthly_price_inr": 1999,
            "credits_per_month": 90,
            "rollover": True,
            "rollover_cap": 180,
            "validity_days": 30,
            "trial_credits": 10
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Pro",
            "monthly_price_inr": 3499,
            "credits_per_month": 180,
            "rollover": True,
            "rollover_cap": 360,
            "validity_days": 30,
            "trial_credits": 20
        }
    ]
    await db.credit_plans.insert_many(plans)
    print(f"✓ Created {len(plans)} credit plans")
    
    # Users
    customer_id = str(uuid.uuid4())
    customer = {
        "id": customer_id,
        "role": "customer",
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "phone": "+919876543210",
        "hashed_password": hash_password("password123"),
        "whatsapp_opt_in": True,
        "child_profiles": [
            {"name": "Aarav", "age": 7, "interests": ["coding", "karate"]},
            {"name": "Diya", "age": 4, "interests": ["dance", "art"]}
        ],
        "kyc_status": "verified",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(customer)
    
    # Create wallet for customer
    wallet = {
        "id": str(uuid.uuid4()),
        "user_id": customer_id,
        "credits_balance": 50,
        "last_grant_at": datetime.now(timezone.utc)
    }
    await db.wallets.insert_one(wallet)
    print(f"✓ Created customer: {customer['email']}")
    
    # Partner Users & Partners
    partner_users = []
    partners_data = [
        {
            "brand_name": "Little Steps PlayLab",
            "legal_name": "Little Steps Edu Pvt Ltd",
            "city": "Gurgaon",
            "address": "Sector 57, Gurgaon",
            "gstin": "06ABCDE1234F1Z5",
            "pan": "ABCDE1234F"
        },
        {
            "brand_name": "CodeBurst Kids",
            "legal_name": "CodeBurst Technologies",
            "city": "Gurgaon",
            "address": "DLF Phase 3, Gurgaon",
            "gstin": "06XYZAB5678G1Z5",
            "pan": "XYZAB5678G"
        },
        {
            "brand_name": "DanceWorks Jr.",
            "legal_name": "DanceWorks Academy",
            "city": "Gurgaon",
            "address": "Golf Course Road, Gurgaon",
            "gstin": "06PQRST9012H1Z5",
            "pan": "PQRST9012H"
        },
        {
            "brand_name": "Fit19",
            "legal_name": "Fit19 Wellness Pvt Ltd",
            "city": "Gurgaon",
            "address": "Cyber City, Gurgaon",
            "gstin": "06MNOPQ3456I1Z5",
            "pan": "MNOPQ3456I"
        }
    ]
    
    partner_objects = []
    for idx, p in enumerate(partners_data):
        user_id = str(uuid.uuid4())
        partner_user = {
            "id": user_id,
            "role": "partner_owner",
            "name": p["brand_name"],
            "email": f"partner{idx+1}@yuno.app",
            "phone": f"+9198765432{idx+1}{idx+1}",
            "hashed_password": hash_password("partner123"),
            "whatsapp_opt_in": True,
            "child_profiles": [],
            "kyc_status": "verified",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        partner_users.append(partner_user)
        
        partner_id = str(uuid.uuid4())
        partner = {
            "id": partner_id,
            "owner_user_id": user_id,
            "brand_name": p["brand_name"],
            "legal_name": p["legal_name"],
            "gstin": p["gstin"],
            "pan": p["pan"],
            "upi_id": f"{p['brand_name'].lower().replace(' ', '')}@upi",
            "address": p["address"],
            "city": p["city"],
            "lat": 28.4595 + (idx * 0.01),
            "lng": 77.0266 + (idx * 0.01),
            "verification_badges": ["verified", "background_checked"],
            "cancellation_policy_id": None,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        partner_objects.append({"user": partner_user, "partner": partner})
    
    await db.users.insert_many(partner_users)
    await db.partners.insert_many([p["partner"] for p in partner_objects])
    print(f"✓ Created {len(partner_objects)} partners")
    
    # Admin
    admin = {
        "id": str(uuid.uuid4()),
        "role": "admin",
        "name": "Admin User",
        "email": "admin@yuno.app",
        "phone": "+919999999999",
        "hashed_password": hash_password("admin123"),
        "whatsapp_opt_in": False,
        "child_profiles": [],
        "kyc_status": "verified",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(admin)
    print(f"✓ Created admin: {admin['email']}")
    
    # Venues & Listings
    listings = []
    sessions_list = []
    
    # Little Steps PlayLab
    p1 = partner_objects[0]["partner"]
    venue1_id = str(uuid.uuid4())
    venue1 = {
        "id": venue1_id,
        "partner_id": p1["id"],
        "name": "Main Play Area",
        "address": p1["address"],
        "lat": p1["lat"],
        "lng": p1["lng"],
        "indoor": True,
        "amenities": ["AC", "Soft Play", "Parent Seating"],
        "capacity": 15
    }
    await db.venues.insert_one(venue1)
    
    cat_toddler = next(c for c in categories if c["slug"] == "toddler")
    cat_art = next(c for c in categories if c["slug"] == "art")
    cat_karate = next(c for c in categories if c["slug"] == "karate")
    
    listing1_id = str(uuid.uuid4())
    listing1 = {
        "id": listing1_id,
        "partner_id": p1["id"],
        "venue_id": venue1_id,
        "title": "Toddler Sensory Play",
        "subtitle": "Explore textures, colors & sounds",
        "category_id": cat_toddler["id"],
        "description": "A fun sensory play session for toddlers aged 1-3. Activities include texture exploration, music time, and safe play in a supervised environment.",
        "age_min": 1,
        "age_max": 3,
        "duration_minutes": 45,
        "base_price_inr": 400.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 99.0,
        "media": ["https://images.unsplash.com/photo-1596464716127-f2a82984de30"],
        "safety_notes": "Soft mats provided. Parent presence required.",
        "equipment_needed": "None - all provided",
        "parent_presence_required": True,
        "rating_avg": 4.8,
        "rating_count": 45,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing1)
    
    listing2_id = str(uuid.uuid4())
    listing2 = {
        "id": listing2_id,
        "partner_id": p1["id"],
        "venue_id": venue1_id,
        "title": "Weekend Art Workshop",
        "subtitle": "Painting & Crafts for kids",
        "category_id": cat_art["id"],
        "description": "Let creativity bloom! Kids aged 4-6 will learn basic painting techniques, paper crafts, and create their own masterpieces to take home.",
        "age_min": 4,
        "age_max": 6,
        "duration_minutes": 90,
        "base_price_inr": 600.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 199.0,
        "media": ["https://images.unsplash.com/photo-1513364776144-60967b0f800f"],
        "safety_notes": "Non-toxic materials only",
        "equipment_needed": "All materials provided",
        "parent_presence_required": False,
        "rating_avg": 4.6,
        "rating_count": 32,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing2)
    
    listing3_id = str(uuid.uuid4())
    listing3 = {
        "id": listing3_id,
        "partner_id": p1["id"],
        "venue_id": venue1_id,
        "title": "Junior Karate",
        "subtitle": "Discipline & Fitness for Kids",
        "category_id": cat_karate["id"],
        "description": "Introduction to Karate for ages 7-12. Learn basic stances, punches, kicks, and kata. Build confidence and discipline.",
        "age_min": 7,
        "age_max": 12,
        "duration_minutes": 60,
        "base_price_inr": 800.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 299.0,
        "media": ["https://images.unsplash.com/photo-1555597673-b21d5c935865"],
        "safety_notes": "Protective gear provided",
        "equipment_needed": "Comfortable clothes, water bottle",
        "parent_presence_required": False,
        "rating_avg": 4.9,
        "rating_count": 68,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing3)
    
    # CodeBurst Kids
    p2 = partner_objects[1]["partner"]
    venue2_id = str(uuid.uuid4())
    venue2 = {
        "id": venue2_id,
        "partner_id": p2["id"],
        "name": "Tech Lab",
        "address": p2["address"],
        "lat": p2["lat"],
        "lng": p2["lng"],
        "indoor": True,
        "amenities": ["Computers", "AC", "Projector"],
        "capacity": 12
    }
    await db.venues.insert_one(venue2)
    
    cat_coding = next(c for c in categories if c["slug"] == "coding")
    
    listing4_id = str(uuid.uuid4())
    listing4 = {
        "id": listing4_id,
        "partner_id": p2["id"],
        "venue_id": venue2_id,
        "title": "Scratch Basics",
        "subtitle": "Learn coding through games",
        "category_id": cat_coding["id"],
        "description": "Introduce your kids (7-10) to coding with Scratch. Create animations, stories, and games using visual blocks.",
        "age_min": 7,
        "age_max": 10,
        "duration_minutes": 90,
        "base_price_inr": 1000.0,
        "tax_percent": 18.0,
        "is_online": True,
        "trial_available": True,
        "trial_price_inr": 199.0,
        "media": ["https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04"],
        "safety_notes": None,
        "equipment_needed": "Laptop/tablet with internet",
        "parent_presence_required": False,
        "rating_avg": 4.7,
        "rating_count": 55,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing4)
    
    listing5_id = str(uuid.uuid4())
    listing5 = {
        "id": listing5_id,
        "partner_id": p2["id"],
        "venue_id": venue2_id,
        "title": "Python for Teens",
        "subtitle": "Real coding starts here",
        "category_id": cat_coding["id"],
        "description": "Learn Python programming for ages 12-16. Build real projects, understand logic, and prepare for advanced CS courses.",
        "age_min": 12,
        "age_max": 16,
        "duration_minutes": 120,
        "base_price_inr": 1500.0,
        "tax_percent": 18.0,
        "is_online": True,
        "trial_available": False,
        "trial_price_inr": None,
        "media": ["https://images.unsplash.com/photo-1542831371-29b0f74f9713"],
        "safety_notes": None,
        "equipment_needed": "Laptop with Python installed",
        "parent_presence_required": False,
        "rating_avg": 4.9,
        "rating_count": 78,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing5)
    
    # DanceWorks Jr.
    p3 = partner_objects[2]["partner"]
    venue3_id = str(uuid.uuid4())
    venue3 = {
        "id": venue3_id,
        "partner_id": p3["id"],
        "name": "Studio A",
        "address": p3["address"],
        "lat": p3["lat"],
        "lng": p3["lng"],
        "indoor": True,
        "amenities": ["Mirror Walls", "Sound System", "AC"],
        "capacity": 20
    }
    await db.venues.insert_one(venue3)
    
    cat_dance = next(c for c in categories if c["slug"] == "dance")
    
    listing6_id = str(uuid.uuid4())
    listing6 = {
        "id": listing6_id,
        "partner_id": p3["id"],
        "venue_id": venue3_id,
        "title": "Hip-Hop for Kids",
        "subtitle": "Groove & Move",
        "category_id": cat_dance["id"],
        "description": "High-energy hip-hop dance classes for ages 6-12. Learn cool moves, build confidence, and perform in showcases.",
        "age_min": 6,
        "age_max": 12,
        "duration_minutes": 60,
        "base_price_inr": 700.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 199.0,
        "media": ["https://images.unsplash.com/photo-1508700929628-666bc8bd84ea"],
        "safety_notes": "Sneakers required",
        "equipment_needed": "Comfortable clothes, water bottle",
        "parent_presence_required": False,
        "rating_avg": 4.8,
        "rating_count": 92,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing6)
    
    listing7_id = str(uuid.uuid4())
    listing7 = {
        "id": listing7_id,
        "partner_id": p3["id"],
        "venue_id": venue3_id,
        "title": "Contemporary Dance (Teens)",
        "subtitle": "Express yourself through movement",
        "category_id": cat_dance["id"],
        "description": "Explore contemporary dance for ages 13-18. Develop technique, expression, and choreography skills.",
        "age_min": 13,
        "age_max": 18,
        "duration_minutes": 90,
        "base_price_inr": 1000.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 299.0,
        "media": ["https://images.unsplash.com/photo-1518834107812-67b0b7c58434"],
        "safety_notes": "Warm-up mandatory",
        "equipment_needed": "Dance attire, bare feet or jazz shoes",
        "parent_presence_required": False,
        "rating_avg": 4.9,
        "rating_count": 67,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing7)
    
    # Fit19
    p4 = partner_objects[3]["partner"]
    venue4_id = str(uuid.uuid4())
    venue4 = {
        "id": venue4_id,
        "partner_id": p4["id"],
        "name": "Fitness Studio",
        "address": p4["address"],
        "lat": p4["lat"],
        "lng": p4["lng"],
        "indoor": True,
        "amenities": ["Gym Equipment", "Yoga Mats", "Showers"],
        "capacity": 25
    }
    await db.venues.insert_one(venue4)
    
    cat_fitness = next(c for c in categories if c["slug"] == "fitness")
    
    listing8_id = str(uuid.uuid4())
    listing8 = {
        "id": listing8_id,
        "partner_id": p4["id"],
        "venue_id": venue4_id,
        "title": "HIIT & Mobility (19-24)",
        "subtitle": "Get fit, stay flexible",
        "category_id": cat_fitness["id"],
        "description": "High-intensity interval training combined with mobility work. Perfect for young adults (19-24) looking to build strength and flexibility.",
        "age_min": 19,
        "age_max": 24,
        "duration_minutes": 60,
        "base_price_inr": 500.0,
        "tax_percent": 18.0,
        "is_online": False,
        "trial_available": True,
        "trial_price_inr": 99.0,
        "media": ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48"],
        "safety_notes": "Health clearance recommended",
        "equipment_needed": "Athletic wear, water bottle",
        "parent_presence_required": False,
        "rating_avg": 4.7,
        "rating_count": 42,
        "status": "active",
        "cancellation_policy_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    listings.append(listing8)
    
    await db.listings.insert_many(listings)
    print(f"✓ Created {len(listings)} listings")
    
    # Sessions (next 2 weeks)
    now = datetime.now(timezone.utc)
    
    for listing in listings:
        # Create 10-15 sessions over next 2 weeks
        for day_offset in range(0, 14):
            session_date = now + timedelta(days=day_offset)
            
            # Different times based on listing
            if listing["age_min"] <= 3:
                # Toddler: mornings only
                times = [10, 11]
            elif listing["age_min"] <= 6:
                # Kids: morning and afternoon
                times = [10, 15, 16]
            elif listing["age_min"] <= 12:
                # Older kids: afternoon and evening
                times = [16, 17, 18]
            else:
                # Teens/adults: evening
                times = [17, 18, 19]
            
            for hour in times:
                if day_offset % 2 == 0 or hour in [10, 17]:  # Skip some sessions
                    session_start = session_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                    session_end = session_start + timedelta(minutes=listing["duration_minutes"])
                    
                    # Peak pricing on weekends
                    is_weekend = session_start.weekday() >= 5
                    price_override = listing["base_price_inr"] * 1.2 if is_weekend else None
                    
                    session = {
                        "id": str(uuid.uuid4()),
                        "listing_id": listing["id"],
                        "start_at": session_start,
                        "end_at": session_end,
                        "seats_total": 10 if listing["is_online"] else 8,
                        "seats_reserved": 0,
                        "allow_late_booking_minutes": 60,
                        "price_override_inr": price_override,
                        "staff_assigned": None,
                        "status": "scheduled"
                    }
                    sessions_list.append(session)
    
    await db.sessions.insert_many(sessions_list)
    print(f"✓ Created {len(sessions_list)} sessions")
    
    print("\n🎉 Database seeded successfully!")
    print("\n📧 Test Credentials:")
    print(f"Customer: priya@example.com / password123")
    print(f"Partner: partner1@yuno.app / partner123")
    print(f"Admin: admin@yuno.app / admin123")
    print("\n💳 Customer wallet has 50 credits")

if __name__ == "__main__":
    asyncio.run(seed_data())
    client.close()
