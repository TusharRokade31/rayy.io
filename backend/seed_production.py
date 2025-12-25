"""
Production Database Seeding Endpoint
Call this ONCE after deploying to production to populate the database
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import jwt
from typing import Dict

router = APIRouter()

# Will be injected from server.py
db = None

def init_router(database):
    """Initialize router with database"""
    global db
    db = database

# Auth
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Get current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Must be admin
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin only")
        
        user.pop("_id", None)
        user.pop("password", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/admin/seed-production-database")
async def seed_production_database(
    current_user: Dict = Depends(get_current_user)
):
    """
    One-time database seeding for production
    WARNING: Only call this ONCE after fresh deployment
    """
    
    # Import seeding functions
    import sys
    sys.path.append('/app/backend')
    
    try:
        # Import and run each seeding script
        from add_categories import add_new_categories
        from setup_workshops_camps import setup_workshops_and_camps
        from update_prices import update_prices
        from assign_unique_images import assign_images
        
        results = {
            "status": "success",
            "steps_completed": []
        }
        
        # Step 1: Add categories (if needed)
        try:
            categories = await db.categories.find({}).to_list(length=None)
            if len(categories) < 12:
                await add_new_categories()
                results["steps_completed"].append("✅ Added categories (now 12 total)")
            else:
                results["steps_completed"].append("✅ Categories already complete (12)")
        except Exception as e:
            results["steps_completed"].append(f"⚠️ Categories: {str(e)}")
        
        # Step 2: Setup workshops and camps
        try:
            workshops = await db.listings.find({'listing_type': 'workshop'}).to_list(length=None)
            if len(workshops) < 10:
                await setup_workshops_and_camps()
                results["steps_completed"].append("✅ Added workshops and camps")
            else:
                results["steps_completed"].append("✅ Workshops and camps already exist")
        except Exception as e:
            results["steps_completed"].append(f"⚠️ Workshops/Camps: {str(e)}")
        
        # Step 3: Update pricing
        try:
            await update_prices()
            results["steps_completed"].append("✅ Updated all pricing (₹49-₹99 trials, ₹149-₹499 regular)")
        except Exception as e:
            results["steps_completed"].append(f"⚠️ Pricing: {str(e)}")
        
        # Step 4: Assign images
        try:
            await assign_images()
            results["steps_completed"].append("✅ Assigned unique images to all listings")
        except Exception as e:
            results["steps_completed"].append(f"⚠️ Images: {str(e)}")
        
        # Final verification
        categories_count = await db.categories.count_documents({})
        listings_count = await db.listings.count_documents({})
        workshops_count = await db.listings.count_documents({'listing_type': 'workshop'})
        camps_count = await db.listings.count_documents({'listing_type': 'camp'})
        
        results["final_state"] = {
            "categories": categories_count,
            "total_listings": listings_count,
            "workshops": workshops_count,
            "camps": camps_count
        }
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Seeding failed: {str(e)}"
        )

@router.get("/admin/database-status")
async def get_database_status(
    current_user: Dict = Depends(get_current_user)
):
    """Check current database state"""
    
    categories = await db.categories.count_documents({})
    listings = await db.listings.count_documents({})
    workshops = await db.listings.count_documents({'listing_type': 'workshop'})
    camps = await db.listings.count_documents({'listing_type': 'camp'})
    trials = await db.listings.count_documents({'trial_available': True})
    
    # Check images
    all_listings = await db.listings.find({}).to_list(length=None)
    with_images = len([l for l in all_listings if l.get('image_url')])
    
    # Check pricing
    trial_listings = [l for l in all_listings if l.get('trial_available')]
    trial_prices = list(set([l.get('trial_price_inr') for l in trial_listings if l.get('trial_price_inr')]))
    
    base_prices = [l.get('base_price_inr') for l in all_listings if l.get('base_price_inr')]
    price_range = f"₹{min(base_prices)}-₹{max(base_prices)}" if base_prices else "N/A"
    
    return {
        "database": os.environ.get('DB_NAME'),
        "counts": {
            "categories": categories,
            "total_listings": listings,
            "workshops": workshops,
            "camps": camps,
            "trials": trials
        },
        "images": {
            "total_listings": listings,
            "with_images": with_images,
            "percentage": f"{(with_images/listings*100):.1f}%" if listings > 0 else "0%"
        },
        "pricing": {
            "trial_prices": sorted(trial_prices),
            "base_price_range": price_range
        },
        "needs_seeding": categories < 12 or workshops < 10 or camps < 10 or with_images < listings
    }
