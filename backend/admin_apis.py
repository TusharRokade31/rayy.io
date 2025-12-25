"""
YUNO Admin Panel - Comprehensive Backend APIs
Phase 3 Implementation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import csv
import io

admin_router = APIRouter(prefix="/admin/api", tags=["admin"])

# ============== MODELS ==============

class BookingActionRequest(BaseModel):
    action: str  # cancel, resend, mark_attended, mark_no_show
    reason: Optional[str] = None

class PartnerStatusRequest(BaseModel):
    status: str  # active, suspended

class ConfigUpdateRequest(BaseModel):
    value: Any

class PayoutGenerateRequest(BaseModel):
    period_start: datetime
    period_end: datetime

# ============== HELPER FUNCTIONS ==============

async def log_audit(db, actor_user_id: str, action: str, entity: str, entity_id: str, before: Any, after: Any):
    """Log admin actions to audit trail"""
    audit_entry = {
        "id": str(uuid.uuid4()),
        "actor_user_id": actor_user_id,
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "before": before,
        "after": after,
        "at": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(audit_entry)

def calculate_quality_score(listing: Dict) -> int:
    """Calculate listing quality score (0-100)"""
    checks = [
        bool(listing.get("title")),
        bool(listing.get("age_min")) and bool(listing.get("age_max")),
        bool(listing.get("duration_minutes")),
        bool(listing.get("base_price_inr")),
        bool(listing.get("venue_id")) or bool(listing.get("is_online")),
        len(listing.get("media", [])) >= 3,
        bool(listing.get("lat")) and bool(listing.get("lng")),
        bool(listing.get("cancellation_policy_id")) or listing.get("trial_available") is not None
    ]
    return int((sum(checks) / 8) * 100)

# ============== KPIs & DASHBOARD ==============

@admin_router.get("/kpis")
async def get_kpis(
    from_date: str,
    to_date: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get KPIs for date range"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    # Bookings
    bookings = await db.bookings.find({
        "booked_at": {"$gte": start, "$lt": end}
    }, {"_id": 0}).to_list(10000)
    
    total_bookings = len(bookings)
    
    # GMV
    gmv_inr = sum(b.get("total_inr", 0) for b in bookings)
    credits_used = sum(b.get("credits_used", 0) for b in bookings)
    
    # Attendance
    attended = len([b for b in bookings if b.get("booking_status") == "attended"])
    no_show = len([b for b in bookings if b.get("booking_status") == "no_show"])
    attendance_rate = (attended / (attended + no_show) * 100) if (attended + no_show) > 0 else 0
    
    # Cancellations by window
    cancellations = [b for b in bookings if b.get("booking_status") == "canceled"]
    cancel_6h_plus = 0
    cancel_2h_to_6h = 0
    cancel_under_2h = 0
    
    for cancel in cancellations:
        if cancel.get("canceled_at") and cancel.get("session_id"):
            session = await db.sessions.find_one({"id": cancel["session_id"]}, {"_id": 0})
            if session:
                hours_before = (session["start_at"] - cancel["canceled_at"]).total_seconds() / 3600
                if hours_before >= 6:
                    cancel_6h_plus += 1
                elif hours_before >= 2:
                    cancel_2h_to_6h += 1
                else:
                    cancel_under_2h += 1
    
    # Yesterday comparison
    yesterday_start = start - timedelta(days=1)
    yesterday_bookings = await db.bookings.count_documents({
        "booked_at": {"$gte": yesterday_start, "$lt": start}
    })
    
    delta_bookings = total_bookings - yesterday_bookings
    
    return {
        "bookings_today": total_bookings,
        "delta_vs_yesterday": delta_bookings,
        "gmv_inr": gmv_inr,
        "credits_used": credits_used,
        "attendance_rate": round(attendance_rate, 1),
        "cancellations": {
            "6h_plus": cancel_6h_plus,
            "2h_to_6h": cancel_2h_to_6h,
            "under_2h": cancel_under_2h
        }
    }

@admin_router.get("/top-age-bands")
async def get_top_age_bands(
    from_date: str,
    to_date: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get top age bands"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    start = datetime.fromisoformat(from_date)
    end = datetime.fromisoformat(to_date)
    
    bookings = await db.bookings.find({
        "booked_at": {"$gte": start, "$lt": end}
    }, {"_id": 0}).to_list(10000)
    
    age_bands = {"1-3": 0, "4-6": 0, "7-12": 0, "13-18": 0, "19-24": 0}
    
    for booking in bookings:
        age = booking.get("child_profile_age", 0)
        if 1 <= age <= 3:
            age_bands["1-3"] += 1
        elif 4 <= age <= 6:
            age_bands["4-6"] += 1
        elif 7 <= age <= 12:
            age_bands["7-12"] += 1
        elif 13 <= age <= 18:
            age_bands["13-18"] += 1
        elif 19 <= age <= 24:
            age_bands["19-24"] += 1
    
    return {"age_bands": [{"band": k, "bookings": v} for k, v in age_bands.items()]}

@admin_router.get("/top-listings")
async def get_top_listings(
    limit: int = 5,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get top listings by bookings"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if from_date and to_date:
        start = datetime.fromisoformat(from_date)
        end = datetime.fromisoformat(to_date)
        query["booked_at"] = {"$gte": start, "$lt": end}
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": "$listing_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    
    top = await db.bookings.aggregate(pipeline).to_list(limit)
    
    result = []
    for item in top:
        listing = await db.listings.find_one({"id": item["_id"]}, {"_id": 0})
        if listing:
            result.append({
                "listing_id": item["_id"],
                "title": listing["title"],
                "bookings": item["count"]
            })
    
    return {"listings": result}

# ============== BOOKINGS MANAGEMENT ==============

@admin_router.get("/bookings")
async def get_all_bookings(
    status: Optional[str] = None,
    partner_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all bookings with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["booking_status"] = status
    if from_date and to_date:
        start = datetime.fromisoformat(from_date)
        end = datetime.fromisoformat(to_date)
        query["booked_at"] = {"$gte": start, "$lt": end}
    
    skip = (page - 1) * limit
    bookings = await db.bookings.find(query, {"_id": 0}).sort("booked_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich
    for booking in bookings:
        listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
        if listing:
            booking["listing_title"] = listing["title"]
            partner = await db.partners.find_one({"id": listing["partner_id"]}, {"_id": 0})
            if partner:
                booking["partner_name"] = partner["brand_name"]
        
        session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
        if session:
            booking["session_start"] = session["start_at"]
            # Check if refundable
            now = datetime.now(timezone.utc)
            hours_before = (session["start_at"] - now).total_seconds() / 3600
            booking["refundable"] = hours_before >= 2 and booking["booking_status"] == "confirmed"
    
    total = await db.bookings.count_documents(query)
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@admin_router.post("/bookings/{booking_id}/action")
async def booking_action(
    booking_id: str,
    request: BookingActionRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Perform action on booking"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    before = booking.copy()
    
    if request.action == "cancel":
        # Apply cancellation logic
        session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Calculate refund
        now = datetime.now(timezone.utc)
        hours_before = (session["start_at"] - now).total_seconds() / 3600
        
        refund_pct = 0
        if hours_before >= 6:
            refund_pct = 100
        elif hours_before >= 2:
            refund_pct = 50
        
        refund_amount = booking["total_inr"] * (refund_pct / 100)
        refund_credits = int(booking.get("credits_used", 0) * (refund_pct / 100))
        
        # Release seat
        await db.sessions.update_one({"id": booking["session_id"]}, {"$inc": {"seats_reserved": -1}})
        
        # Refund credits
        if refund_credits > 0:
            await db.wallets.update_one(
                {"user_id": booking["user_id"]},
                {"$inc": {"credits_balance": refund_credits}}
            )
            await db.credit_ledger.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": booking["user_id"],
                "delta": refund_credits,
                "reason": "refund",
                "ref_booking_id": booking_id,
                "created_at": datetime.now(timezone.utc)
            })
        
        # Update booking
        await db.bookings.update_one(
            {"id": booking_id},
            {
                "$set": {
                    "booking_status": "canceled",
                    "canceled_at": datetime.now(timezone.utc),
                    "cancellation_reason": request.reason or "Admin canceled",
                    "refund_amount_inr": refund_amount,
                    "refund_credits": refund_credits
                }
            }
        )
        
        after = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        await log_audit(db, current_user["id"], "booking.cancel", "booking", booking_id, before, after)
        
        return {"message": "Booking canceled", "refund_amount_inr": refund_amount, "refund_credits": refund_credits}
    
    elif request.action == "resend":
        # TODO: Trigger email resend
        await log_audit(db, current_user["id"], "email.resend", "booking", booking_id, {}, {})
        return {"message": "Confirmation email queued"}
    
    elif request.action == "mark_attended":
        await db.bookings.update_one({"id": booking_id}, {"$set": {"booking_status": "attended"}})
        after = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        await log_audit(db, current_user["id"], "booking.attendance", "booking", booking_id, before, after)
        return {"message": "Marked as attended"}
    
    elif request.action == "mark_no_show":
        await db.bookings.update_one({"id": booking_id}, {"$set": {"booking_status": "no_show"}})
        after = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        await log_audit(db, current_user["id"], "booking.attendance", "booking", booking_id, before, after)
        return {"message": "Marked as no-show"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

# ============== USERS MANAGEMENT ==============

@admin_router.get("/users")
async def get_all_users(
    query: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all users with search"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    search_query = {}
    if query:
        search_query = {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"phone": {"$regex": query, "$options": "i"}}
            ]
        }
    
    skip = (page - 1) * limit
    users = await db.users.find(search_query, {"_id": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with booking count
    for user in users:
        booking_count = await db.bookings.count_documents({"user_id": user["id"]})
        user["booking_count"] = booking_count
    
    total = await db.users.count_documents(search_query)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@admin_router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user detail with timeline"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get bookings timeline
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("booked_at", -1).to_list(100)
    
    # Get wallet
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get credit ledger
    ledger = await db.credit_ledger.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return {
        "user": user,
        "bookings": bookings,
        "wallet": wallet,
        "ledger": ledger
    }

# ============== PARTNER MANAGEMENT ==============

@admin_router.get("/partners")
async def get_all_partners(
    status: Optional[str] = None,
    city: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all partners with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["status"] = status
    if city:
        query["city"] = city
    
    skip = (page - 1) * limit
    partners = await db.partners.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with stats
    for partner in partners:
        # Active listings
        active_listings = await db.listings.count_documents({"partner_id": partner["id"], "status": "active"})
        partner["active_listings"] = active_listings
        
        # Week bookings
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0}).to_list(100)
        listing_ids = [l["id"] for l in listings]
        week_bookings = await db.bookings.count_documents({
            "listing_id": {"$in": listing_ids},
            "booked_at": {"$gte": week_ago}
        })
        partner["week_bookings"] = week_bookings
        
        # Quality score
        if listings:
            scores = [calculate_quality_score(l) for l in listings]
            partner["quality_score"] = sum(scores) / len(scores)
        else:
            partner["quality_score"] = 0
    
    total = await db.partners.count_documents(query)
    
    return {
        "partners": partners,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@admin_router.post("/partners/{partner_id}/verify")
async def verify_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Verify partner KYC"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    before = partner.copy()
    
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"kyc_status": "verified", "verification_badges": ["verified", "background_checked"]}}
    )
    
    after = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    await log_audit(db, current_user["id"], "partner.verify", "partner", partner_id, before, after)
    
    return {"message": "Partner verified"}

@admin_router.post("/partners/{partner_id}/status")
async def update_partner_status(
    partner_id: str,
    request: PartnerStatusRequest,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update partner status"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    before = partner.copy()
    
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": request.status}}
    )
    
    after = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    await log_audit(db, current_user["id"], "partner.status_change", "partner", partner_id, before, after)
    
    return {"message": f"Partner {request.status}"}

@admin_router.get("/partners/{partner_id}")
async def get_partner_detail(
    partner_id: str,
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get partner detail"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Get listings
    listings = await db.listings.find({"partner_id": partner_id}, {"_id": 0}).to_list(100)
    
    # Get sessions
    listing_ids = [l["id"] for l in listings]
    sessions = await db.sessions.find({"listing_id": {"$in": listing_ids}}, {"_id": 0}).sort("start_at", -1).limit(50).to_list(50)
    
    return {
        "partner": partner,
        "listings": listings,
        "sessions": sessions
    }

# Continue in next file due to length...
