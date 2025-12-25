"""
Ensure all listings have unique and diverse images
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import random

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = 'yuno_db'

# Large pool of diverse images per category
IMAGE_POOLS = {
    "sports": [
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55",
        "https://images.unsplash.com/photo-1511886929837-354d827aae26",
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68",
        "https://images.unsplash.com/photo-1546519638-68e109498ffc",
        "https://images.unsplash.com/photo-1504450758481-7338eba7524a",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da",
        "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972",
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
        "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67",
        "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0",
        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
        "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1",
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5",
        "https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        "https://images.unsplash.com/photo-1541625602330-2277a4c46182",
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b",
        "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa",
    ],
    "activity": [
        "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf",
        "https://images.unsplash.com/photo-1503095396549-807759245b35",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
        "https://images.unsplash.com/photo-1455390582262-044cdead277a",
        "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
        "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd",
        "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d",
        "https://images.unsplash.com/photo-1466637574441-749b8f19452f",
        "https://images.unsplash.com/photo-1592419044706-39796d40f98c",
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b",
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261",
    ],
    "educational": [
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        "https://images.unsplash.com/photo-1546776310-eef45dd6d63c",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
        "https://images.unsplash.com/photo-1509228468518-180dd4864904",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
        "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8",
        "https://images.unsplash.com/photo-1528819622765-d6bcf132f793",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8",
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1",
    ],
    "playzone": [
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9",
        "https://images.unsplash.com/photo-1587654780291-39c9404d746b",
        "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1",
        "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8",
        "https://images.unsplash.com/photo-1551522435-a13afa10f103",
        "https://images.unsplash.com/photo-1617802690992-15d93263d3a9",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e",
        "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba",
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74",
    ],
    "dance": [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad",
        "https://images.unsplash.com/photo-1535525153412-5a42439a210d",
        "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4",
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434",
        "https://images.unsplash.com/photo-1547153760-18fc86324498",
    ],
    "art": [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
        "https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5",
        "https://images.unsplash.com/photo-1545127398-14699f92334b",
        "https://images.unsplash.com/photo-1513519245088-0e12902e35ca",
    ],
    "coding": [
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159",
    ],
    "music": [
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
        "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae",
    ]
}

async def diversify_images():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    try:
        print("🎨 Diversifying listing images...\n")
        
        listings = await db.listings.find({
            "status": "active",
            "approval_status": "approved"
        }).to_list(None)
        
        print(f"Found {len(listings)} active listings")
        
        updated = 0
        for listing in listings:
            category = listing.get("category", "activity")
            
            # Get image pool for category
            image_pool = IMAGE_POOLS.get(category, IMAGE_POOLS["activity"])
            
            # Randomly select 3-4 unique images
            num_images = random.randint(3, 4)
            new_images = random.sample(image_pool, min(num_images, len(image_pool)))
            
            # Update listing
            await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": {"media": new_images}}
            )
            
            updated += 1
            if updated % 10 == 0:
                print(f"  Updated {updated} listings...")
        
        print(f"\n✅ Diversified images for {updated} listings!")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(diversify_images())
