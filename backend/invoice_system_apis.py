"""
Invoice System for rayy
Generates invoices for bookings and manages invoice records
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import uuid
import os
import jwt

router = APIRouter()

# Will be injected from server.py
db = None

def init_router(database):
    """Initialize router with database"""
    global db
    db = database

# Auth setup
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.pop("_id", None)
        user.pop("password", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========== MODELS ==========

class InvoiceItem(BaseModel):
    description: str
    quantity: int
    unit_price: float
    total: float

class Invoice(BaseModel):
    id: str
    invoice_number: str
    booking_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    partner_id: str
    partner_name: str
    listing_title: str
    items: List[InvoiceItem]
    subtotal: float
    discount: float
    credits_used: int
    credits_value: float
    total_inr: float
    payment_method: str
    payment_status: str
    invoice_date: str
    due_date: Optional[str] = None
    paid_date: Optional[str] = None
    status: str  # draft, sent, paid, cancelled

# ========== CUSTOMER ENDPOINTS ==========

@router.get("/invoices/my")
async def get_my_invoices(
    current_user: Dict = Depends(get_current_user)
):
    """Get all invoices for current user"""
    invoices = await db.invoices.find({
        "customer_id": current_user["id"]
    }).sort("invoice_date", -1).to_list(100)
    
    # Convert datetime to string
    for invoice in invoices:
        invoice.pop("_id", None)
        if isinstance(invoice.get("invoice_date"), datetime):
            invoice["invoice_date"] = invoice["invoice_date"].isoformat()
        if isinstance(invoice.get("paid_date"), datetime):
            invoice["paid_date"] = invoice["paid_date"].isoformat()
    
    return {"invoices": invoices}

@router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get specific invoice (customer, partner, or admin)"""
    invoice = await db.invoices.find_one({"id": invoice_id})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check access permissions
    if current_user["role"] not in ["admin"]:
        if current_user["role"] == "customer" and invoice["customer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        if current_user["role"] == "partner_owner" and invoice["partner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
    
    invoice.pop("_id", None)
    if isinstance(invoice.get("invoice_date"), datetime):
        invoice["invoice_date"] = invoice["invoice_date"].isoformat()
    if isinstance(invoice.get("paid_date"), datetime):
        invoice["paid_date"] = invoice["paid_date"].isoformat()
    
    return invoice

@router.post("/invoices/generate/{booking_id}")
async def generate_invoice_from_booking(
    booking_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Generate invoice for a booking (admin only or automatic on booking creation)"""
    # For now, allow admin to manually generate
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get booking details
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if invoice already exists
    existing = await db.invoices.find_one({"booking_id": booking_id})
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this booking")
    
    # Get customer details
    customer = await db.users.find_one({"id": booking["customer_id"]})
    
    # Get listing details
    listing = await db.listings.find_one({"id": booking["listing_id"]})
    
    # Get partner details
    partner = await db.users.find_one({"id": listing["partner_id"]})
    
    # Generate invoice number (format: INV-YYYYMMDD-XXXX)
    today = datetime.now(timezone.utc)
    date_str = today.strftime("%Y%m%d")
    # Count invoices today
    count = await db.invoices.count_documents({
        "invoice_number": {"$regex": f"^INV-{date_str}-"}
    })
    invoice_number = f"INV-{date_str}-{str(count + 1).zfill(4)}"
    
    # Create invoice items
    items = []
    
    # Main item - Session/Class
    items.append({
        "description": listing["title"],
        "quantity": 1,
        "unit_price": booking.get("total_inr", 0) + booking.get("credits_used", 0),
        "total": booking.get("total_inr", 0) + booking.get("credits_used", 0)
    })
    
    subtotal = items[0]["total"]
    credits_value = booking.get("credits_used", 0)
    discount = 0
    
    # Create invoice
    invoice = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "booking_id": booking_id,
        "customer_id": booking["customer_id"],
        "customer_name": customer.get("name", ""),
        "customer_email": customer.get("email", ""),
        "partner_id": listing["partner_id"],
        "partner_name": partner.get("business_name", partner.get("name", "")),
        "listing_title": listing["title"],
        "items": items,
        "subtotal": subtotal,
        "discount": discount,
        "credits_used": booking.get("credits_used", 0),
        "credits_value": credits_value,
        "total_inr": booking.get("total_inr", 0),
        "payment_method": booking.get("payment_method", ""),
        "payment_status": booking.get("payment_status", "pending"),
        "invoice_date": today,
        "paid_date": today if booking.get("payment_status") == "completed" else None,
        "status": "paid" if booking.get("payment_status") == "completed" else "sent",
        "gst_amount": 0,  # Calculate GST if needed
        "session_date": booking.get("session_start"),
        "session_duration": listing.get("session_duration", 60)
    }
    
    await db.invoices.insert_one(invoice)
    
    return {
        "message": "Invoice generated successfully",
        "invoice_id": invoice["id"],
        "invoice_number": invoice_number
    }

# ========== PARTNER ENDPOINTS ==========

@router.get("/partner/invoices")
async def get_partner_invoices(
    current_user: Dict = Depends(get_current_user)
):
    """Get all invoices for partner's listings"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Partner access required")
    
    invoices = await db.invoices.find({
        "partner_id": current_user["id"]
    }).sort("invoice_date", -1).to_list(500)
    
    for invoice in invoices:
        invoice.pop("_id", None)
        if isinstance(invoice.get("invoice_date"), datetime):
            invoice["invoice_date"] = invoice["invoice_date"].isoformat()
        if isinstance(invoice.get("paid_date"), datetime):
            invoice["paid_date"] = invoice["paid_date"].isoformat()
    
    return {"invoices": invoices}

# ========== ADMIN ENDPOINTS ==========

@router.get("/admin/invoices")
async def get_all_invoices(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    partner_id: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Get all invoices (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    if partner_id:
        query["partner_id"] = partner_id
    
    invoices = await db.invoices.find(query).sort("invoice_date", -1).to_list(1000)
    
    for invoice in invoices:
        invoice.pop("_id", None)
        if isinstance(invoice.get("invoice_date"), datetime):
            invoice["invoice_date"] = invoice["invoice_date"].isoformat()
        if isinstance(invoice.get("paid_date"), datetime):
            invoice["paid_date"] = invoice["paid_date"].isoformat()
    
    return {"invoices": invoices}

@router.post("/admin/invoices/bulk-generate")
async def bulk_generate_invoices(
    current_user: Dict = Depends(get_current_user)
):
    """Generate invoices for all bookings without invoices (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all paid bookings without invoices
    bookings = await db.bookings.find({
        "payment_status": "completed"
    }).to_list(10000)
    
    generated_count = 0
    
    for booking in bookings:
        # Check if invoice exists
        existing = await db.invoices.find_one({"booking_id": booking["id"]})
        if existing:
            continue
        
        try:
            # Get related data
            customer = await db.users.find_one({"id": booking["customer_id"]})
            listing = await db.listings.find_one({"id": booking["listing_id"]})
            if not listing:
                continue
            partner = await db.users.find_one({"id": listing["partner_id"]})
            
            # Generate invoice number
            today = datetime.now(timezone.utc)
            date_str = today.strftime("%Y%m%d")
            count = await db.invoices.count_documents({
                "invoice_number": {"$regex": f"^INV-{date_str}-"}
            })
            invoice_number = f"INV-{date_str}-{str(count + 1).zfill(4)}"
            
            # Create invoice
            items = [{
                "description": listing["title"],
                "quantity": 1,
                "unit_price": booking.get("total_inr", 0) + booking.get("credits_used", 0),
                "total": booking.get("total_inr", 0) + booking.get("credits_used", 0)
            }]
            
            invoice = {
                "id": str(uuid.uuid4()),
                "invoice_number": invoice_number,
                "booking_id": booking["id"],
                "customer_id": booking["customer_id"],
                "customer_name": customer.get("name", "") if customer else "",
                "customer_email": customer.get("email", "") if customer else "",
                "partner_id": listing["partner_id"],
                "partner_name": partner.get("business_name", partner.get("name", "")) if partner else "",
                "listing_title": listing["title"],
                "items": items,
                "subtotal": items[0]["total"],
                "discount": 0,
                "credits_used": booking.get("credits_used", 0),
                "credits_value": booking.get("credits_used", 0),
                "total_inr": booking.get("total_inr", 0),
                "payment_method": booking.get("payment_method", ""),
                "payment_status": "completed",
                "invoice_date": booking.get("created_at", today),
                "paid_date": booking.get("created_at", today),
                "status": "paid",
                "gst_amount": 0,
                "session_date": booking.get("session_start"),
                "session_duration": listing.get("session_duration", 60)
            }
            
            await db.invoices.insert_one(invoice)
            generated_count += 1
            
        except Exception as e:
            print(f"Error generating invoice for booking {booking['id']}: {e}")
            continue
    
    return {
        "message": f"Generated {generated_count} invoices",
        "count": generated_count
    }
