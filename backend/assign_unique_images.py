"""
Script to assign unique images to each listing
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Comprehensive image pool organized by category
IMAGE_POOL = {
    'dance': [
        'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519308914928-2e6b45de9ac1?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=400&h=300&fit=crop',
    ],
    'art': [
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1666710988451-ba4450498967?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1696527018053-3343b9853505?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/179747/pexels-photo-179747.jpeg?w=400&h=300&fit=crop',
    ],
    'coding': [
        'https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1599666520394-50d845fe09c6?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1603354351149-e97b9124020d?w=400&h=300&fit=crop',
    ],
    'fitness': [
        'https://images.unsplash.com/photo-1649008726820-d90aeb70c32e?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/6972784/pexels-photo-6972784.jpeg?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/3094230/pexels-photo-3094230.jpeg?w=400&h=300&fit=crop',
    ],
    'music': [
        'https://images.unsplash.com/photo-1577877777751-3f1ec20a0715?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/6670750/pexels-photo-6670750.jpeg?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1545583477-da6b6d2b73f6?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/7031286/pexels-photo-7031286.jpeg?w=400&h=300&fit=crop',
    ],
    'martial': [
        'https://images.unsplash.com/photo-1516684991026-4c3032a2b4fd?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1635962005741-a9c4904d110b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1607031767898-5f319512ff1e?w=400&h=300&fit=crop',
    ],
    'karate': [
        'https://images.unsplash.com/photo-1516684991026-4c3032a2b4fd?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1635962005741-a9c4904d110b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1607031767898-5f319512ff1e?w=400&h=300&fit=crop',
    ],
    'cooking': [
        'https://images.unsplash.com/photo-1587973549267-2b59cc923aec?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1587973496572-b5c0f44c554d?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1758347536110-99b5bc7c89cb?w=400&h=300&fit=crop',
    ],
    'swimming': [
        'https://images.unsplash.com/photo-1574744918163-6cef6f4a31b0?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1592484806287-7bc9c8af5405?w=400&h=300&fit=crop',
        'https://images.unsplash.com/flagged/photo-1578467992042-7e2e9650cfbb?w=400&h=300&fit=crop',
    ],
    'sports': [
        'https://images.unsplash.com/photo-1518614368389-5160c0b0de72?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/30637225/pexels-photo-30637225.jpeg?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1592484806287-7bc9c8af5405?w=400&h=300&fit=crop',
    ],
    'toddler': [
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1666710988451-ba4450498967?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/3094230/pexels-photo-3094230.jpeg?w=400&h=300&fit=crop',
    ],
    'drama': [
        'https://images.unsplash.com/photo-1648129021618-d6973da8508b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1667386427340-ea2cbca9ad01?w=400&h=300&fit=crop',
    ],
    'science': [
        'https://images.unsplash.com/photo-1613271752699-ede48a285196?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1633828763399-e29f1cd3f4c1?w=400&h=300&fit=crop',
    ],
    'robotics': [
        'https://images.unsplash.com/photo-1603354351149-e97b9124020d?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1604320233280-75d54bc1c22e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1603354350317-6f7aaa5911c5?w=400&h=300&fit=crop',
    ],
    'outdoor': [
        'https://images.unsplash.com/photo-1732041099662-bc60f3e49274?w=400&h=300&fit=crop',
        'https://images.pexels.com/photos/34596303/pexels-photo-34596303.jpeg?w=400&h=300&fit=crop',
    ],
    'default': [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1588072432836-e10032774350?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1587973549267-2b59cc923aec?w=400&h=300&fit=crop',
    ]
}

# Track used images to ensure uniqueness
used_images = set()

def get_unique_image_for_category(category_slug):
    """Get a unique image for a category that hasn't been used yet"""
    # Try to get from specific category
    if category_slug in IMAGE_POOL:
        available_images = [img for img in IMAGE_POOL[category_slug] if img not in used_images]
        if available_images:
            selected = available_images[0]
            used_images.add(selected)
            return selected
    
    # Fallback to default pool
    available_images = [img for img in IMAGE_POOL['default'] if img not in used_images]
    if available_images:
        selected = available_images[0]
        used_images.add(selected)
        return selected
    
    # If all images used, cycle through again
    if category_slug in IMAGE_POOL:
        return IMAGE_POOL[category_slug][0]
    return IMAGE_POOL['default'][0]

async def assign_images():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🖼️  Starting unique image assignment...")
    
    # Get all categories first
    categories = await db.categories.find({}).to_list(length=None)
    category_map = {cat['id']: cat['slug'] for cat in categories}
    
    # Get all listings
    listings = await db.listings.find({}).to_list(length=None)
    print(f"📊 Found {len(listings)} listings")
    
    updated_count = 0
    
    for listing in listings:
        category_slug = category_map.get(listing.get('category_id'), 'default')
        
        # Get unique image
        unique_image = get_unique_image_for_category(category_slug)
        
        # Update in database
        await db.listings.update_one(
            {"id": listing["id"]},
            {"$set": {"image_url": unique_image}}
        )
        
        print(f"  ✅ {listing.get('title')}: {unique_image}")
        updated_count += 1
    
    print(f"\n✅ Successfully assigned unique images to {updated_count} listings")
    print(f"📸 Total unique images used: {len(used_images)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(assign_images())
