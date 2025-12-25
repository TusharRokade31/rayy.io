"""
Enrich trial listings with images, detailed content, and reviews
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone, timedelta
import uuid
import random

# Image URLs for different categories
CATEGORY_IMAGES = {
    "dance": [
        "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&h=600&fit=crop"
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&h=600&fit=crop"
    ],
    "coding": [
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=600&fit=crop"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1517836477839-7072aaa8b121?w=800&h=600&fit=crop"
    ],
    "music": [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop"
    ],
    "science": [
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=800&h=600&fit=crop"
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop"
    ],
    "board_games": [
        "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1606503153255-59d6c2d0c2c7?w=800&h=600&fit=crop"
    ],
    "drama": [
        "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=600&fit=crop"
    ],
    "toddler_play": [
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800&h=600&fit=crop"
    ],
    "stem": [
        "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"
    ],
    "life_skills": [
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop"
    ],
    "performing_arts": [
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop"
    ]
}

# Sample review names
REVIEWER_NAMES = [
    "Priya Sharma", "Rahul Mehta", "Anita Desai", "Vikram Singh", "Neha Kapoor",
    "Arjun Patel", "Kavya Reddy", "Rohan Malhotra", "Sneha Iyer", "Amit Kumar",
    "Divya Nair", "Karan Joshi", "Pooja Gupta", "Siddharth Rao", "Meera Menon"
]

async def enrich_listings():
    """Enrich trial listings with images, content, and reviews"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['yuno_db']
    
    try:
        await db.command('ping')
        print("✅ MongoDB connection successful\n")
        
        # Get all trial listings
        trial_listings = await db.listings.find({
            "trial_available": True,
            "listing_type": "class"
        }, {"_id": 0}).to_list(None)
        
        print(f"📊 Found {len(trial_listings)} trial listings to enrich\n")
        
        enriched_count = 0
        
        for listing in trial_listings:
            listing_id = listing['id']
            title = listing['title']
            category = listing.get('category', 'art')
            
            # Get images for category
            images = CATEGORY_IMAGES.get(category, CATEGORY_IMAGES['art'])[:3]
            
            # Enhanced descriptions based on category
            enhanced_content = {
                "description": generate_description(title, category),
                "images": images,
                "equipment_needed": generate_equipment(category),
                "safety_notes": generate_safety_notes(category),
                "learning_outcomes": generate_learning_outcomes(title, category),
                "what_to_bring": generate_what_to_bring(category),
                "class_structure": generate_class_structure(category),
                "instructor_note": generate_instructor_note(category)
            }
            
            # Update listing
            await db.listings.update_one(
                {"id": listing_id},
                {"$set": enhanced_content}
            )
            
            # Add reviews
            await add_reviews(db, listing_id, title)
            
            enriched_count += 1
            print(f"  ✅ {title}: Added images, content, and reviews")
        
        print(f"\n🎉 Enriched {enriched_count} trial listings successfully!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def generate_description(title, category):
    """Generate detailed description"""
    descriptions = {
        "dance": f"{title} is a fun and energetic class designed to get kids moving and grooving. Through structured lessons and creative expression, students will learn fundamental dance techniques, improve their coordination, and build confidence on stage. Our experienced instructors create a supportive environment where every child can shine.",
        "art": f"Unleash your child's creativity in our {title} class! Students will explore various artistic techniques, experiment with different mediums, and create beautiful artwork to take home. This class fosters imagination, fine motor skills, and self-expression in a fun, encouraging atmosphere.",
        "coding": f"{title} introduces young learners to the exciting world of programming. Through hands-on projects and interactive lessons, kids will learn to think logically, solve problems creatively, and build their own digital creations. No prior experience needed - just curiosity and enthusiasm!",
        "sports": f"Build strength, teamwork, and sportsmanship in our {title} program. Professional coaches guide students through skill-building exercises, game strategies, and friendly competition. This class promotes physical fitness, discipline, and a lifelong love of sports.",
        "music": f"Discover the joy of music in our {title} class! Students will learn proper technique, music theory basics, and play songs they love. Whether your child is a beginner or has some experience, our patient instructors will help them reach their musical goals.",
        "science": f"{title} brings science to life with exciting experiments and hands-on discoveries. Young scientists will explore core concepts through interactive activities, learn the scientific method, and develop critical thinking skills. Safety and fun are our top priorities!",
        "fitness": f"Our {title} class promotes healthy habits through fun physical activities. Kids will improve their flexibility, balance, and body awareness while learning mindfulness techniques. This class is perfect for building a strong foundation for lifelong wellness.",
    }
    return descriptions.get(category, f"Join our engaging {title} class where students learn, grow, and have fun! Expert instructors guide participants through structured lessons designed to develop skills, boost confidence, and create lasting friendships.")

def generate_equipment(category):
    """Generate equipment needed"""
    equipment = {
        "dance": "Comfortable clothes, indoor shoes or bare feet, water bottle",
        "art": "All art supplies provided. Just bring creativity!",
        "coding": "Laptop or tablet provided. Bring a notebook for ideas",
        "sports": "Athletic wear, indoor/outdoor shoes (depending on location), water bottle",
        "music": "Instrument provided for class. Bring sheet music if available",
        "science": "Safety goggles and lab coat provided. Wear comfortable clothes",
        "fitness": "Yoga mat provided. Wear comfortable athletic clothes, bring water"
    }
    return equipment.get(category, "All materials provided. Wear comfortable clothes and bring water")

def generate_safety_notes(category):
    """Generate safety notes"""
    safety = {
        "dance": "Proper warm-up and cool-down included. Instructor certified in first aid.",
        "sports": "All activities supervised. Safety equipment provided. Emergency plan in place.",
        "science": "Experiments conducted under supervision. Non-toxic materials only. Safety gear mandatory.",
        "coding": "Age-appropriate content. No personal information shared online. Screen time monitored.",
        "music": "Hearing protection available. Instruments sanitized. Proper posture emphasized.",
        "fitness": "Modifications provided for all fitness levels. Instructor monitors form and technique."
    }
    return safety.get(category, "Trained instructors ensure safe environment. First aid certified staff on site. Clear emergency procedures.")

def generate_learning_outcomes(title, category):
    """Generate learning outcomes"""
    outcomes = {
        "dance": "Master basic dance moves • Improve rhythm and coordination • Perform with confidence • Develop stage presence",
        "art": "Explore multiple art techniques • Create original artwork • Understand color theory • Express creativity",
        "coding": "Write basic programs • Understand coding logic • Build interactive projects • Problem-solving skills",
        "sports": "Master fundamental skills • Understand game rules • Teamwork and sportsmanship • Physical fitness",
        "music": "Read basic music notation • Play scales and songs • Develop rhythm • Music appreciation",
        "science": "Conduct experiments safely • Understand scientific method • Make observations • Draw conclusions",
        "fitness": "Improve flexibility • Learn breathing techniques • Build strength • Practice mindfulness"
    }
    return outcomes.get(category, "Develop new skills • Build confidence • Make friends • Have fun learning")

def generate_what_to_bring(category):
    """Generate what to bring"""
    bring = {
        "dance": "Change of clothes, Hair tie (for long hair), Positive attitude!",
        "art": "Apron or old shirt (can get messy!), Enthusiasm for creativity",
        "coding": "USB drive to save projects, Ideas for your dream app/game",
        "sports": "Athletic shoes with good grip, Extra pair of socks, Snack for after class",
        "music": "Personal instrument if you have one, Music you'd like to learn",
        "science": "Notebook for observations, Closed-toe shoes required",
        "fitness": "Towel for after class, Comfortable clothes, Open mind"
    }
    return bring.get(category, "Water bottle, Positive attitude, Eagerness to learn")

def generate_class_structure(category):
    """Generate class structure"""
    structure = {
        "dance": "Warm-up (10 min) • Technique practice (20 min) • Choreography learning (20 min) • Cool-down & stretch (10 min)",
        "art": "Introduction & inspiration (10 min) • Technique demonstration (15 min) • Hands-on creation (40 min) • Sharing & cleanup (10 min)",
        "coding": "Concept introduction (10 min) • Live coding demo (15 min) • Hands-on project (35 min) • Showcase & Q&A (10 min)",
        "sports": "Warm-up exercises (10 min) • Skill drills (20 min) • Game play (25 min) • Cool-down & feedback (5 min)",
        "music": "Warm-up exercises (5 min) • Technique practice (20 min) • Song learning (30 min) • Performance practice (10 min)",
        "science": "Safety briefing (5 min) • Experiment introduction (10 min) • Hands-on activity (40 min) • Discussion & cleanup (10 min)",
        "fitness": "Gentle warm-up (10 min) • Main practice (30 min) • Relaxation exercises (10 min) • Closing meditation (5 min)"
    }
    return structure.get(category, "Introduction (10 min) • Main activity (40 min) • Practice & play (20 min) • Wrap-up (5 min)")

def generate_instructor_note(category):
    """Generate instructor note"""
    notes = [
        "Our instructors are passionate about creating a welcoming environment where every student feels valued and encouraged to participate at their own pace.",
        "We believe in making learning fun! Each class is designed to keep kids engaged while building real skills they'll use for years to come.",
        "Safety and fun go hand in hand. Our certified instructors ensure that every student has a positive, memorable experience.",
        "We celebrate every achievement, big or small. Your child will leave each class feeling proud and excited for the next one!",
        "Our small class sizes ensure personalized attention so every student gets the support they need to succeed."
    ]
    return random.choice(notes)

async def add_reviews(db, listing_id, title):
    """Add reviews for a listing"""
    num_reviews = random.randint(8, 20)
    
    review_templates = [
        "My child absolutely loves this class! The instructor is patient and engaging.",
        "Great experience! {name} has shown so much improvement in just a few weeks.",
        "Highly recommend! The teaching style is perfect for kids and they have so much fun.",
        "Excellent class with amazing instructors. My daughter looks forward to it every week!",
        "Best decision we made! {name} has gained so much confidence and skill.",
        "Wonderful program! The kids are always excited and learn so much each session.",
        "Five stars! The instructor really knows how to connect with children and make learning fun.",
        "Our son has made great progress and made new friends too. Highly recommended!",
        "Outstanding class! Professional instructors and a well-structured curriculum.",
        "Amazing experience! {name} can't stop talking about what they learned in class."
    ]
    
    for _ in range(num_reviews):
        reviewer_name = random.choice(REVIEWER_NAMES)
        review_text = random.choice(review_templates).format(name=reviewer_name.split()[0])
        rating = random.choice([4.0, 4.5, 5.0, 5.0, 5.0])  # Weighted towards higher ratings
        
        days_ago = random.randint(1, 90)
        created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
        
        review = {
            "id": str(uuid.uuid4()),
            "listing_id": listing_id,
            "user_name": reviewer_name,
            "rating": rating,
            "comment": review_text,
            "created_at": created_at,
            "helpful_count": random.randint(0, 15)
        }
        
        await db.reviews.insert_one(review)

if __name__ == "__main__":
    print("="*60)
    print("  ENRICHING TRIAL LISTINGS")
    print("="*60)
    print()
    
    asyncio.run(enrich_listings())
