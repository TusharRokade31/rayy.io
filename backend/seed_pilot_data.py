import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import uuid
import bcrypt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Mock Cloudinary images (diverse stock photos)
MOCK_IMAGES = {
    "toddler": [
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
        "https://images.unsplash.com/photo-1595121640398-0d1436e9bd3b?w=800"
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800"
    ],
    "dance": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800",
        "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800"
    ],
    "coding": [
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
        "https://images.unsplash.com/photo-1593642532454-e138e28a63f4?w=800",
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800"
    ],
    "martial": [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800",
        "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=800",
        "https://images.unsplash.com/photo-1563444158-e5c85c7ae6ee?w=800"
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
        "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
        "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800"
    ]
}

async def seed_pilot_data():
    print("🌱 Seeding YUNO Pilot Data for Gurgaon...")
    
    # Clear existing data
    print("🗑️  Clearing existing data...")
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
    await db.audit_logs.delete_many({})
    
    # Categories
    categories = [
        {"id": str(uuid.uuid4()), "slug": "toddler", "name": "Toddler Play", "icon": "👶"},
        {"id": str(uuid.uuid4()), "slug": "art", "name": "Art & Craft", "icon": "🎨"},
        {"id": str(uuid.uuid4()), "slug": "dance", "name": "Dance", "icon": "🕺"},
        {"id": str(uuid.uuid4()), "slug": "coding", "name": "Coding & STEM", "icon": "💻"},
        {"id": str(uuid.uuid4()), "slug": "martial", "name": "Martial Arts", "icon": "🥋"},
        {"id": str(uuid.uuid4()), "slug": "fitness", "name": "Fitness", "icon": "💪"},
    ]
    await db.categories.insert_many(categories)
    print(f"✓ Created {len(categories)} categories")
    
    # Credit Plans
    plans = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter Pack",
            "credits_per_month": 25,
            "price_inr": 2500.0,
            "savings_percent": 0,
            "best_for": "1 class/week",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Growing Star",
            "credits_per_month": 60,
            "price_inr": 5500.0,
            "savings_percent": 8,
            "best_for": "2-3 classes/week",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Super Explorer",
            "credits_per_month": 120,
            "price_inr": 10000.0,
            "savings_percent": 17,
            "best_for": "Unlimited fun",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.credit_plans.insert_many(plans)
    print(f"✓ Created {len(plans)} credit plans")
    
    # Customer users (20 for realistic booking data)
    customers = []
    customer_names = [
        "Priya Sharma", "Amit Patel", "Neha Gupta", "Raj Malhotra", "Ananya Singh",
        "Vikram Reddy", "Kavya Iyer", "Arjun Mehta", "Sneha Kapoor", "Rohan Verma",
        "Divya Nair", "Karthik Rao", "Isha Desai", "Aditya Kumar", "Pooja Joshi",
        "Sanjay Agarwal", "Ritu Bansal", "Nikhil Chopra", "Meera Saxena", "Varun Khanna"
    ]
    
    for i, name in enumerate(customer_names):
        email = f"{name.lower().replace(' ', '.')}@example.com"
        child_age = random.choice([2, 3, 5, 6, 8, 9, 10, 12, 14, 16, 20])
        user = {
            "id": str(uuid.uuid4()),
            "role": "customer",
            "name": name,
            "email": email,
            "phone": f"+9198{random.randint(10000000, 99999999)}",
            "hashed_password": hash_password("password123"),
            "whatsapp_opt_in": random.choice([True, False]),
            "child_profiles": [
                {
                    "name": f"{name.split()[0]}'s Child",
                    "age": child_age,
                    "dob": (datetime.now(timezone.utc) - timedelta(days=child_age*365)).isoformat()
                }
            ],
            "kyc_status": "verified",
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180)),
            "updated_at": datetime.now(timezone.utc)
        }
        customers.append(user)
        
        # Create wallets
        await db.wallets.insert_one({
            "user_id": user["id"],
            "credits_balance": random.randint(10, 100),
            "cash_balance_inr": random.uniform(500, 3000),
            "created_at": datetime.now(timezone.utc)
        })
    
    await db.users.insert_many(customers)
    print(f"✓ Created {len(customers)} customer users with wallets")
    
    # Admin user
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
    
    # Partners & Listings (30 total - 5 per category)
    partners_data = [
        # TODDLER PLAY (1-3)
        {
            "brand": "Little Steps PlayLab", "location": "Sector 57", 
            "listings": [
                {"title": "Toddler Sensory Play", "desc": "Explore textures, colors & sounds. Hands-on sensory fun.", "age": [1,3], "dur": 45, "price": 400, "trial": 99},
                {"title": "Weekend Art Workshop", "desc": "Mini artists create colorful masterpieces. Parent-child bonding.", "age": [2,4], "dur": 60, "price": 600, "trial": 199},
                {"title": "Music & Movement", "desc": "Dance, sing, and groove to nursery rhythms. Pure joy.", "age": [1,3], "dur": 45, "price": 450, "trial": 99},
                {"title": "Outdoor Play Morning", "desc": "Slides, swings, and sunshine. Supervised outdoor play.", "age": [2,4], "dur": 60, "price": 500, "trial": 149},
                {"title": "Story Time Circle", "desc": "Interactive storytelling with puppets. Vocabulary building.", "age": [2,3], "dur": 30, "price": 350, "trial": 79}
            ]
        },
        
        # ART & CRAFT (4-6)
        {
            "brand": "Creative Nest", "location": "DLF Phase 4",
            "listings": [
                {"title": "Clay Craft Basics", "desc": "Mold, shape, and paint clay sculptures. Creativity unleashed.", "age": [4,8], "dur": 60, "price": 600, "trial": 199},
                {"title": "Watercolor Explorers", "desc": "Learn brush techniques and color mixing. Paint beautiful landscapes.", "age": [5,10], "dur": 75, "price": 750, "trial": 249},
                {"title": "DIY Greeting Cards", "desc": "Design handmade cards for loved ones. Perfect for gifting.", "age": [4,7], "dur": 60, "price": 500, "trial": 149},
                {"title": "Origami Fun", "desc": "Fold paper into animals and flowers. Patience and precision.", "age": [5,9], "dur": 45, "price": 450, "trial": 99},
                {"title": "Junior Karate", "desc": "Mural painting for young artists. Collaborative art project.", "age": [6,10], "dur": 90, "price": 900, "trial": 299}
            ]
        },
        
        # DANCE (6-12)
        {
            "brand": "Groove Studio", "location": "Golf Course Road",
            "listings": [
                {"title": "Hip-Hop for Kids", "desc": "Learn cool moves and urban dance. High-energy sessions.", "age": [7,14], "dur": 60, "price": 800, "trial": 199},
                {"title": "Bollywood Dance", "desc": "Filmy thumkas and expressions. Dance like a star.", "age": [6,12], "dur": 60, "price": 700, "trial": 199},
                {"title": "Contemporary Dance", "desc": "Fluid movements and emotional expression. Modern dance techniques.", "age": [8,16], "dur": 75, "price": 900, "trial": 299},
                {"title": "Weekend Dance Camp", "desc": "3-day intensive with choreography showcase. Confidence booster.", "age": [7,14], "dur": 120, "price": 1500, "trial": 0},
                {"title": "Latin Dance Basics", "desc": "Salsa and Bachata for kids. Rhythm and coordination.", "age": [9,15], "dur": 60, "price": 850, "trial": 249}
            ]
        },
        
        # CODING & STEM (10-16)
        {
            "brand": "CodeBurst Kids", "location": "Cyber City",
            "listings": [
                {"title": "Scratch Basics", "desc": "Animate characters and build games. Visual programming fun.", "age": [8,12], "dur": 90, "price": 1000, "trial": 299},
                {"title": "Robotics 101", "desc": "Build and program robots. Hands-on electronics.", "age": [10,16], "dur": 120, "price": 1500, "trial": 399},
                {"title": "Python for Teens", "desc": "Text-based coding fundamentals. Build real applications.", "age": [12,18], "dur": 90, "price": 1200, "trial": 349},
                {"title": "AI & Machine Learning", "desc": "Intro to artificial intelligence. Train your own models.", "age": [14,18], "dur": 120, "price": 1800, "trial": 499},
                {"title": "Web Design Workshop", "desc": "HTML, CSS, and website creation. Launch your own site.", "age": [11,17], "dur": 90, "price": 1100, "trial": 299}
            ]
        },
        
        # MARTIAL ARTS (8-18)
        {
            "brand": "Kicks Academy", "location": "Ansal Town",
            "listings": [
                {"title": "Karate Beginner", "desc": "Discipline, focus, and self-defense. Belt progression system.", "age": [6,14], "dur": 60, "price": 800, "trial": 199},
                {"title": "Taekwondo Training", "desc": "Korean martial art with high kicks. Builds flexibility.", "age": [8,16], "dur": 75, "price": 900, "trial": 249},
                {"title": "Self-Defense Camp", "desc": "Practical self-defense techniques. Confidence and safety.", "age": [10,18], "dur": 90, "price": 1000, "trial": 299},
                {"title": "Kickboxing Junior", "desc": "Cardio-intensive striking martial art. Fitness and fun.", "age": [9,15], "dur": 60, "price": 850, "trial": 199},
                {"title": "Brazilian Jiu-Jitsu", "desc": "Grappling and ground fighting. Strategic martial art.", "age": [12,18], "dur": 90, "price": 1100, "trial": 349}
            ]
        },
        
        # FITNESS (18-24)
        {
            "brand": "Fit19", "location": "Sector 29",
            "listings": [
                {"title": "HIIT Cardio", "desc": "High-intensity interval training. Burn calories fast.", "age": [18,24], "dur": 45, "price": 600, "trial": 149},
                {"title": "Yoga Flow", "desc": "Strength, flexibility, and mindfulness. All levels welcome.", "age": [16,24], "dur": 60, "price": 700, "trial": 199},
                {"title": "Zumba Dance Fitness", "desc": "Latin-inspired cardio party. Dance your way fit.", "age": [18,24], "dur": 60, "price": 650, "trial": 149},
                {"title": "Strength Training", "desc": "Weights, resistance, muscle building. Beginner-friendly.", "age": [18,24], "dur": 75, "price": 900, "trial": 249},
                {"title": "Mobility & Stretch", "desc": "Improve flexibility and prevent injury. Recovery-focused.", "age": [16,24], "dur": 45, "price": 500, "trial": 99}
            ]
        }
    ]
    
    all_listings = []
    all_sessions = []
    
    for cat_idx, cat in enumerate(categories):
        partner_info = partners_data[cat_idx]
        
        # Create partner user
        partner_user = {
            "id": str(uuid.uuid4()),
            "role": "partner_owner",
            "name": f"{partner_info['brand']} Owner",
            "email": f"{partner_info['brand'].lower().replace(' ', '.')}@partners.yuno.app",
            "phone": f"+9198{random.randint(10000000, 99999999)}",
            "hashed_password": hash_password("partner123"),
            "whatsapp_opt_in": True,
            "child_profiles": [],
            "kyc_status": "verified",
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(60, 365)),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(partner_user)
        
        # Create partner profile
        partner = {
            "id": str(uuid.uuid4()),
            "owner_user_id": partner_user["id"],
            "brand_name": partner_info['brand'],
            "legal_name": f"{partner_info['brand']} Pvt Ltd",
            "address": f"{partner_info['location']}, Gurgaon",
            "city": "Gurgaon",
            "kyc_status": "verified",
            "commission_percent": 15.0,
            "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(60, 300)),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.partners.insert_one(partner)
        
        # Create listings for this partner
        for listing_info in partner_info['listings']:
            listing_id = str(uuid.uuid4())
            
            # Determine image category
            img_cat = cat["slug"]
            if img_cat == "toddler":
                imgs = MOCK_IMAGES["toddler"]
            elif img_cat == "art":
                imgs = MOCK_IMAGES["art"]
            elif img_cat == "dance":
                imgs = MOCK_IMAGES["dance"]
            elif img_cat == "coding":
                imgs = MOCK_IMAGES["coding"]
            elif img_cat == "martial":
                imgs = MOCK_IMAGES["martial"]
            else:
                imgs = MOCK_IMAGES["fitness"]
            
            listing = {
                "id": listing_id,
                "partner_id": partner["id"],
                "category_id": cat["id"],
                "title": listing_info['title'],
                "description": listing_info['desc'],
                "age_min": listing_info['age'][0],
                "age_max": listing_info['age'][1],
                "duration_minutes": listing_info['dur'],
                "base_price_inr": listing_info['price'],
                "trial_available": listing_info['trial'] > 0,
                "trial_price_inr": listing_info['trial'],
                "tax_percent": 18.0,
                "is_online": random.choice([True, False]),
                "media": imgs,
                "rating_avg": round(random.uniform(4.2, 4.9), 1),
                "rating_count": random.randint(15, 65),
                "status": "active",
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(30, 120)),
                "updated_at": datetime.now(timezone.utc)
            }
            all_listings.append(listing)
            
            # Create sessions for next 14 days
            sessions_per_week = random.choice([4, 5, 6, 7])
            for day_offset in range(14):
                if random.random() < (sessions_per_week / 7):
                    for time_slot in [10, 11, 16, 17]:  # Morning & evening slots
                        if random.random() < 0.5:  # 50% chance for each slot
                            session_start = datetime.now(timezone.utc) + timedelta(days=day_offset, hours=time_slot-5, minutes=30)
                            
                            session = {
                                "id": str(uuid.uuid4()),
                                "listing_id": listing_id,
                                "start_at": session_start,
                                "duration_minutes": listing_info['dur'],
                                "seats_total": random.randint(8, 12),
                                "seats_reserved": 0,
                                "price_override_inr": None,
                                "status": "scheduled",
                                "allow_late_booking_minutes": 60,
                                "created_at": datetime.now(timezone.utc),
                                "updated_at": datetime.now(timezone.utc)
                            }
                            all_sessions.append(session)
    
    await db.listings.insert_many(all_listings)
    print(f"✓ Created {len(all_listings)} listings")
    
    await db.sessions.insert_many(all_sessions)
    print(f"✓ Created {len(all_sessions)} sessions")
    
    # Create bookings for trending data (last 7 days)
    bookings = []
    ratings = []
    
    # Create varied booking history
    for _ in range(80):  # Create 80 bookings
        customer = random.choice(customers)
        listing = random.choice(all_listings)
        
        # Find a past or near-future session for this listing
        listing_sessions = [s for s in all_sessions if s["listing_id"] == listing["id"]]
        if not listing_sessions:
            continue
        
        session = random.choice(listing_sessions)
        
        # Random booking date (last 7 days)
        booked_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
        
        booking = {
            "id": str(uuid.uuid4()),
            "user_id": customer["id"],
            "listing_id": listing["id"],
            "session_id": session["id"],
            "child_profile_name": customer["child_profiles"][0]["name"],
            "child_profile_age": customer["child_profiles"][0]["age"],
            "amount_inr": listing["base_price_inr"],
            "credits_used": 0,
            "booking_status": random.choice(["confirmed", "confirmed", "confirmed", "attended", "cancelled"]),
            "payment_status": "captured",
            "payment_method": random.choice(["razorpay_card", "razorpay_upi", "credit_wallet"]),
            "payment_txn_id": f"txn_{uuid.uuid4().hex[:12]}",
            "booked_at": booked_at,
            "created_at": booked_at,
            "updated_at": datetime.now(timezone.utc)
        }
        bookings.append(booking)
        
        # Update session seats
        session["seats_reserved"] = min(session["seats_reserved"] + 1, session["seats_total"])
        
        # Create ratings for attended bookings
        if booking["booking_status"] == "attended" and random.random() < 0.7:  # 70% leave rating
            rating = {
                "id": str(uuid.uuid4()),
                "user_id": customer["id"],
                "listing_id": listing["id"],
                "booking_id": booking["id"],
                "stars": random.choice([4, 4, 5, 5, 5]),  # Mostly positive
                "comment": random.choice([
                    "Amazing experience! My child loved it.",
                    "Great instructor and well-organized.",
                    "Highly recommend for kids.",
                    "Will definitely book again!",
                    "Good value for money."
                ]),
                "created_at": datetime.now(timezone.utc) - timedelta(days=random.randint(0, 5))
            }
            ratings.append(rating)
    
    if bookings:
        await db.bookings.insert_many(bookings)
        print(f"✓ Created {len(bookings)} bookings")
    
    # Update session seats
    for session in all_sessions:
        await db.sessions.update_one(
            {"id": session["id"]},
            {"$set": {"seats_reserved": session["seats_reserved"]}}
        )
    
    if ratings:
        await db.ratings.insert_many(ratings)
        print(f"✓ Created {len(ratings)} ratings")
    
    print("\n✅ Pilot data seeding complete!")
    print(f"📊 Summary:")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(all_listings)} listings (5 per category)")
    print(f"   - {len(all_sessions)} sessions (14-day window)")
    print(f"   - {len(customers)} customer users")
    print(f"   - {len(bookings)} bookings (last 7 days)")
    print(f"   - {len(ratings)} ratings")
    print(f"   - 1 admin user (admin@yuno.app / admin123)")

if __name__ == "__main__":
    asyncio.run(seed_pilot_data())
