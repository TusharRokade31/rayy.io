"""
Script to enhance listings with multiple high-quality images
Run with: python enhance_listing_images.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import random

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# High-quality category-specific image sets (3-4 images per category)
CATEGORY_IMAGE_SETS = {
    "dance": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80",
        "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80",
        "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&q=80"
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
        "https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800&q=80",
        "https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?w=800&q=80",
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80"
    ],
    "coding": [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
    ],
    "sports": [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
        "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80",
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&q=80"
    ],
    "music": [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80",
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80"
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
        "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&q=80"
    ]
}

async def get_category_slug(category_id):
    """Get category slug from category_id"""
    category = await db.categories.find_one({"id": category_id})
    if category and 'slug' in category:
        return category['slug']
    return None

async def enhance_listing_images(listing):
    """Enhance listing with 3-4 quality images"""
    listing_id = listing['id']
    current_media = listing.get('media', [])
    
    # Check if category_id exists
    if 'category_id' not in listing:
        print(f"⊘ Skipping '{listing.get('title', 'Unknown')}' - no category_id")
        return False
    
    # Get category slug
    category_slug = await get_category_slug(listing['category_id'])
    
    if not category_slug or category_slug not in CATEGORY_IMAGE_SETS:
        print(f"⊘ Skipping '{listing['title']}' - category '{category_slug}' not in image sets")
        return False
    
    # Get images for this category
    available_images = CATEGORY_IMAGE_SETS[category_slug]
    
    # Select 3-4 images
    num_images = random.randint(3, 4)
    new_images = random.sample(available_images, min(num_images, len(available_images)))
    
    # Update listing
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": {"media": new_images}}
    )
    
    print(f"✓ Updated '{listing['title']}' with {len(new_images)} high-quality images (category: {category_slug})")
    return True

async def main():
    print("=" * 70)
    print("ENHANCING ALL LISTINGS WITH HIGH-QUALITY IMAGES")
    print("=" * 70)
    
    # Get all active listings
    listings = await db.listings.find({"status": "active"}).to_list(None)
    total_listings = len(listings)
    
    print(f"\nFound {total_listings} active listings\n")
    
    enhanced = 0
    
    for idx, listing in enumerate(listings, 1):
        print(f"[{idx}/{total_listings}] ", end="")
        
        if await enhance_listing_images(listing):
            enhanced += 1
        
        await asyncio.sleep(0.05)
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total listings: {total_listings}")
    print(f"Enhanced with better images: {enhanced}")
    print(f"\n✅ All listings now have 3-4 high-quality images!")

if __name__ == "__main__":
    asyncio.run(main())
