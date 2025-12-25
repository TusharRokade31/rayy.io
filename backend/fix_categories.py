import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

CATEGORY_IMAGES = {
    "dance": [
        "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800",
        "https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800",
        "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800",
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800",
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    ],
    "coding": [
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",
        "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800",
        "https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800",
    ],
    "martial_arts": [
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800",
        "https://images.unsplash.com/photo-1546450664-7d7e768ea4f8?w=800",
        "https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800",
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
    ],
    "toddler_play": [
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800",
        "https://images.unsplash.com/photo-1612036781124-847f8939b154?w=800",
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800",
    ],
}

async def fix_categories_and_images():
    fixes = {
        'Toddler Sensory Play': {'category': 'toddler_play'},
        'Weekend Art Workshop': {'category': 'art'},
        'Junior Karate': {'category': 'martial_arts'},
        'Scratch Basics': {'category': 'coding'},
        'Hip-Hop for Kids': {'category': 'dance'},
        'Contemporary Dance (Teens)': {'category': 'dance'},
        'HIIT & Mobility (19-24)': {'category': 'fitness'},
    }
    
    for title, update_data in fixes.items():
        category = update_data['category']
        images = CATEGORY_IMAGES.get(category, [])
        
        result = await db.listings.update_one(
            {'title': title},
            {'$set': {'category': category, 'images': images}}
        )
        if result.modified_count > 0:
            print(f'✅ {title} -> {category} with {len(images)} images')
    
    client.close()

asyncio.run(fix_categories_and_images())
