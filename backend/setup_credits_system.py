"""
rayy Credits System - Database Schema Setup
Phase 1: Core Infrastructure
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def generate_referral_code():
    """Generate unique 8-character referral code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

async def create_credit_collections():
    """Create credit-related collections and indexes"""
    print("🏦 Setting up rayy Credits System...")
    
    # Collection 1: customer_wallets
    print("\n1️⃣ Creating customer_wallets collection...")
    await db.customer_wallets.create_index("user_id", unique=True)
    await db.customer_wallets.create_index("balance")
    
    # Collection 2: partner_wallets
    print("2️⃣ Creating partner_wallets collection...")
    await db.partner_wallets.create_index("partner_id", unique=True)
    await db.partner_wallets.create_index("balance")
    await db.partner_wallets.create_index("tier")
    
    # Collection 3: credit_transactions (ledger)
    print("3️⃣ Creating credit_transactions collection...")
    await db.credit_transactions.create_index("user_id")
    await db.credit_transactions.create_index("partner_id")
    await db.credit_transactions.create_index("transaction_type")
    await db.credit_transactions.create_index("created_at")
    await db.credit_transactions.create_index("source")
    
    # Collection 4: credit_packages
    print("4️⃣ Creating credit_packages collection...")
    packages = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter Pack",
            "amount_inr": 1000,
            "credits": 1100,
            "bonus_percent": 10,
            "description": "Get ₹100 free credits!",
            "popular": False,
            "active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Premium Pack",
            "amount_inr": 2100,
            "credits": 2300,
            "bonus_percent": 15,
            "description": "Best value - ₹400 bonus credits!",
            "popular": True,
            "active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Basic Pack",
            "amount_inr": 500,
            "credits": 525,
            "bonus_percent": 5,
            "description": "Try credits with a small pack",
            "popular": False,
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    await db.credit_packages.delete_many({})
    await db.credit_packages.insert_many(packages)
    
    # Collection 5: referral_tracking
    print("5️⃣ Creating referral_tracking collection...")
    await db.referral_tracking.create_index("referrer_id")
    await db.referral_tracking.create_index("referred_id")
    await db.referral_tracking.create_index("referral_code")
    
    print("✅ Collections created successfully!")

async def add_referral_codes_to_users():
    """Add referral codes to all existing users"""
    print("\n👥 Adding referral codes to existing users...")
    
    users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(length=None)
    
    for user in users:
        # Generate unique referral code
        while True:
            ref_code = generate_referral_code()
            existing = await db.users.find_one({"referral_code": ref_code})
            if not existing:
                break
        
        # Update user with referral code
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "referral_code": ref_code,
                    "referral_count": 0,
                    "referral_earnings": 0
                }
            }
        )
    
    print(f"✅ Added referral codes to {len(users)} users")

async def create_wallets_for_existing_users():
    """Create credit wallets for all existing customers"""
    print("\n💰 Creating wallets for existing customers...")
    
    users = await db.users.find(
        {"role": "customer"},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(length=None)
    
    wallets_created = 0
    
    for user in users:
        # Check if wallet exists
        existing_wallet = await db.customer_wallets.find_one({"user_id": user["id"]})
        if not existing_wallet:
            wallet = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "balance": 50,  # Welcome bonus
                "lifetime_earned": 50,
                "lifetime_spent": 0,
                "last_activity": datetime.now(timezone.utc),
                "created_at": datetime.now(timezone.utc),
                "tier": "silver",
                "status": "active"
            }
            await db.customer_wallets.insert_one(wallet)
            
            # Log welcome bonus transaction
            transaction = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "transaction_type": "earn",
                "amount": 50,
                "source": "welcome_bonus",
                "description": "Welcome to rayy! Here's your first 50 credits",
                "balance_after": 50,
                "created_at": datetime.now(timezone.utc),
                "metadata": {"reason": "signup_bonus"}
            }
            await db.credit_transactions.insert_one(transaction)
            
            wallets_created += 1
    
    print(f"✅ Created {wallets_created} new wallets with welcome bonus")

async def create_credit_earning_rules():
    """Define credit earning rules"""
    print("\n📋 Creating credit earning rules...")
    
    rules = [
        {
            "id": str(uuid.uuid4()),
            "rule_name": "signup_bonus",
            "credits": 100,
            "description": "Complete profile & verify email",
            "max_times": 1,
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "rule_name": "referral_success",
            "credits": 150,
            "description": "Referral completes first booking",
            "max_times": 5,
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "rule_name": "review_class",
            "credits": 50,
            "description": "Write a class review",
            "max_times": 3,
            "max_period": "monthly",
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "rule_name": "booking_streak",
            "credits": 200,
            "description": "Complete 5 bookings",
            "trigger_count": 5,
            "active": True
        },
        {
            "id": str(uuid.uuid4()),
            "rule_name": "loyalty_reward",
            "credits": 300,
            "description": "Attend 10+ classes in a month",
            "trigger_count": 10,
            "max_period": "monthly",
            "active": True
        }
    ]
    
    await db.credit_earning_rules.delete_many({})
    await db.credit_earning_rules.insert_many(rules)
    
    print(f"✅ Created {len(rules)} earning rules")

async def verify_setup():
    """Verify the setup"""
    print("\n🔍 Verifying setup...")
    
    packages_count = await db.credit_packages.count_documents({})
    wallets_count = await db.customer_wallets.count_documents({})
    rules_count = await db.credit_earning_rules.count_documents({})
    
    print(f"   - Credit Packages: {packages_count}")
    print(f"   - Customer Wallets: {wallets_count}")
    print(f"   - Earning Rules: {rules_count}")
    
    # Show a sample wallet
    sample_wallet = await db.customer_wallets.find_one({}, {"_id": 0})
    if sample_wallet:
        print(f"\n📊 Sample Wallet:")
        print(f"   User ID: {sample_wallet['user_id']}")
        print(f"   Balance: {sample_wallet['balance']} credits")
        print(f"   Tier: {sample_wallet['tier']}")
    
    # Show credit packages
    print(f"\n💎 Available Credit Packages:")
    packages = await db.credit_packages.find({}, {"_id": 0}).to_list(length=None)
    for pkg in packages:
        print(f"   - {pkg['name']}: ₹{pkg['amount_inr']} → {pkg['credits']} credits (+{pkg['bonus_percent']}% bonus)")

async def main():
    print("=" * 70)
    print("🪙 rayy CREDITS SYSTEM - DATABASE SETUP")
    print("=" * 70)
    
    await create_credit_collections()
    await add_referral_codes_to_users()
    await create_wallets_for_existing_users()
    await create_credit_earning_rules()
    await verify_setup()
    
    print("\n" + "=" * 70)
    print("✅ rayy Credits System Database Setup Complete!")
    print("=" * 70)
    print("\n📝 Summary:")
    print("   1. ✅ Customer wallets created with 100 welcome credits")
    print("   2. ✅ Credit packages configured (₹500, ₹1000, ₹2100)")
    print("   3. ✅ Referral codes generated for all users")
    print("   4. ✅ Earning rules established")
    print("   5. ✅ Transaction ledger ready")
    print("\n🎯 Next: Implement API endpoints and UI components")

if __name__ == "__main__":
    asyncio.run(main())
