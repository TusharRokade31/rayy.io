#!/usr/bin/env python3
"""
Create sample reviews for listings that have rating counts
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import uuid
import random

load_dotenv()
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Sample review texts
POSITIVE_REVIEWS = [
    "Excellent class! My child absolutely loved it and learned so much.",
    "Great instructor, very patient and knowledgeable. Highly recommend!",
    "My daughter had an amazing time. The class was well-structured and engaging.",
    "Outstanding experience! The teacher was wonderful and my son is excited for the next session.",
    "Perfect for beginners. The instructor made everything easy to understand.",
    "My child has shown significant improvement after just a few classes.",
    "Very professional and organized. Great facility and equipment too!",
    "The best class we've enrolled in so far. Worth every penny!",
    "Fantastic program! My kid is always asking when the next class is.",
    "Highly skilled instructor with great teaching methods. Five stars!"
]

GOOD_REVIEWS = [
    "Good class overall. My child enjoyed it and learned new skills.",
    "Nice experience. The instructor was friendly and helpful.",
    "Solid program. My daughter is enjoying the classes.",
    "Good value for money. My son is having fun and learning.",
    "Pleasant experience. The class met our expectations.",
    "My child likes attending. Good mix of fun and learning.",
    "Decent class with good content. Instructor knows their stuff.",
    "My kid enjoyed it. Looking forward to continuing."
]

NEUTRAL_REVIEWS = [
    "It was okay. Nothing exceptional but not bad either.",
    "Average experience. Could be better but my child still learned something.",
    "Decent class but felt a bit rushed sometimes."
]

async def create_sample_reviews():
    """Create sample reviews for listings with ratings"""
    
    print("📝 Creating sample reviews...")
    
    # Get listings that have rating_count > 0
    listings = await db.listings.find({
        "rating_count": {"$exists": True, "$gt": 0}
    }).to_list(100)
    
    if not listings:
        print("❌ No listings with ratings found")
        return
    
    print(f"✅ Found {len(listings)} listings with ratings")
    
    # Get some customers who can be reviewers
    customers = await db.users.find({"role": "customer"}).limit(20).to_list(20)
    
    if len(customers) < 3:
        print("❌ Not enough customers. Creating sample customers...")
        for i in range(5):
            customer = {
                "id": str(uuid.uuid4()),
                "name": f"Customer {random.choice(['Priya', 'Rahul', 'Ananya', 'Arjun', 'Meera', 'Rohan', 'Sneha', 'Karthik', 'Divya', 'Aditya'])} {random.choice(['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy'])}",
                "email": f"customer_{uuid.uuid4().hex[:8]}@yuno.app",
                "role": "customer",
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(customer)
            customers.append(customer)
    
    print(f"✅ Using {len(customers)} customers as reviewers")
    
    total_reviews_created = 0
    
    for listing in listings:
        target_count = listing.get("rating_count", 0)
        target_avg = listing.get("rating_avg", 4.5)
        
        print(f"\n📚 {listing['title']}")
        print(f"   Target: {target_count} reviews, avg {target_avg}★")
        
        reviews_to_create = []
        
        # Distribute ratings around the average
        for i in range(target_count):
            # Create rating distribution centered on target average
            if target_avg >= 4.5:
                ratings = [5] * 60 + [4] * 30 + [3] * 10
            elif target_avg >= 4.0:
                ratings = [5] * 40 + [4] * 40 + [3] * 15 + [2] * 5
            elif target_avg >= 3.5:
                ratings = [5] * 20 + [4] * 40 + [3] * 30 + [2] * 10
            else:
                ratings = [5] * 10 + [4] * 30 + [3] * 40 + [2] * 15 + [1] * 5
            
            rating = random.choice(ratings)
            
            # Select review text based on rating
            if rating == 5:
                review_text = random.choice(POSITIVE_REVIEWS)
            elif rating == 4:
                review_text = random.choice(GOOD_REVIEWS)
            else:
                review_text = random.choice(NEUTRAL_REVIEWS)
            
            # Random customer
            customer = random.choice(customers)
            
            # Random date in last 90 days
            days_ago = random.randint(1, 90)
            review_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
            
            # Create fake booking ID
            booking_id = str(uuid.uuid4())
            
            review = {
                "id": str(uuid.uuid4()),
                "customer_id": customer["id"],
                "customer_name": customer["name"],
                "booking_id": booking_id,
                "review_type": "listing",
                "target_id": listing["id"],
                "rating": rating,
                "review_text": review_text,
                "status": "approved",  # Auto-approve for sample data
                "created_at": review_date,
                "approved_at": review_date,
                "approved_by": "admin"
            }
            
            reviews_to_create.append(review)
        
        # Insert all reviews for this listing
        if reviews_to_create:
            await db.reviews.insert_many(reviews_to_create)
            total_reviews_created += len(reviews_to_create)
            print(f"   ✅ Created {len(reviews_to_create)} reviews")
    
    print(f"\n✅ Total reviews created: {total_reviews_created}")
    print("\n🎉 Sample reviews added successfully!")
    print("Refresh listing detail pages to see the reviews!")

if __name__ == "__main__":
    asyncio.run(create_sample_reviews())
    print("✅ Script complete!")
