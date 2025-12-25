import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import uuid
from dotenv import load_dotenv

load_dotenv()

async def setup_workshops_and_camps():
    """Add workshop and camp listings with new schema fields"""
    
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    print("🚀 Setting up Workshops & Camps...")
    
    # Get a partner_id from existing listing
    existing_listing = await db.listings.find_one({}, {"_id": 0, "partner_id": 1})
    if not existing_listing:
        print("❌ No existing listings found. Creating with placeholder partner_id.")
        partner_id = "default-partner-001"
    else:
        partner_id = existing_listing["partner_id"]
        print(f"✅ Using partner_id: {partner_id[:30]}...")
    
    
    # ========== WORKSHOPS (External Booking) ==========
    workshops = [
        {
            "title": "Startup Basics for Teens",
            "speaker_name": "Ritesh Agarwal",
            "speaker_credentials": "Founder & CEO, OYO Rooms | Youngest Indian Billionaire",
            "description": "Learn the fundamentals of starting your own business from one of India's youngest entrepreneurs. Discover idea validation, MVP building, and scaling strategies.",
            "age_min": 13,
            "age_max": 18,
            "base_price_inr": 799,
            "event_date": datetime.now(timezone.utc) + timedelta(days=18),
            "duration_minutes": 120,
            "seats_total": 50,
            "seats_booked": 35,
            "external_booking_url": "https://example.com/ritesh-workshop",
            "category": "entrepreneurship",
            "media": ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"]
        },
        {
            "title": "Money Management for Teens",
            "speaker_name": "Ankur Warikoo",
            "speaker_credentials": "Entrepreneur, Author | 5M+ Followers",
            "description": "Master the basics of personal finance, saving, investing, and building wealth habits from a young age.",
            "age_min": 10,
            "age_max": 16,
            "base_price_inr": 499,
            "event_date": datetime.now(timezone.utc) + timedelta(days=13),
            "duration_minutes": 90,
            "seats_total": 100,
            "seats_booked": 85,
            "external_booking_url": "https://ankurwarikoo.com/teen-finance",
            "category": "life-skills",
            "media": ["https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800"]
        },
        {
            "title": "Public Speaking Mastery",
            "speaker_name": "Sandeep Maheshwari",
            "speaker_credentials": "Motivational Speaker | 20M+ YouTube Subscribers",
            "description": "Overcome stage fear and learn to speak confidently in front of any audience. Free workshop for students.",
            "age_min": 12,
            "age_max": 18,
            "base_price_inr": 0,
            "event_date": datetime.now(timezone.utc) + timedelta(days=16),
            "duration_minutes": 120,
            "seats_total": 500,
            "seats_booked": 300,
            "external_booking_url": "https://example.com/sandeep-speaking",
            "category": "life-skills",
            "media": ["https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800"]
        },
        {
            "title": "Build Your First Business",
            "speaker_name": "Ghazal Alagh",
            "speaker_credentials": "Co-Founder, Mamaearth | Shark Tank Judge",
            "description": "From idea to execution - learn how to build a sustainable business from scratch with practical insights.",
            "age_min": 14,
            "age_max": 18,
            "base_price_inr": 699,
            "event_date": datetime.now(timezone.utc) + timedelta(days=20),
            "duration_minutes": 90,
            "seats_total": 60,
            "seats_booked": 42,
            "external_booking_url": "https://example.com/ghazal-business",
            "category": "entrepreneurship",
            "media": ["https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800"]
        },
        {
            "title": "Confidence Building Workshop",
            "speaker_name": "Gaur Gopal Das",
            "speaker_credentials": "Life Coach & Motivational Speaker",
            "description": "Help shy kids discover their inner strength and build unshakeable confidence through proven techniques.",
            "age_min": 8,
            "age_max": 14,
            "base_price_inr": 399,
            "event_date": datetime.now(timezone.utc) + timedelta(days=17),
            "duration_minutes": 90,
            "seats_total": 80,
            "seats_booked": 70,
            "external_booking_url": "https://example.com/confidence-workshop",
            "category": "life-skills",
            "media": ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"]
        },
        {
            "title": "AI for Kids - Simplified",
            "speaker_name": "Prateek Narang",
            "speaker_credentials": "Google Software Engineer | Tech Educator",
            "description": "Understand artificial intelligence basics through fun examples and hands-on activities. No coding required!",
            "age_min": 10,
            "age_max": 15,
            "base_price_inr": 599,
            "event_date": datetime.now(timezone.utc) + timedelta(days=15),
            "duration_minutes": 90,
            "seats_total": 50,
            "seats_booked": 38,
            "external_booking_url": "https://example.com/ai-kids",
            "category": "coding",
            "media": ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800"]
        },
        {
            "title": "Game Development Basics",
            "speaker_name": "Rahul Sood",
            "speaker_credentials": "Unity Expert | 10+ Games Published",
            "description": "Create your first game in this hands-on workshop. Learn Unity basics and game design principles.",
            "age_min": 12,
            "age_max": 16,
            "base_price_inr": 799,
            "event_date": datetime.now(timezone.utc) + timedelta(days=19),
            "duration_minutes": 150,
            "seats_total": 40,
            "seats_booked": 32,
            "external_booking_url": "https://example.com/game-dev",
            "category": "coding",
            "media": ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"]
        },
        {
            "title": "Digital Art Fundamentals",
            "speaker_name": "Shruti Merchant",
            "speaker_credentials": "Professional Digital Artist | Adobe Certified",
            "description": "Learn digital painting, illustration, and design basics using industry-standard tools.",
            "age_min": 9,
            "age_max": 14,
            "base_price_inr": 499,
            "event_date": datetime.now(timezone.utc) + timedelta(days=14),
            "duration_minutes": 120,
            "seats_total": 30,
            "seats_booked": 18,
            "external_booking_url": "https://example.com/digital-art",
            "category": "art",
            "media": ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"]
        },
        {
            "title": "Time Management for Students",
            "speaker_name": "Varun Mayya",
            "speaker_credentials": "Entrepreneur | Productivity Expert",
            "description": "Master time management techniques to excel in studies while enjoying hobbies and social life.",
            "age_min": 13,
            "age_max": 18,
            "base_price_inr": 399,
            "event_date": datetime.now(timezone.utc) + timedelta(days=17),
            "duration_minutes": 90,
            "seats_total": 100,
            "seats_booked": 75,
            "external_booking_url": "https://example.com/time-management",
            "category": "life-skills",
            "media": ["https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800"]
        },
        {
            "title": "Leadership Skills Workshop",
            "speaker_name": "Subroto Bagchi",
            "speaker_credentials": "Co-Founder Mindtree | Leadership Guru",
            "description": "Develop leadership qualities and team management skills essential for future success.",
            "age_min": 14,
            "age_max": 18,
            "base_price_inr": 599,
            "event_date": datetime.now(timezone.utc) + timedelta(days=23),
            "duration_minutes": 120,
            "seats_total": 60,
            "seats_booked": 45,
            "external_booking_url": "https://example.com/leadership",
            "category": "life-skills",
            "media": ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800"]
        }
    ]
    
    # ========== CAMPS (rayy Booking) ==========
    camps = [
        {
            "title": "Art & Craft Exploration Camp",
            "description": "Dive into the world of creativity with painting, pottery, origami, and craft projects. Perfect weekend for young artists!",
            "age_min": 6,
            "age_max": 10,
            "base_price_inr": 1499,
            "duration_minutes": 480,  # 2 full days
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=37),
            "capacity": 25,
            "category": "art",
            "media": ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800", "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800"]
        },
        {
            "title": "Coding Bootcamp for Beginners",
            "description": "Learn Scratch programming and build 5 games in 2 days. No prior coding experience needed!",
            "age_min": 7,
            "age_max": 12,
            "base_price_inr": 1799,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=30),
            "capacity": 20,
            "category": "coding",
            "media": ["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"]
        },
        {
            "title": "Theater & Drama Intensive",
            "description": "3-day immersive theater camp covering acting, voice modulation, stage presence, and a final performance.",
            "age_min": 8,
            "age_max": 14,
            "base_price_inr": 2199,
            "duration_minutes": 720,
            "camp_duration_days": 3,
            "event_date": datetime.now(timezone.utc) + timedelta(days=44),
            "capacity": 30,
            "category": "drama",
            "media": ["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800"]
        },
        {
            "title": "Robotics Weekend",
            "description": "Build and program robots using LEGO Mindstorms. Team competitions on day 2!",
            "age_min": 9,
            "age_max": 14,
            "base_price_inr": 2499,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=37),
            "capacity": 18,
            "category": "coding",
            "media": ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800"]
        },
        {
            "title": "Football Skills Camp",
            "description": "Professional coaching covering dribbling, passing, shooting, and game tactics. All skill levels welcome!",
            "age_min": 6,
            "age_max": 12,
            "base_price_inr": 1299,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=30),
            "capacity": 40,
            "category": "sports",
            "media": ["https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800"]
        },
        {
            "title": "Yoga & Mindfulness Retreat",
            "description": "Learn yoga, meditation, and mindfulness techniques for stress management and focus.",
            "age_min": 10,
            "age_max": 16,
            "base_price_inr": 1599,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=37),
            "capacity": 25,
            "category": "fitness",
            "media": ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800"]
        },
        {
            "title": "Science Experiments Camp",
            "description": "Hands-on experiments in physics, chemistry, and biology. 30+ experiments over 3 days!",
            "age_min": 8,
            "age_max": 13,
            "base_price_inr": 2299,
            "duration_minutes": 720,
            "camp_duration_days": 3,
            "event_date": datetime.now(timezone.utc) + timedelta(days=44),
            "capacity": 20,
            "category": "coding",
            "media": ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800"]
        },
        {
            "title": "Outdoor Adventure Camp",
            "description": "Rock climbing, rappelling, camping, and team-building activities. Safety equipment provided.",
            "age_min": 8,
            "age_max": 14,
            "base_price_inr": 2799,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=37),
            "capacity": 30,
            "category": "sports",
            "media": ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"]
        },
        {
            "title": "Music Production Workshop",
            "description": "Learn beat-making, mixing, and music production using professional DAW software.",
            "age_min": 11,
            "age_max": 17,
            "base_price_inr": 1899,
            "duration_minutes": 480,
            "camp_duration_days": 2,
            "event_date": datetime.now(timezone.utc) + timedelta(days=30),
            "capacity": 15,
            "category": "music",
            "media": ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800"]
        },
        {
            "title": "All-Rounder Camp",
            "description": "3-day multi-activity camp: arts, sports, tech, and life skills. Perfect for curious minds!",
            "age_min": 6,
            "age_max": 12,
            "base_price_inr": 2499,
            "duration_minutes": 720,
            "camp_duration_days": 3,
            "event_date": datetime.now(timezone.utc) + timedelta(days=44),
            "capacity": 35,
            "category": "art",
            "media": ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"]
        }
    ]
    
    # Insert workshops
    workshop_count = 0
    for workshop in workshops:
        workshop_doc = {
            "id": str(uuid.uuid4()),
            "partner_id": partner_id,
            "listing_type": "workshop",
            "is_external": True,
            "status": "active",
            "is_online": True,
            "trial_available": False,
            "created_at": datetime.now(timezone.utc),
            **workshop
        }
        
        # Add urgency message based on seats left
        seats_left = workshop["seats_total"] - workshop["seats_booked"]
        if seats_left <= 15:
            workshop_doc["urgency_message"] = f"🔥 Only {seats_left} seats left!"
        elif workshop["seats_booked"] > workshop["seats_total"] * 0.7:
            workshop_doc["urgency_message"] = "⏰ Filling fast!"
        
        await db.listings.insert_one(workshop_doc)
        workshop_count += 1
        print(f"  ✅ Workshop: {workshop['title']}")
    
    # Insert camps
    camp_count = 0
    for camp in camps:
        camp_doc = {
            "id": str(uuid.uuid4()),
            "partner_id": partner_id,
            "listing_type": "camp",
            "is_external": False,
            "status": "active",
            "is_online": False,
            "trial_available": False,
            "created_at": datetime.now(timezone.utc),
            **camp
        }
        
        await db.listings.insert_one(camp_doc)
        camp_count += 1
        print(f"  ✅ Camp: {camp['title']}")
    
    print(f"\n🎉 Successfully created:")
    print(f"   📱 {workshop_count} Workshops (External booking)")
    print(f"   🏕️  {camp_count} Camps (rayy booking)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_workshops_and_camps())
