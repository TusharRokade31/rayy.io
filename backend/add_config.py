import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def add_goodwill_config():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Add partner cancel goodwill config
    config = {
        "_id": "partner_cancel_goodwill",
        "type": "credits",
        "amount": 5,
        "description": "Goodwill credit given to customers when partner cancels booking"
    }
    
    # Upsert config
    await db.configs.update_one(
        {"_id": "partner_cancel_goodwill"},
        {"$set": config},
        upsert=True
    )
    
    print("✅ Added partner_cancel_goodwill config")
    
    # Add attendance notes max config
    attendance_config = {
        "_id": "attendance_notes_max",
        "value": 240,
        "description": "Maximum character length for attendance notes"
    }
    
    await db.configs.update_one(
        {"_id": "attendance_notes_max"},
        {"$set": attendance_config},
        upsert=True
    )
    
    print("✅ Added attendance_notes_max config")
    
    # Verify
    configs = await db.configs.find({}).to_list(None)
    print(f"\n📊 Total configs in database: {len(configs)}")
    for config in configs:
        print(f"  - {config.get('_id')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_goodwill_config())
