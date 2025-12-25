"""
Fix listings with missing media/images
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'yuno_db'

# Category-specific media mappings
CATEGORY_MEDIA = {
    "dance": {
        "media": [
            "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad",
            "https://images.unsplash.com/photo-1535525153412-5a42439a210d",
            "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    },
    "art": {
        "media": [
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
            "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
            "https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    },
    "coding": {
        "media": [
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    "karate": {
        "media": [
            "https://images.unsplash.com/photo-1555597673-b21d5c935865",
            "https://images.unsplash.com/photo-1534258936925-c58bed479fcb",
            "https://images.unsplash.com/photo-1606787366850-de6330128bfc"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    "music": {
        "media": [
            "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
            "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
            "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
    },
    "science": {
        "media": [
            "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
            "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8",
            "https://images.unsplash.com/photo-1530587191325-3db32d826c18"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    },
    "chess": {
        "media": [
            "https://images.unsplash.com/photo-1528819622765-d6bcf132f793",
            "https://images.unsplash.com/photo-1529699211952-734e80c4d42b",
            "https://images.unsplash.com/photo-1580541832626-2a7131ee809f"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    "drama": {
        "media": [
            "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf",
            "https://images.unsplash.com/photo-1503095396549-807759245b35",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    "fitness": {
        "media": [
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
            "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    },
    "yoga": {
        "media": [
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
            "https://images.unsplash.com/photo-1599447421416-3414500c6c39"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    },
    "robotics": {
        "media": [
            "https://images.unsplash.com/photo-1546776310-eef45dd6d63c",
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    "toddler": {
        "media": [
            "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
            "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
            "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    "swimming": {
        "media": [
            "https://images.unsplash.com/photo-1519315901367-f34ff9154487",
            "https://images.unsplash.com/photo-1560089000-7433a4ebbd64",
            "https://images.unsplash.com/photo-1530549387789-4c1017266635"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    "pottery": {
        "media": [
            "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261",
            "https://images.unsplash.com/photo-1485846234645-a62644f84728",
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
    },
    "life_skills": {
        "media": [
            "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
            "https://images.unsplash.com/photo-1466637574441-749b8f19452f",
            "https://images.unsplash.com/photo-1543353071-873f17a7a088"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    },
    "origami": {
        "media": [
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
            "https://images.unsplash.com/photo-1452860606245-08befc0ff44b",
            "https://images.unsplash.com/photo-1618172193622-ae2d025f4032"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    "cricket": {
        "media": [
            "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
            "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972",
            "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    "magic": {
        "media": [
            "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
            "https://images.unsplash.com/photo-1533158326339-7f3cf2404354",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7"
        ],
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    }
}

# Default fallback media
DEFAULT_MEDIA = {
    "media": [
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
    ],
    "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
}

async def fix_listing_media():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("🔍 Finding listings without media...")
        
        # Find all listings with empty or missing media/images
        listings = await db.listings.find({
            "$or": [
                {"media": {"$size": 0}},
                {"media": {"$exists": False}},
                {"images": {"$size": 0}},
                {"images": {"$exists": False}}
            ]
        }).to_list(None)
        
        print(f"   Found {len(listings)} listings without proper media")
        print()
        
        fixed_count = 0
        for listing in listings:
            category = listing.get("category", "")
            
            # Get media based on category or use default
            media_data = CATEGORY_MEDIA.get(category, DEFAULT_MEDIA)
            
            # Update the listing
            update_result = await db.listings.update_one(
                {"id": listing["id"]},
                {
                    "$set": {
                        "media": media_data["media"],
                        "video_url": media_data["video_url"]
                    },
                    "$unset": {"images": ""}  # Remove old images field
                }
            )
            
            if update_result.modified_count > 0:
                fixed_count += 1
                print(f"✓ Fixed: {listing['title']} (category: {category})")
        
        print()
        print(f"✅ Fixed {fixed_count} listings with media!")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(fix_listing_media())
