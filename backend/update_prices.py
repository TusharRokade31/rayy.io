"""
Script to update listing prices:
- Trial prices: 49 or 99 rupees
- Regular class prices: 149 to 499 rupees
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import random

load_dotenv()

async def update_prices():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🔄 Starting price updates...")
    
    # Get all listings
    listings = await db.listings.find({}).to_list(length=None)
    print(f"📊 Found {len(listings)} listings")
    
    trial_prices = [49, 99]
    regular_prices = [149, 199, 249, 299, 349, 399, 449, 499]
    
    updated_count = 0
    
    for listing in listings:
        update_data = {}
        
        # Update trial price
        if listing.get('trial_available'):
            new_trial_price = random.choice(trial_prices)
            update_data['trial_price_inr'] = new_trial_price
            print(f"  ✅ {listing.get('title')}: trial price → ₹{new_trial_price}")
        
        # Update regular base price
        new_base_price = random.choice(regular_prices)
        update_data['base_price_inr'] = new_base_price
        print(f"  ✅ {listing.get('title')}: base price → ₹{new_base_price}")
        
        # Update in database
        if update_data:
            await db.listings.update_one(
                {"id": listing["id"]},
                {"$set": update_data}
            )
            updated_count += 1
    
    print(f"\n✅ Successfully updated {updated_count} listings")
    print(f"   - Trial prices: ₹49 or ₹99")
    print(f"   - Regular prices: ₹149-₹499")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_prices())
