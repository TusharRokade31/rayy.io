#!/usr/bin/env python3
"""
Seed sample booking data for analytics dashboard testing
Creates 15 sample bookings across different dates, partners, and statuses
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
import uuid
import random

# Load environment
load_dotenv()
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

async def seed_analytics_bookings():
    """Create sample bookings for analytics testing"""
    
    print("🚀 Starting analytics data seeding...")
    
    # Get existing data
    print("\n📊 Fetching existing data...")
    
    # Get active listings
    listings = await db.listings.find({"status": "active"}).limit(10).to_list(10)
    if not listings:
        print("❌ No active listings found. Please create listings first.")
        return
    
    print(f"✅ Found {len(listings)} active listings")
    
    # Get customers
    customers = await db.users.find({"role": "customer"}).limit(5).to_list(5)
    if not customers:
        print("❌ No customers found. Creating sample customers...")
        # Create sample customers
        for i in range(3):
            customer = {
                "id": str(uuid.uuid4()),
                "name": f"Sample Customer {i+1}",
                "email": f"customer_{i+1}_analytics@yuno.app",
                "role": "customer",
                "wallet_balance_inr": 1000.0,
                "credit_balance": 50,
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(customer)
            customers.append(customer)
    
    print(f"✅ Found/Created {len(customers)} customers")
    
    # Get sessions for these listings
    listing_ids = [l["id"] for l in listings]
    sessions = await db.sessions.find({
        "listing_id": {"$in": listing_ids},
        "status": "scheduled"
    }).limit(15).to_list(15)
    
    if not sessions:
        print("❌ No scheduled sessions found. Please create sessions first.")
        return
    
    print(f"✅ Found {len(sessions)} scheduled sessions")
    
    # Booking statuses distribution
    statuses = ["confirmed"] * 8 + ["completed"] * 5 + ["cancelled"] * 2
    
    # Payment methods distribution
    payment_methods = ["razorpay_card"] * 10 + ["credits"] * 3 + ["wallet"] * 2
    
    # Date range: last 30 days
    now = datetime.now(timezone.utc)
    
    print("\n💾 Creating sample bookings...")
    
    created_count = 0
    for i in range(15):
        # Select random data
        customer = random.choice(customers)
        session = random.choice(sessions)
        listing = next((l for l in listings if l["id"] == session["listing_id"]), None)
        
        if not listing:
            continue
        
        # Random date in last 30 days
        days_ago = random.randint(1, 30)
        booking_date = now - timedelta(days=days_ago)
        
        # Random booking amount (between listing price ranges)
        base_price = listing.get("base_price_inr", 500)
        booking_amount = random.randint(int(base_price * 0.8), int(base_price * 1.2))
        
        # Determine payment method and amounts
        payment_method = payment_methods[i % len(payment_methods)]
        
        if payment_method == "credits":
            credits_used = random.randint(5, 20)
            total_inr = 0
        elif payment_method == "wallet":
            credits_used = 0
            total_inr = booking_amount
        else:  # razorpay_card
            credits_used = 0
            total_inr = booking_amount
        
        # Create child profile
        child_name = f"Child {random.choice(['Aarav', 'Diya', 'Arjun', 'Ananya', 'Vihaan', 'Saanvi'])}"
        child_age = random.randint(5, 12)
        
        # Create booking
        booking = {
            "id": str(uuid.uuid4()),
            "customer_id": customer["id"],
            "listing_id": listing["id"],
            "session_id": session["id"],
            "child_name": child_name,
            "child_age": child_age,
            "booking_status": statuses[i % len(statuses)],
            "payment_method": payment_method,
            "total_inr": total_inr,
            "credits_used": credits_used,
            "payment_status": "completed",
            "created_at": booking_date,
            "updated_at": booking_date,
            "reschedule_count": 0
        }
        
        # Add attendance status for completed bookings
        if booking["booking_status"] == "completed":
            booking["attendance_status"] = random.choice(["present", "present", "present", "late"])
            booking["payout_eligible"] = booking["attendance_status"] == "present"
        
        # Add cancellation details for cancelled bookings
        if booking["booking_status"] == "cancelled":
            booking["cancelled_at"] = booking_date + timedelta(hours=random.randint(1, 48))
            booking["cancelled_by"] = random.choice(["customer", "partner"])
            booking["refund_amount_inr"] = booking["total_inr"]
            booking["refund_credits"] = booking["credits_used"]
        
        try:
            await db.bookings.insert_one(booking)
            created_count += 1
            
            status_emoji = "✅" if booking["booking_status"] == "confirmed" else "🎯" if booking["booking_status"] == "completed" else "❌"
            print(f"{status_emoji} Booking {i+1}: {booking['booking_status'].upper()} - ₹{booking['total_inr']} / {booking['credits_used']} credits - {booking_date.strftime('%Y-%m-%d')}")
            
        except Exception as e:
            print(f"❌ Error creating booking {i+1}: {e}")
    
    print(f"\n✅ Successfully created {created_count} sample bookings!")
    
    # Update session seat counts
    print("\n🔄 Updating session seat counts...")
    for session in sessions[:created_count]:
        current_reserved = session.get("seats_reserved", 0)
        new_reserved = current_reserved + 1
        
        await db.sessions.update_one(
            {"id": session["id"]},
            {
                "$set": {
                    "seats_reserved": new_reserved,
                    "seats_available": session["seats_total"] - new_reserved
                }
            }
        )
    
    print("✅ Session seat counts updated!")
    
    # Show summary
    print("\n📈 Analytics Data Summary:")
    total_bookings = await db.bookings.count_documents({})
    total_revenue = await db.bookings.aggregate([
        {"$match": {"booking_status": {"$in": ["confirmed", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_inr"}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]["total"] if total_revenue else 0
    
    print(f"   📊 Total Bookings: {total_bookings}")
    print(f"   💰 Total Revenue: ₹{revenue:.2f}")
    print(f"   👥 Total Customers: {len(customers)}")
    print(f"   🏢 Total Listings: {len(listings)}")
    
    print("\n✨ Analytics dashboard is now ready to view with sample data!")
    print("🔗 Visit: http://localhost:3000/admin/analytics")
    print("🔐 Login: admin@yuno.app / admin123")

if __name__ == "__main__":
    asyncio.run(seed_analytics_bookings())
    print("\n✅ Seeding complete!")
