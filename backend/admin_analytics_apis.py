from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from collections import defaultdict
import jwt
import os

router = APIRouter()

# This will be injected from server.py
db = None
security = HTTPBearer()

# JWT Config (same as main server)
JWT_SECRET = os.environ.get('JWT_SECRET', 'yuno_super_secret_change_in_production_2025')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

def init_router(database, auth_func):
    """Initialize router with database and auth function from main app"""
    global db
    db = database

async def get_current_user_analytics(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Local authentication function for analytics endpoints"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== OVERVIEW METRICS ==========

@router.get("/admin/analytics/overview")
async def get_overview_metrics(
    period: str = "30d",  # 7d, 30d, 90d, 1y
    current_user: Dict = Depends(get_current_user_analytics)
):
    """Get high-level overview metrics"""
    # Check admin authorization
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:  # 1y
        start_date = now - timedelta(days=365)
    
    # Total active listings
    total_listings = await db.listings.count_documents({"status": "active"})
    
    # Total partners
    total_partners = await db.users.count_documents({"role": "partner"})
    active_partners = await db.users.count_documents({
        "role": "partner",
        "last_login": {"$gte": start_date}
    })
    
    # Total customers
    total_customers = await db.users.count_documents({"role": "customer"})
    
    # Bookings in period
    bookings_in_period = await db.bookings.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    # Revenue in period
    revenue_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total_inr"},
            "total_credits_used": {"$sum": "$credits_used"}
        }}
    ]
    revenue_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    total_credits_used = revenue_result[0]["total_credits_used"] if revenue_result else 0
    
    # Growth calculations (compare with previous period)
    prev_start = start_date - (now - start_date)
    prev_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": prev_start, "$lt": start_date}
    })
    
    booking_growth = ((bookings_in_period - prev_bookings) / prev_bookings * 100) if prev_bookings > 0 else 0
    
    return {
        "period": period,
        "total_listings": total_listings,
        "total_partners": total_partners,
        "active_partners": active_partners,
        "total_customers": total_customers,
        "bookings_in_period": bookings_in_period,
        "booking_growth": round(booking_growth, 1),
        "total_revenue": round(total_revenue, 2),
        "total_credits_used": total_credits_used,
        "avg_booking_value": round(total_revenue / bookings_in_period, 2) if bookings_in_period > 0 else 0
    }

# ========== PARTNER PERFORMANCE ==========

@router.get("/admin/analytics/partner-performance")
async def get_partner_performance(
    period: str = "30d",
    sort_by: str = "revenue",  # revenue, bookings, rating
    current_user: Dict = Depends(get_current_user_analytics)
):
    """Get partner performance metrics"""
    # Check admin authorization
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=365)
    
    # Aggregate bookings by partner
    pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$lookup": {
            "from": "listings",
            "localField": "listing_id",
            "foreignField": "id",
            "as": "listing"
        }},
        {"$unwind": "$listing"},
        {"$group": {
            "_id": "$listing.partner_id",
            "total_bookings": {"$sum": 1},
            "total_revenue": {"$sum": "$total_inr"},
            "total_credits": {"$sum": "$credits_used"}
        }},
        {"$sort": {
            "total_revenue" if sort_by == "revenue" else "total_bookings": -1
        }},
        {"$limit": 20}
    ]
    
    partner_stats = await db.bookings.aggregate(pipeline).to_list(20)
    
    # Enrich with partner details
    for stat in partner_stats:
        partner = await db.users.find_one(
            {"id": stat["_id"]},
            {"_id": 0, "name": 1, "email": 1, "badges": 1}
        )
        if partner:
            stat["partner_name"] = partner.get("name", "Unknown")
            stat["partner_email"] = partner.get("email", "")
            stat["badges"] = partner.get("badges", [])
        
        # Get listing count
        listing_count = await db.listings.count_documents({
            "partner_id": stat["_id"],
            "status": "active"
        })
        stat["active_listings"] = listing_count
        
        # Calculate avg per booking
        stat["avg_booking_value"] = round(stat["total_revenue"] / stat["total_bookings"], 2) if stat["total_bookings"] > 0 else 0
    
    return {
        "period": period,
        "partners": partner_stats
    }

# ========== FINANCIAL ANALYTICS ==========

@router.get("/admin/analytics/financial")
async def get_financial_analytics(
    period: str = "30d",
    current_user: Dict = Depends(get_current_user_analytics)
):
    """Get financial analytics"""
    # Check admin authorization
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
        group_format = "%Y-%m-%d"
    elif period == "30d":
        start_date = now - timedelta(days=30)
        group_format = "%Y-%m-%d"
    elif period == "90d":
        start_date = now - timedelta(days=90)
        group_format = "%Y-W%U"
    else:
        start_date = now - timedelta(days=365)
        group_format = "%Y-%m"
    
    # Revenue over time
    revenue_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$group": {
            "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
            "revenue": {"$sum": "$total_inr"},
            "bookings": {"$sum": 1},
            "credits_used": {"$sum": "$credits_used"}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    revenue_over_time = await db.bookings.aggregate(revenue_pipeline).to_list(100)
    
    # Revenue by category
    category_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$lookup": {
            "from": "listings",
            "localField": "listing_id",
            "foreignField": "id",
            "as": "listing"
        }},
        {"$unwind": "$listing"},
        {"$group": {
            "_id": "$listing.category",
            "revenue": {"$sum": "$total_inr"},
            "bookings": {"$sum": 1}
        }},
        {"$sort": {"revenue": -1}}
    ]
    
    revenue_by_category = await db.bookings.aggregate(category_pipeline).to_list(20)
    
    # Payment method breakdown
    payment_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$group": {
            "_id": {
                "inr": {"$cond": [{"$gt": ["$total_inr", 0]}, "INR", None]},
                "credits": {"$cond": [{"$gt": ["$credits_used", 0]}, "Credits", None]}
            },
            "count": {"$sum": 1},
            "total_inr": {"$sum": "$total_inr"},
            "total_credits": {"$sum": "$credits_used"}
        }}
    ]
    
    # Simplified: Count INR vs Credits bookings
    inr_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": start_date},
        "total_inr": {"$gt": 0},
        "booking_status": {"$in": ["confirmed", "completed"]}
    })
    
    credit_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": start_date},
        "credits_used": {"$gt": 0},
        "booking_status": {"$in": ["confirmed", "completed"]}
    })
    
    payment_breakdown = [
        {"method": "INR", "count": inr_bookings},
        {"method": "Credits", "count": credit_bookings}
    ]
    
    # Total metrics
    total_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total_inr"},
            "total_bookings": {"$sum": 1},
            "avg_booking_value": {"$avg": "$total_inr"}
        }}
    ]
    
    totals = await db.bookings.aggregate(total_pipeline).to_list(1)
    total_metrics = totals[0] if totals else {
        "total_revenue": 0,
        "total_bookings": 0,
        "avg_booking_value": 0
    }
    
    return {
        "period": period,
        "revenue_over_time": revenue_over_time,
        "revenue_by_category": revenue_by_category,
        "payment_breakdown": payment_breakdown,
        "total_revenue": round(total_metrics.get("total_revenue", 0), 2),
        "total_bookings": total_metrics.get("total_bookings", 0),
        "avg_booking_value": round(total_metrics.get("avg_booking_value", 0), 2)
    }

# ========== BOOKING ANALYTICS ==========

@router.get("/admin/analytics/bookings")
async def get_booking_analytics(
    period: str = "30d",
    current_user: Dict = Depends(get_current_user_analytics)
):
    """Get booking analytics"""
    # Check admin authorization
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
        group_format = "%Y-%m-%d"
    elif period == "30d":
        start_date = now - timedelta(days=30)
        group_format = "%Y-%m-%d"
    elif period == "90d":
        start_date = now - timedelta(days=90)
        group_format = "%Y-W%U"
    else:
        start_date = now - timedelta(days=365)
        group_format = "%Y-%m"
    
    # Bookings over time
    bookings_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
            "total": {"$sum": 1},
            "confirmed": {"$sum": {"$cond": [{"$eq": ["$booking_status", "confirmed"]}, 1, 0]}},
            "completed": {"$sum": {"$cond": [{"$eq": ["$booking_status", "completed"]}, 1, 0]}},
            "cancelled": {"$sum": {"$cond": [{"$eq": ["$booking_status", "cancelled"]}, 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    bookings_over_time = await db.bookings.aggregate(bookings_pipeline).to_list(100)
    
    # Status breakdown
    status_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": "$booking_status",
            "count": {"$sum": 1}
        }}
    ]
    
    status_breakdown = await db.bookings.aggregate(status_pipeline).to_list(10)
    
    # Top listings by bookings
    top_listings_pipeline = [
        {"$match": {
            "created_at": {"$gte": start_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        }},
        {"$group": {
            "_id": "$listing_id",
            "bookings": {"$sum": 1},
            "revenue": {"$sum": "$total_inr"}
        }},
        {"$sort": {"bookings": -1}},
        {"$limit": 10}
    ]
    
    top_listings_data = await db.bookings.aggregate(top_listings_pipeline).to_list(10)
    
    # Enrich with listing details
    for item in top_listings_data:
        listing = await db.listings.find_one(
            {"id": item["_id"]},
            {"_id": 0, "title": 1, "category": 1}
        )
        if listing:
            item["listing_title"] = listing.get("title", "Unknown")
            item["category"] = listing.get("category", "")
    
    # Peak booking times (hour of day)
    peak_times_pipeline = [
        {"$match": {"created_at": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$hour": "$created_at"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    peak_times = await db.bookings.aggregate(peak_times_pipeline).to_list(24)
    
    # Conversion rate (sessions viewed vs booked)
    total_sessions = await db.sessions.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    total_bookings = await db.bookings.count_documents({
        "created_at": {"$gte": start_date}
    })
    
    conversion_rate = round((total_bookings / total_sessions * 100), 2) if total_sessions > 0 else 0
    
    return {
        "period": period,
        "bookings_over_time": bookings_over_time,
        "status_breakdown": status_breakdown,
        "top_listings": top_listings_data,
        "peak_times": peak_times,
        "conversion_rate": conversion_rate,
        "total_bookings": total_bookings
    }
