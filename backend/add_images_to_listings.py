#!/usr/bin/env python3
"""
Add high-quality images to all listings based on their category
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# High-quality Unsplash images by category
CATEGORY_IMAGES = {
    "dance": [
        "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800",  # Kids dancing
        "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800",  # Dance class
        "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800",  # Dance studio
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",  # Art class
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",  # Painting
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",  # Art supplies
    ],
    "coding": [
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",  # Kids coding
        "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800",  # Computer coding
        "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800",  # Programming
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",  # Sports
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",  # Basketball
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800",  # Football
    ],
    "music": [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",  # Music studio
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",  # Piano
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800",  # Guitar
    ],
    "swimming": [
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800",  # Swimming pool
        "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800",  # Swimming
        "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?w=800",  # Pool
    ],
    "chess": [
        "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800",  # Chess board
        "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800",  # Chess pieces
        "https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800",  # Chess game
    ],
    "robotics": [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",  # Robotics
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",  # Robot
        "https://images.unsplash.com/photo-1563968743333-044cef800494?w=800",  # STEM
    ],
    "drama": [
        "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800",  # Theater
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",  # Drama
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",  # Stage
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",  # Yoga
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",  # Fitness
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",  # Workout
    ],
    "martial_arts": [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800",  # Karate
        "https://images.unsplash.com/photo-1546450664-7d7e768ea4f8?w=800",  # Martial arts
        "https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800",  # Karate kid
    ],
    "life-skills": [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",  # Learning
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",  # Group learning
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",  # Workshop
    ],
    "toddler_play": [
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",  # Toddler play
        "https://images.unsplash.com/photo-1612036781124-847f8939b154?w=800",  # Kids playing
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",  # Toddler
    ],
}

# Default images for unlisted categories
DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",  # Kids learning
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800",  # Workshop
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",  # Group activity
]

async def add_images_to_listings():
    """Add images to all listings based on category"""
    
    print("🎨 Adding Images to All Listings\n")
    
    # Get all active listings
    listings = await db.listings.find(
        {"status": "active"},
        {"id": 1, "title": 1, "category": 1, "images": 1}
    ).to_list(500)
    
    updated = 0
    
    for listing in listings:
        listing_id = listing["id"]
        title = listing.get("title", "Unknown")
        category = listing.get("category", "default")
        current_images = listing.get("images", [])
        
        # Skip if already has images
        if current_images and len(current_images) > 0:
            print(f"⏭️  {title[:40]}: Already has {len(current_images)} images")
            continue
        
        # Get images for this category
        category_images = CATEGORY_IMAGES.get(category, DEFAULT_IMAGES)
        
        # Update listing with images
        result = await db.listings.update_one(
            {"id": listing_id},
            {"$set": {"images": category_images}}
        )
        
        if result.modified_count > 0:
            print(f"✅ {title[:40]}: Added {len(category_images)} images ({category})")
            updated += 1
        else:
            print(f"⚠️  {title[:40]}: Failed to update")
    
    print(f"\n🎉 Image Update Complete!")
    print(f"   Updated: {updated} listings")
    print(f"   Total listings: {len(listings)}")
    
    # Verify
    with_images = await db.listings.count_documents({
        "status": "active",
        "images": {"$exists": True, "$ne": []}
    })
    
    without_images = await db.listings.count_documents({
        "status": "active",
        "$or": [
            {"images": {"$exists": False}},
            {"images": []},
            {"images": None}
        ]
    })
    
    print(f"\n📊 Verification:")
    print(f"   With images: {with_images}")
    print(f"   Without images: {without_images}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_images_to_listings())
