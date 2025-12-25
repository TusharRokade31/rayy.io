"""
rayy Credits API Endpoints
Add these to server.py
"""
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:3000')

# ==================== CREDIT WALLET ENDPOINTS ====================

@api_router.get("/wallet")
async def get_customer_wallet(current_user: Dict = Depends(get_current_user)):
    """Get customer credit wallet with balance and recent transactions"""
    user_id = current_user["id"]
    
    # Get or create wallet
    wallet = await db.customer_wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        # Create wallet with welcome bonus
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "balance": 50,
            "lifetime_earned": 50,
            "lifetime_spent": 0,
            "last_activity": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "tier": "silver",
            "status": "active"
        }
        await db.customer_wallets.insert_one(wallet)
        
        # Log welcome bonus
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "transaction_type": "earn",
            "amount": 50,
            "source": "welcome_bonus",
            "description": "Welcome to rayy! Here's your first 50 credits",
            "balance_after": 50,
            "created_at": datetime.now(timezone.utc),
            "metadata": {"reason": "signup_bonus"}
        })
    
    # Get recent transactions (last 10)
    transactions = await db.credit_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    # Calculate expiring credits (180 days old)
    expiry_date = datetime.now(timezone.utc) - timedelta(days=180)
    expiring_soon = datetime.now(timezone.utc) + timedelta(days=7)
    
    expiring_credits = await db.credit_transactions.aggregate([
        {
            "$match": {
                "user_id": user_id,
                "transaction_type": "earn",
                "created_at": {"$lt": expiring_soon, "$gte": expiry_date}
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(length=1)
    
    expiring_amount = expiring_credits[0]["total"] if expiring_credits else 0
    
    return {
        "wallet": wallet,
        "transactions": transactions,
        "expiring_soon": {
            "amount": expiring_amount,
            "days_left": 7
        }
    }

@api_router.get("/wallet/transactions")
async def get_wallet_transactions(
    skip: int = 0,
    limit: int = 20,
    current_user: Dict = Depends(get_current_user)
):
    """Get paginated transaction history"""
    user_id = current_user["id"]
    
    transactions = await db.credit_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    total = await db.credit_transactions.count_documents({"user_id": user_id})
    
    return {
        "transactions": transactions,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/credit-packages")
async def get_credit_packages():
    """Get available credit purchase packages"""
    packages = await db.credit_packages.find(
        {"active": True},
        {"_id": 0}
    ).sort("amount_inr", 1).to_list(length=None)
    
    return {"packages": packages}

@api_router.post("/credit-packages/{package_id}/purchase")
async def purchase_credit_package(
    package_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    Initiate credit package purchase via Razorpay
    Returns Razorpay order details
    """
    user_id = current_user["id"]
    
    # Get package
    package = await db.credit_packages.find_one({"id": package_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Create Razorpay order
    import razorpay
    client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET')))
    
    order_data = {
        "amount": int(package["amount_inr"] * 100),  # Convert to paise
        "currency": "INR",
        "receipt": f"credit_purchase_{str(uuid.uuid4())[:8]}",
        "notes": {
            "user_id": user_id,
            "package_id": package_id,
            "credits": package["credits"],
            "purpose": "credit_purchase"
        }
    }
    
    razorpay_order = client.order.create(data=order_data)
    
    # Store pending transaction
    pending_txn = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "package_id": package_id,
        "razorpay_order_id": razorpay_order["id"],
        "amount_inr": package["amount_inr"],
        "credits": package["credits"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    await db.credit_purchase_pending.insert_one(pending_txn)
    
    return {
        "order_id": razorpay_order["id"],
        "amount": razorpay_order["amount"],
        "currency": razorpay_order["currency"],
        "key_id": os.environ.get('RAZORPAY_KEY_ID'),
        "package": package
    }

@api_router.post("/webhooks/razorpay/credit-purchase")
async def razorpay_credit_webhook(request: Request):
    """
    Razorpay webhook for credit purchase confirmation
    Adds credits to wallet after successful payment
    """
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    # Verify webhook signature
    import razorpay
    client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET')))
    
    try:
        client.utility.verify_webhook_signature(
            body.decode('utf-8'),
            signature,
            os.environ.get('RAZORPAY_WEBHOOK_SECRET')
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    payload = await request.json()
    event = payload.get("event")
    
    if event == "payment.captured":
        payment = payload["payload"]["payment"]["entity"]
        order_id = payment["order_id"]
        
        # Find pending transaction
        pending = await db.credit_purchase_pending.find_one({"razorpay_order_id": order_id}, {"_id": 0})
        if not pending:
            return {"status": "ignored"}
        
        user_id = pending["user_id"]
        credits = pending["credits"]
        
        # Update wallet
        wallet = await db.customer_wallets.find_one({"user_id": user_id}, {"_id": 0})
        new_balance = wallet["balance"] + credits
        
        await db.customer_wallets.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "balance": credits,
                    "lifetime_earned": credits
                },
                "$set": {"last_activity": datetime.now(timezone.utc)}
            }
        )
        
        # Log transaction
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "transaction_type": "purchase",
            "amount": credits,
            "source": "razorpay_payment",
            "description": f"Purchased {pending['package_id']} package",
            "balance_after": new_balance,
            "created_at": datetime.now(timezone.utc),
            "metadata": {
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment["id"],
                "amount_paid_inr": pending["amount_inr"]
            }
        })
        
        # Mark as completed
        await db.credit_purchase_pending.update_one(
            {"razorpay_order_id": order_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc)}}
        )
        
        return {"status": "success", "credits_added": credits}
    
    return {"status": "ignored"}

@api_router.post("/referral/apply")
async def apply_referral_code(
    referral_code: str,
    current_user: Dict = Depends(get_current_user)
):
    """Apply referral code during signup (one-time only)"""
    user_id = current_user["id"]
    
    # Check if user already applied a referral
    existing = await db.referral_tracking.find_one({"referred_id": user_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Referral code already applied")
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    if referrer["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")
    
    # Check referrer's limit (max 5)
    referral_count = await db.referral_tracking.count_documents({
        "referrer_id": referrer["id"],
        "status": "completed"
    })
    
    if referral_count >= 5:
        raise HTTPException(status_code=400, detail="Referrer has reached maximum referrals")
    
    # Create pending referral (will be completed after first booking)
    referral = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_id": user_id,
        "referral_code": referral_code,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "completed_at": None
    }
    await db.referral_tracking.insert_one(referral)
    
    return {
        "message": "Referral code applied! Both you and your friend will earn 150 credits after your first booking.",
        "referrer_name": referrer.get("name", "A friend")
    }

@api_router.get("/referral/my-code")
async def get_my_referral_code(current_user: Dict = Depends(get_current_user)):
    """Get user's referral code and stats"""
    user_id = current_user["id"]
    
    # Get user's referral code
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "referral_code": 1, "name": 1})
    
    # Get referral stats
    total_referrals = await db.referral_tracking.count_documents({"referrer_id": user_id})
    completed_referrals = await db.referral_tracking.count_documents({
        "referrer_id": user_id,
        "status": "completed"
    })
    
    # Get earnings from referrals
    referral_earnings = completed_referrals * 150  # 150 credits per referral
    
    return {
        "referral_code": user.get("referral_code"),
        "total_referrals": total_referrals,
        "completed_referrals": completed_referrals,
        "pending_referrals": total_referrals - completed_referrals,
        "referral_earnings": referral_earnings,
        "remaining_slots": max(0, 5 - completed_referrals),
        "share_url": f"{BASE_URL}/signup?ref={user.get('referral_code')}"
    }
