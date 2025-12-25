"""
Complete script to fix category_ids and add high-quality images to all listings
Run with: python complete_listings_fix.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import random
import re

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Category mapping based on listing title keywords
TITLE_TO_CATEGORY = {
    "dance": ["dance", "bharatanatyam", "kathak", "hip hop", "bollywood", "contemporary"],
    "art": ["art", "craft", "painting", "clay", "pottery", "mandala", "zentangle", "comic", "animation"],
    "coding": ["coding", "scratch", "python", "programming", "web development", "app development", "robotics", "arduino"],
    "sports": ["cricket", "football", "badminton", "tennis", "swimming", "yoga", "table tennis"],
    "music": ["music", "keyboard", "piano", "guitar", "vocal", "drums", "percussion", "carnatic"],
    "fitness": ["fitness", "hiit", "mobility"],
    "toddler": ["toddler", "sensory"],
    "karate": ["karate", "martial arts", "self defense"],
    "life-skills": ["chess", "public speaking", "debate", "mental math", "mathematics", "theatre", "drama", "science experiments"]
}

# Comprehensive high-quality image sets
CATEGORY_IMAGE_SETS = {
    "dance": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80",
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&q=80"
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
        "https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800&q=80",
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80"
    ],
    "coding": [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&q=80"
    ],
    "music": [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80"
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
        "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&q=80"
    ],
    "toddler": [
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
        "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&q=80"
    ],
    "karate": [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80",
        "https://images.unsplash.com/photo-1552308995-2baac1ad5490?w=800&q=80",
        "https://images.unsplash.com/photo-1563633520307-ee082b7d155d?w=800&q=80",
        "https://images.unsplash.com/photo-1576749544152-5944e1b061db?w=800&q=80"
    ],
    "life-skills": [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80"
    ]
}

async def detect_category_from_title(title):
    """Detect category from listing title"""
    title_lower = title.lower()
    
    for category, keywords in TITLE_TO_CATEGORY.items():
        for keyword in keywords:
            if keyword in title_lower:
                # Get category ID from database
                cat = await db.categories.find_one({"slug": category})
                if cat:
                    return category, cat['id']
    
    return None, None

async def fix_missing_category(listing):
    """Fix missing category_id"""
    if 'category_id' in listing and listing['category_id']:
        return False, None
    
    category_slug, category_id = await detect_category_from_title(listing['title'])
    
    if category_id:
        await db.listings.update_one(
            {"id": listing['id']},
            {"$set": {"category_id": category_id}}
        )
        return True, category_slug
    
    return False, None

async def enhance_images(listing, category_slug):
    """Add high-quality images"""
    if not category_slug or category_slug not in CATEGORY_IMAGE_SETS:
        return False
    
    images = CATEGORY_IMAGE_SETS[category_slug]
    num_images = random.randint(3, 4)
    selected_images = random.sample(images, min(num_images, len(images)))
    
    await db.listings.update_one(
        {"id": listing['id']},
        {"$set": {"media": selected_images}}
    )
    
    return True

async def main():
    print("=" * 70)
    print("COMPLETE LISTINGS FIX: Categories + High-Quality Images")
    print("=" * 70)
    
    listings = await db.listings.find({"status": "active"}).to_list(None)
    print(f"\nProcessing {len(listings)} listings...\n")
    
    categories_fixed = 0
    images_updated = 0
    skipped = 0
    
    for idx, listing in enumerate(listings, 1):
        title = listing.get('title', 'Unknown')
        print(f"[{idx}/{len(listings)}] {title}")
        
        # Fix category if missing
        fixed, category_slug = await fix_missing_category(listing)
        if fixed:
            print(f"  ✓ Fixed category → {category_slug}")
            categories_fixed += 1
        else:
            # Get existing category
            if 'category_id' in listing:
                cat = await db.categories.find_one({"id": listing['category_id']})
                category_slug = cat['slug'] if cat else None
        
        # Update images
        if category_slug:
            if await enhance_images(listing, category_slug):
                print(f"  ✓ Added images (category: {category_slug})")
                images_updated += 1
            else:
                print(f"  ⊘ No images available for {category_slug}")
                skipped += 1
        else:
            print(f"  ⊘ Could not determine category")
            skipped += 1
        
        await asyncio.sleep(0.05)
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total listings: {len(listings)}")
    print(f"Categories fixed: {categories_fixed}")
    print(f"Images updated: {images_updated}")
    print(f"Skipped: {skipped}")
    print(f"\n✅ All done! Listings are now complete with categories and images.")

if __name__ == "__main__":
    asyncio.run(main())
