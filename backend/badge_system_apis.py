"""
Badge Management System for rayy
Handles badge assignment and automatic badge updates based on criteria
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime, timezone, timedelta

router = APIRouter()

# Will be injected from server.py
db = None
get_current_user = None

def init_router(database, auth_func):
    """Initialize router with database and auth function"""
    global db, get_current_user
    db = database
    get_current_user = auth_func

# Badge types and their criteria
BADGE_TYPES = {
    "verified": {
        "name": "Verified by rayy",
        "icon": "✓",
        "color": "#10b981",
        "description": "Verified for quality, safety, and credentials",
        "assignment": "manual",  # Admin assigns
        "priority": 1  # Highest priority for display
    },
    "top_rated": {
        "name": "Top Rated",
        "icon": "⭐",
        "color": "#f59e0b",
        "description": "4.5+ rating with 10+ reviews",
        "assignment": "automatic",
        "priority": 2
    },
    "founding_partner": {
        "name": "Founding Partner",
        "icon": "🏆",
        "color": "#8b5cf6",
        "description": "One of our founding partners",
        "assignment": "manual",
        "priority": 3
    },
    "popular": {
        "name": "Popular Choice",
        "icon": "🔥",
        "color": "#ef4444",
        "description": "50+ bookings in last 90 days",
        "assignment": "automatic",
        "priority": 4
    }
}

# ========== ADMIN ENDPOINTS ==========

@router.post("/admin/badges/listing/{listing_id}/assign")
async def assign_badge_to_listing(
    listing_id: str,
    badge_type: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Manually assign a badge to a listing (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate badge type
    if badge_type not in BADGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid badge type. Must be one of: {', '.join(BADGE_TYPES.keys())}")
    
    # Check if manual assignment is allowed
    if BADGE_TYPES[badge_type]["assignment"] == "automatic":
        raise HTTPException(status_code=400, detail=f"{badge_type} badge is automatically assigned based on criteria")
    
    # Get listing
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Add badge if not already present
    badges = listing.get("badges", [])
    if badge_type not in badges:
        badges.append(badge_type)
        
        await db.listings.update_one(
            {"id": listing_id},
            {
                "$set": {"badges": badges},
                "$push": {
                    "badge_history": {
                        "badge_type": badge_type,
                        "action": "assigned",
                        "assigned_by": current_user["id"],
                        "assigned_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        
        return {"message": f"{BADGE_TYPES[badge_type]['name']} badge assigned successfully"}
    else:
        raise HTTPException(status_code=400, detail="Listing already has this badge")

@router.delete("/admin/badges/listing/{listing_id}/remove")
async def remove_badge_from_listing(
    listing_id: str,
    badge_type: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Remove a badge from a listing (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    badges = listing.get("badges", [])
    if badge_type in badges:
        badges.remove(badge_type)
        
        await db.listings.update_one(
            {"id": listing_id},
            {
                "$set": {"badges": badges},
                "$push": {
                    "badge_history": {
                        "badge_type": badge_type,
                        "action": "removed",
                        "removed_by": current_user["id"],
                        "removed_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        
        return {"message": f"{BADGE_TYPES[badge_type]['name']} badge removed successfully"}
    else:
        raise HTTPException(status_code=404, detail="Listing does not have this badge")

@router.post("/admin/badges/partner/{partner_id}/assign")
async def assign_badge_to_partner(
    partner_id: str,
    badge_type: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Manually assign a badge to a partner (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if badge_type not in BADGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid badge type")
    
    if BADGE_TYPES[badge_type]["assignment"] == "automatic":
        raise HTTPException(status_code=400, detail=f"{badge_type} badge is automatically assigned")
    
    partner = await db.users.find_one({"id": partner_id, "role": "partner_owner"})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    badges = partner.get("badges", [])
    if badge_type not in badges:
        badges.append(badge_type)
        
        await db.users.update_one(
            {"id": partner_id},
            {
                "$set": {"badges": badges},
                "$push": {
                    "badge_history": {
                        "badge_type": badge_type,
                        "action": "assigned",
                        "assigned_by": current_user["id"],
                        "assigned_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        
        return {"message": f"{BADGE_TYPES[badge_type]['name']} badge assigned to partner"}
    else:
        raise HTTPException(status_code=400, detail="Partner already has this badge")

@router.delete("/admin/badges/partner/{partner_id}/remove")
async def remove_badge_from_partner(
    partner_id: str,
    badge_type: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Remove a badge from a partner (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    partner = await db.users.find_one({"id": partner_id, "role": "partner_owner"})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    badges = partner.get("badges", [])
    if badge_type in badges:
        badges.remove(badge_type)
        
        await db.users.update_one(
            {"id": partner_id},
            {
                "$set": {"badges": badges},
                "$push": {
                    "badge_history": {
                        "badge_type": badge_type,
                        "action": "removed",
                        "removed_by": current_user["id"],
                        "removed_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        
        return {"message": f"Badge removed from partner"}
    else:
        raise HTTPException(status_code=404, detail="Partner does not have this badge")

@router.post("/admin/badges/update-automatic")
async def update_automatic_badges(
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Update all automatic badges based on current criteria (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    updated_listings = 0
    updated_partners = 0
    
    # Update Top Rated badges (≥4.5 rating, ≥10 reviews)
    # For listings
    listings = await db.listings.find({"status": "active"}).to_list(1000)
    for listing in listings:
        rating = listing.get("rating_avg", 0)
        count = listing.get("rating_count", 0)
        badges = listing.get("badges", [])
        
        should_have_top_rated = rating >= 4.5 and count >= 10
        has_top_rated = "top_rated" in badges
        
        if should_have_top_rated and not has_top_rated:
            badges.append("top_rated")
            await db.listings.update_one({"id": listing["id"]}, {"$set": {"badges": badges}})
            updated_listings += 1
        elif not should_have_top_rated and has_top_rated:
            badges.remove("top_rated")
            await db.listings.update_one({"id": listing["id"]}, {"$set": {"badges": badges}})
            updated_listings += 1
    
    # Update Popular badges (>50 bookings in last 90 days)
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
    for listing in listings:
        booking_count = await db.bookings.count_documents({
            "listing_id": listing["id"],
            "created_at": {"$gte": cutoff_date},
            "booking_status": {"$in": ["confirmed", "completed"]}
        })
        
        badges = listing.get("badges", [])
        should_have_popular = booking_count >= 50
        has_popular = "popular" in badges
        
        if should_have_popular and not has_popular:
            badges.append("popular")
            await db.listings.update_one({"id": listing["id"]}, {"$set": {"badges": badges}})
            updated_listings += 1
        elif not should_have_popular and has_popular:
            badges.remove("popular")
            await db.listings.update_one({"id": listing["id"]}, {"$set": {"badges": badges}})
            updated_listings += 1
    
    # For partners
    partners = await db.users.find({"role": "partner_owner"}).to_list(1000)
    for partner in partners:
        rating = partner.get("rating_avg", 0)
        count = partner.get("rating_count", 0)
        badges = partner.get("badges", [])
        
        should_have_top_rated = rating >= 4.5 and count >= 10
        has_top_rated = "top_rated" in badges
        
        if should_have_top_rated and not has_top_rated:
            badges.append("top_rated")
            await db.users.update_one({"id": partner["id"]}, {"$set": {"badges": badges}})
            updated_partners += 1
        elif not should_have_top_rated and has_top_rated:
            badges.remove("top_rated")
            await db.users.update_one({"id": partner["id"]}, {"$set": {"badges": badges}})
            updated_partners += 1
    
    return {
        "message": "Automatic badges updated",
        "updated_listings": updated_listings,
        "updated_partners": updated_partners
    }

# ========== PUBLIC ENDPOINTS ==========

@router.get("/badges/types")
async def get_badge_types():
    """Get all available badge types and their descriptions"""
    return {"badge_types": BADGE_TYPES}
