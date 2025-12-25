import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def add_venue_locations():
    """Add GeoJSON location data to existing venues"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Gurgaon area coordinates (approximate locations for demo venues)
    venue_locations = {
        "DLF Cyber City": {"type": "Point", "coordinates": [77.0880, 28.4942]},  # DLF Cyber City
        "MG Road": {"type": "Point", "coordinates": [77.0826, 28.4595]},  # MG Road area
        "Sector 29": {"type": "Point", "coordinates": [77.0469, 28.4601]},  # Sector 29
        "Golf Course Road": {"type": "Point", "coordinates": [77.0931, 28.4519]},  # Golf Course Road
    }
    
    # Update venues by address pattern
    venues = await db.venues.find({}, {"_id": 0, "id": 1, "name": 1, "address": 1}).to_list(None)
    
    updated_count = 0
    for venue in venues:
        # Match venue to location based on address
        location = None
        address = venue.get("address", "")
        
        if "Cyber City" in address or "Cyber" in address:
            location = venue_locations["DLF Cyber City"]
        elif "MG Road" in address or "MG" in address:
            location = venue_locations["MG Road"]
        elif "Sector 29" in address:
            location = venue_locations["Sector 29"]
        elif "Golf" in address:
            location = venue_locations["Golf Course Road"]
        else:
            # Default to central Gurgaon with slight offset for each venue
            location = {"type": "Point", "coordinates": [77.0826 + (updated_count * 0.01), 28.4595]}
        
        # Update venue
        await db.venues.update_one(
            {"id": venue["id"]},
            {"$set": {"location": location}}
        )
        print(f"✅ Updated {venue['name']}: {location['coordinates']}")
        updated_count += 1
    
    print(f"\n📍 Updated {updated_count} venues with location data")
    
    # Verify
    venues_with_location = await db.venues.count_documents({"location": {"$exists": True}})
    print(f"✅ Total venues with location: {venues_with_location}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_venue_locations())
