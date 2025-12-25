"""
Review System APIs for rayy
Handles listing and partner reviews with admin moderation
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import uuid

router = APIRouter()

# Will be injected from server.py
db = None
get_current_user = None

def init_router(database, auth_func):
    """Initialize router with database and auth function"""
    global db, get_current_user
    db = database
    get_current_user = auth_func

# ========== MODELS ==========

class ReviewCreate(BaseModel):
    booking_id: str
    review_type: str  # "listing" or "partner"
    target_id: str  # listing_id or partner_id
    rating: int  # 1-5
    review_text: str

class ReviewResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    booking_id: str
    review_type: str
    target_id: str
    rating: int
    review_text: str
    status: str  # pending, approved, rejected
    created_at: str
    approved_at: Optional[str] = None
    
class ReviewStats(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[int, int]  # {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}

# ========== CUSTOMER ENDPOINTS ==========

@router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Create a review (customer only, must have attended the booking)"""
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can leave reviews")
    
    # Verify booking exists and belongs to customer
    booking = await db.bookings.find_one({
        "id": review_data.booking_id,
        "customer_id": current_user["id"]
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if customer attended
    if booking.get("attendance_status") != "present":
        raise HTTPException(status_code=403, detail="You can only review classes you attended")
    
    # Check if already reviewed
    existing_review = await db.reviews.find_one({
        "customer_id": current_user["id"],
        "booking_id": review_data.booking_id,
        "review_type": review_data.review_type,
        "target_id": review_data.target_id
    })
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this")
    
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Validate review text
    if len(review_data.review_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Review must be at least 10 characters")
    
    # Verify target exists
    if review_data.review_type == "listing":
        target = await db.listings.find_one({"id": review_data.target_id})
        if not target:
            raise HTTPException(status_code=404, detail="Listing not found")
    elif review_data.review_type == "partner":
        target = await db.users.find_one({"id": review_data.target_id, "role": "partner_owner"})
        if not target:
            raise HTTPException(status_code=404, detail="Partner not found")
    else:
        raise HTTPException(status_code=400, detail="Invalid review type")
    
    # Create review
    review = {
        "id": str(uuid.uuid4()),
        "customer_id": current_user["id"],
        "customer_name": current_user["name"],
        "booking_id": review_data.booking_id,
        "review_type": review_data.review_type,
        "target_id": review_data.target_id,
        "rating": review_data.rating,
        "review_text": review_data.review_text.strip(),
        "status": "pending",  # Requires admin approval
        "created_at": datetime.now(timezone.utc),
        "approved_at": None,
        "approved_by": None
    }
    
    await db.reviews.insert_one(review)
    
    return {
        "message": "Review submitted successfully. It will appear after admin approval.",
        "review_id": review["id"]
    }

@router.get("/reviews/my")
async def get_my_reviews(
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Get all reviews by current user"""
    reviews = await db.reviews.find({
        "customer_id": current_user["id"]
    }).sort("created_at", -1).to_list(100)
    
    # Convert datetime to string
    for review in reviews:
        review.pop("_id", None)
        review["created_at"] = review["created_at"].isoformat()
        if review.get("approved_at"):
            review["approved_at"] = review["approved_at"].isoformat()
    
    return {"reviews": reviews}

# ========== PUBLIC ENDPOINTS ==========

@router.get("/reviews/listing/{listing_id}")
async def get_listing_reviews(
    listing_id: str,
    status: str = "approved"
):
    """Get approved reviews for a listing"""
    reviews = await db.reviews.find({
        "review_type": "listing",
        "target_id": listing_id,
        "status": status
    }).sort("created_at", -1).to_list(100)
    
    # Convert datetime to string
    for review in reviews:
        review.pop("_id", None)
        review["created_at"] = review["created_at"].isoformat()
        if review.get("approved_at"):
            review["approved_at"] = review["approved_at"].isoformat()
    
    return {"reviews": reviews}

@router.get("/reviews/partner/{partner_id}")
async def get_partner_reviews(
    partner_id: str,
    status: str = "approved"
):
    """Get approved reviews for a partner"""
    reviews = await db.reviews.find({
        "review_type": "partner",
        "target_id": partner_id,
        "status": status
    }).sort("created_at", -1).to_list(100)
    
    # Convert datetime to string
    for review in reviews:
        review.pop("_id", None)
        review["created_at"] = review["created_at"].isoformat()
        if review.get("approved_at"):
            review["approved_at"] = review["approved_at"].isoformat()
    
    return {"reviews": reviews}

@router.get("/reviews/stats/listing/{listing_id}")
async def get_listing_review_stats(listing_id: str):
    """Get review statistics for a listing"""
    reviews = await db.reviews.find({
        "review_type": "listing",
        "target_id": listing_id,
        "status": "approved"
    }).to_list(1000)
    
    if not reviews:
        return {
            "average_rating": 0,
            "total_reviews": 0,
            "rating_distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }
    
    total = len(reviews)
    sum_rating = sum(r["rating"] for r in reviews)
    avg = round(sum_rating / total, 1)
    
    # Rating distribution
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for review in reviews:
        rating_int = int(round(review["rating"]))  # Round to nearest integer
        if rating_int in distribution:
            distribution[rating_int] += 1
    
    return {
        "average_rating": avg,
        "total_reviews": total,
        "rating_distribution": distribution
    }

@router.get("/reviews/stats/partner/{partner_id}")
async def get_partner_review_stats(partner_id: str):
    """Get review statistics for a partner"""
    reviews = await db.reviews.find({
        "review_type": "partner",
        "target_id": partner_id,
        "status": "approved"
    }).to_list(1000)
    
    if not reviews:
        return {
            "average_rating": 0,
            "total_reviews": 0,
            "rating_distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }
    
    total = len(reviews)
    sum_rating = sum(r["rating"] for r in reviews)
    avg = round(sum_rating / total, 1)
    
    # Rating distribution
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for review in reviews:
        rating_int = int(round(review["rating"]))  # Round to nearest integer
        if rating_int in distribution:
            distribution[rating_int] += 1
    
    return {
        "average_rating": avg,
        "total_reviews": total,
        "rating_distribution": distribution
    }

# ========== ADMIN ENDPOINTS ==========

@router.get("/admin/reviews")
async def get_all_reviews_admin(
    status: Optional[str] = None,
    review_type: Optional[str] = None,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Get all reviews (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if review_type:
        query["review_type"] = review_type
    
    reviews = await db.reviews.find(query).sort("created_at", -1).to_list(500)
    
    # Convert datetime to string
    for review in reviews:
        review.pop("_id", None)
        review["created_at"] = review["created_at"].isoformat()
        if review.get("approved_at"):
            review["approved_at"] = review["approved_at"].isoformat()
    
    return {"reviews": reviews}

@router.put("/admin/reviews/{review_id}/approve")
async def approve_review(
    review_id: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Approve a review (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review["status"] == "approved":
        raise HTTPException(status_code=400, detail="Review already approved")
    
    # Update review status
    await db.reviews.update_one(
        {"id": review_id},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc),
                "approved_by": current_user["id"]
            }
        }
    )
    
    # Update listing/partner rating
    await update_target_rating(review["review_type"], review["target_id"])
    
    # Update badge if needed (Top Rated)
    await update_badges_for_target(review["review_type"], review["target_id"])
    
    return {"message": "Review approved successfully"}

@router.put("/admin/reviews/{review_id}/reject")
async def reject_review(
    review_id: str,
    reason: Optional[str] = None,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Reject a review (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    await db.reviews.update_one(
        {"id": review_id},
        {
            "$set": {
                "status": "rejected",
                "rejected_at": datetime.now(timezone.utc),
                "rejected_by": current_user["id"],
                "rejection_reason": reason
            }
        }
    )
    
    return {"message": "Review rejected"}

@router.delete("/admin/reviews/{review_id}")
async def delete_review(
    review_id: str,
    current_user: Dict = Depends(lambda: get_current_user)
):
    """Delete a review (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review deleted successfully"}

# ========== HELPER FUNCTIONS ==========

async def update_target_rating(review_type: str, target_id: str):
    """Update average rating for listing or partner"""
    reviews = await db.reviews.find({
        "review_type": review_type,
        "target_id": target_id,
        "status": "approved"
    }).to_list(1000)
    
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        avg_rating = round(avg_rating, 1)
        total_reviews = len(reviews)
    else:
        avg_rating = 0
        total_reviews = 0
    
    if review_type == "listing":
        await db.listings.update_one(
            {"id": target_id},
            {"$set": {
                "rating_avg": avg_rating,
                "rating_count": total_reviews
            }}
        )
    elif review_type == "partner":
        await db.users.update_one(
            {"id": target_id},
            {"$set": {
                "rating_avg": avg_rating,
                "rating_count": total_reviews
            }}
        )

async def update_badges_for_target(review_type: str, target_id: str):
    """Auto-assign Top Rated badge based on reviews"""
    reviews = await db.reviews.find({
        "review_type": review_type,
        "target_id": target_id,
        "status": "approved"
    }).to_list(1000)
    
    # Top Rated criteria: ≥4.5 rating with ≥10 reviews
    if len(reviews) >= 10:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        
        if review_type == "listing":
            listing = await db.listings.find_one({"id": target_id})
            if listing:
                badges = listing.get("badges", [])
                
                if avg_rating >= 4.5 and "top_rated" not in badges:
                    badges.append("top_rated")
                    await db.listings.update_one(
                        {"id": target_id},
                        {"$set": {"badges": badges}}
                    )
                elif avg_rating < 4.5 and "top_rated" in badges:
                    badges.remove("top_rated")
                    await db.listings.update_one(
                        {"id": target_id},
                        {"$set": {"badges": badges}}
                    )
        
        elif review_type == "partner":
            partner = await db.users.find_one({"id": target_id})
            if partner:
                badges = partner.get("badges", [])
                
                if avg_rating >= 4.5 and "top_rated" not in badges:
                    badges.append("top_rated")
                    await db.users.update_one(
                        {"id": target_id},
                        {"$set": {"badges": badges}}
                    )
                elif avg_rating < 4.5 and "top_rated" in badges:
                    badges.remove("top_rated")
                    await db.users.update_one(
                        {"id": target_id},
                        {"$set": {"badges": badges}}
                    )
