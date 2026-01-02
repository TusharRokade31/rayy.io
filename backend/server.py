from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
import logging
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pymongo import MongoClient

__version__ = "2.2.1"
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import razorpay
import hmac
import hashlib
import csv
import io
import base64
from fastapi.responses import Response, StreamingResponse, JSONResponse
import googlemaps
import httpx
from contextlib import asynccontextmanager


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "rayy_db")

# Create async MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Test connection
async def test_connection():
    try:
        await client.admin.command('ping')
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 720))

# Razorpay Config
PAYMENTS_MODE = os.environ.get('PAYMENTS_MODE', 'mock')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# Google Maps Config
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
gmaps_client = None
if GOOGLE_MAPS_API_KEY:
    try:
        gmaps_client = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    except Exception as e:
        logging.warning(f"Failed to initialize Google Maps client: {e}")

# Base URL Config
BASE_URL = os.environ.get('BASE_URL', 'http://localhost:3000')

# Initialize Razorpay client
razorpay_client = None
if PAYMENTS_MODE in ['test', 'live'] and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

security = HTTPBearer()

# ============== UTILITY FUNCTIONS ==============
def calculate_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula"""
    import math
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    # Haversine formula
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth radius in kilometers
    radius = 6371
    
    return radius * c

def format_distance(distance_km: float) -> str:
    """Format distance for display"""
    if distance_km < 1:
        return f"{int(distance_km * 1000)}m away"
    elif distance_km < 10:
        return f"{distance_km:.1f}km away"
    else:
        return f"{int(distance_km)}km away"

def validate_pan(pan: str) -> bool:
    """Validate PAN format: ABCDE1234F"""
    import re
    pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    return bool(re.match(pattern, pan))

def validate_aadhaar(aadhaar: str) -> bool:
    """Validate Aadhaar: 12 digits"""
    return aadhaar.isdigit() and len(aadhaar) == 12

def validate_gst(gst: str) -> bool:
    """Validate GST format: 15 characters"""
    import re
    # GST format: 2 digits (state code) + 10 chars (PAN) + 1 digit + 1 letter + 1 alphanumeric
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'
    return bool(re.match(pattern, gst))

def validate_ifsc(ifsc: str) -> bool:
    """Validate IFSC code: 11 characters (4 letters + 0 + 6 alphanumeric)"""
    import re
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Wrap the seeding in a try-except to not block startup
    try:
        await startup_auto_seed()
    except Exception as e:
        logger.error(f"Startup seeding failed: {e}")
        logger.info("Server will continue running without seeding")
    
    yield
    
    await shutdown_db_client()

# Create FastAPI app with lifespan
# app = FastAPI(lifespan=lifespan)
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== ENUMS ==============
class UserRole(str, Enum):
    customer = "customer"
    partner_owner = "partner_owner"
    partner_staff = "partner_staff"
    admin = "admin"

class KYCStatus(str, Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"

class PartnerStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    draft = "draft"
    active = "active"
    suspended = "suspended"

class ListingStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"

class ApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class SessionStatus(str, Enum):
    scheduled = "scheduled"
    canceled = "canceled"
    completed = "completed"

class BookingStatus(str, Enum):
    confirmed = "confirmed"
    pending = "pending"
    canceled = "canceled"
    attended = "attended"
    no_show = "no_show"
    refunded = "refunded"

class PaymentMethod(str, Enum):
    credit_wallet = "credit_wallet"
    razorpay_card = "razorpay_card"
    upi = "upi"

# ============== MODELS ==============
class ChildProfile(BaseModel):
    name: str
    age: int
    interests: List[str] = []

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: UserRole = UserRole.customer
    name: str
    email: EmailStr
    phone: Optional[str] = None
    hashed_password: str
    whatsapp_opt_in: bool = False
    child_profiles: List[ChildProfile] = []
    kyc_status: KYCStatus = KYCStatus.unverified
    location: Optional[Dict[str, Any]] = None  # {lat, lng, city, pin, accuracy, ts}
    wishlist: List[str] = []  # List of listing IDs
    onboarding_complete: bool = False  # Track if user completed onboarding wizard
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole  # No default - must be explicitly provided

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    role: UserRole
    name: str
    email: EmailStr
    phone: Optional[str] = None
    child_profiles: List[ChildProfile] = []
    onboarding_complete: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False  # Flag to trigger onboarding on frontend

class Partner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_user_id: str
    brand_name: str
    legal_name: str
    description: Optional[str] = None
    
    # KYC Documents
    pan_number: Optional[str] = None
    pan_document: Optional[str] = None  # Base64 encoded
    aadhaar_number: Optional[str] = None
    aadhaar_document: Optional[str] = None  # Base64 encoded
    gst_number: Optional[str] = None  # Optional
    gst_document: Optional[str] = None  # Base64 encoded, optional
    
    # Bank Details
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None  # "savings" or "current"
    cancelled_cheque_document: Optional[str] = None  # Base64 encoded, optional
    
    # Partner Photo
    partner_photo: Optional[str] = None  # Base64 encoded
    
    # Legacy fields (keeping for backward compatibility)
    gstin: Optional[str] = None
    pan: Optional[str] = None
    upi_id: Optional[str] = None
    kyc_documents: Optional[Dict[str, Any]] = None
    bank_details: Optional[Dict[str, Any]] = None    
    address: str
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    verification_badges: List[str] = []
    cancellation_policy_id: Optional[str] = None
    kyc_status: str = "pending"
    kyc_documents_submitted: bool = False
    status: PartnerStatus = PartnerStatus.pending
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PartnerCreate(BaseModel):
    brand_name: str
    legal_name: str
    description: Optional[str] = None
    address: str
    city: str
    
    # KYC Documents
    pan_number: Optional[str] = None
    pan_document: Optional[str] = None
    aadhaar_number: Optional[str] = None
    aadhaar_document: Optional[str] = None
    gst_number: Optional[str] = None
    gst_document: Optional[str] = None
    
    # Bank Details
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    cancelled_cheque_document: Optional[str] = None
    
    # Partner Photo
    partner_photo: Optional[str] = None
    
    # Legacy fields
    gstin: Optional[str] = None
    pan: Optional[str] = None
    kyc_documents: Optional[Dict[str, Any]] = None
    bank_details: Optional[Dict[str, Any]] = None
    kyc_status: Optional[str] = "pending"

class Venue(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    indoor: bool = True
    amenities: List[str] = []
    capacity: int = 20
    city: Optional[str] = None
    pincode: Optional[str] = None
    google_maps_link: Optional[str] = None
    landmarks: Optional[str] = None  # Special instructions/landmarks for customers
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VenueCreate(BaseModel):
    name: str
    address: str
    city: str
    pincode: Optional[str] = ""
    google_maps_link: Optional[str] = ""
    landmarks: Optional[str] = ""  # Special instructions/landmarks for customers

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    name: str
    icon: Optional[str] = None

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    venue_id: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    category_id: str
    description: str
    age_min: int
    age_max: int
    duration_minutes: int
    base_price_inr: float
    tax_percent: float = 18.0
    is_online: bool = False
    trial_available: bool = False
    trial_price_inr: Optional[float] = None
    media: List[str] = []  # URLs
    video_url: Optional[str] = None  # Video URL for listing
    safety_notes: Optional[str] = None
    equipment_needed: Optional[str] = None
    parent_presence_required: bool = False
    rating_avg: float = 0.0
    rating_count: int = 0
    status: ListingStatus = ListingStatus.draft
    approval_status: ApprovalStatus = ApprovalStatus.pending  # Admin approval status
    is_live: bool = False  # Only approved listings can be live
    admin_notes: Optional[str] = None  # Admin can add notes when approving/rejecting
    cancellation_policy_id: Optional[str] = None
    # NEW: Flexible booking fields
    plan_options: List[Dict[str, Any]] = []  # List of PlanOption as dicts
    batches: List[Dict[str, Any]] = []  # List of Batch as dicts
    holidays: List[Dict[str, Any]] = []  # List of Holiday as dicts
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ListingCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    category_id: str
    venue_id: Optional[str] = None
    description: str
    age_min: int
    age_max: int
    duration_minutes: int
    base_price_inr: float
    is_online: bool = False
    trial_available: bool = False
    trial_price_inr: Optional[float] = None
    media: List[str] = []
    video_url: Optional[str] = None  # Partners can submit video URL
    safety_notes: Optional[str] = None
    equipment_needed: Optional[str] = None
    parent_presence_required: bool = False

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    start_at: datetime
    end_at: datetime
    seats_total: int
    seats_booked: int = 0
    allow_late_booking_minutes: int = 60
    price_override_inr: Optional[float] = None
    staff_assigned: Optional[str] = None
    status: SessionStatus = SessionStatus.scheduled
    # NEW: Flexible booking fields
    batch_id: Optional[str] = None  # Link to batch
    is_rescheduled: bool = False
    original_date: Optional[str] = None  # ISO date if rescheduled

class SessionCreate(BaseModel):
    listing_id: str
    start_at: datetime
    duration_minutes: int
    seats_total: int
    price_override_inr: Optional[float] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    listing_id: str
    child_profile_name: str
    child_profile_age: int
    qty: int = 1
    unit_price_inr: float
    taxes_inr: float
    total_inr: float
    credits_used: int = 0
    payment_method: PaymentMethod
    payment_txn_id: Optional[str] = None
    booking_status: BookingStatus = BookingStatus.confirmed
    booked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    canceled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    refund_amount_inr: float = 0.0
    refund_credits: int = 0
    # Attendance tracking fields
    attendance: Optional[str] = None  # "present", "absent", "late"
    attendance_notes: Optional[str] = None
    attendance_at: Optional[datetime] = None
    payout_eligible: bool = False
    canceled_by: Optional[str] = None  # "customer" or "partner"
    is_trial: bool = False  # Trial booking flag
    reschedule_count: int = 0  # Track number of times rescheduled
    # NEW: Flexible booking fields
    plan_option_id: Optional[str] = None  # Reference to listing.plan_options[].id
    batch_id: Optional[str] = None  # Which batch student enrolled in
    session_ids: List[str] = []  # All booked sessions (for multi-session plans)

class BookingCreate(BaseModel):
    session_id: str
    child_profile_name: str
    child_profile_age: int
    payment_method: PaymentMethod
    use_credits: bool = False
    is_trial: bool = False
    plan_type: Optional[str] = "single"  # "single", "weekly", "monthly", "quarterly"
    sessions_count: Optional[int] = 1  # Number of sessions in the plan

class PlanBookingCreate(BaseModel):
    listing_id: str
    plan_id: str  # "single", "weekly", "monthly", "quarterly", "trial"
    session_ids: List[str]  # Specific sessions to book
    child_profile_name: str
    child_profile_age: int
    payment_method: PaymentMethod
    use_credits: bool = False

class AttendanceUpdateRequest(BaseModel):
    status: str  # "present", "absent", "late"
    notes: Optional[str] = None

# ============== FLEXIBLE BOOKING MODELS ==============

class PlanOption(BaseModel):
    """Flexible pricing plan defined by partner"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plan_type: str  # "trial", "single", "weekly", "monthly"
    name: str  # "Trial Class", "5-Day Intensive", etc.
    description: Optional[str] = None
    sessions_count: int  # 1 to unlimited
    price_inr: float
    discount_percent: float = 0.0
    validity_days: int = 30
    is_active: bool = True
    timing_type: str = "FLEXIBLE"  # "FIXED" or "FLEXIBLE"
    reschedule_limit_minutes: int = 30  # Minutes before class when reschedule is no longer allowed

class Batch(BaseModel):
    """Specific batch with timing and capacity"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # "Morning Batch 5PM", "Evening Batch 6PM"
    days_of_week: List[str]  # ["monday", "tuesday", ...]
    time: str  # "17:00" (24-hour format)
    duration_minutes: int
    capacity: int
    enrolled_count: int = 0
    plan_types: List[str]  # Which plans can book this batch ["trial", "weekly", "monthly"]
    start_date: str  # ISO date string
    end_date: Optional[str] = None  # Optional end date
    is_active: bool = True

class Holiday(BaseModel):
    """Holiday/reschedule tracking"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    batch_id: str
    original_date: str  # ISO date string
    rescheduled_date: Optional[str] = None
    reason: str
    status: str = "pending"  # "pending", "rescheduled", "canceled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UnableToAttend(BaseModel):
    """Track when user marks unable to attend a session"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    session_id: str
    user_id: str
    listing_id: str
    partner_id: str
    session_date_time: datetime
    reason: str  # "feeling_unwell", "traveling", "scheduling_conflict", "other"
    custom_note: Optional[str] = None
    notification_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response models for Flexible Booking V2

class PlanOptionCreate(BaseModel):
    plan_type: str
    name: str
    description: Optional[str] = None
    sessions_count: int
    price_inr: float
    discount_percent: float = 0.0
    validity_days: int = 30

class BatchCreate(BaseModel):
    name: str
    days_of_week: List[str]
    time: str
    duration_minutes: int
    capacity: int
    plan_types: List[str]
    start_date: str
    end_date: Optional[str] = None

class ListingCreateV2(BaseModel):
    title: str
    subtitle: Optional[str] = None
    category_id: str
    venue_id: Optional[str] = None
    description: str
    age_min: int
    age_max: int
    duration_minutes: int
    is_online: bool = False
    media: List[str] = []
    video_url: Optional[str] = None
    safety_notes: Optional[str] = None
    equipment_needed: Optional[str] = None
    parent_presence_required: bool = False
    plan_options: List[PlanOptionCreate] = []
    batches: List[BatchCreate] = []

class BookingCreateV2(BaseModel):
    listing_id: str
    plan_option_id: str
    batch_id: str
    session_ids: List[str]
    child_profile_name: str
    child_profile_age: int
    payment_method: PaymentMethod
    use_credits: bool = False

class PartnerCancelBookingRequest(BaseModel):
    reason: str  # "instructor_unavailable", "venue_issue", "weather", "other"
    message: Optional[str] = None


class CreditPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    monthly_price_inr: float
    credits_per_month: int
    rollover: bool = False
    rollover_cap: Optional[int] = None
    validity_days: int = 30
    trial_credits: int = 0

class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    credits_balance: int = 0
    last_grant_at: Optional[datetime] = None

class CreditLedger(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    delta: int
    reason: str  # purchase, booking, refund, expiry, bonus
    ref_booking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Rating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    booking_id: str
    stars: int  # 1-5
    text: Optional[str] = None
    photos: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    moderated: bool = False

class RatingCreate(BaseModel):
    booking_id: str
    stars: int
    text: Optional[str] = None

# ============== AUTH UTILITIES ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ============== HELPER FUNCTIONS ==============

def geocode_address(address: str, city: str, country_code: str = "IN") -> Dict[str, Any]:
    """
    Geocode address using Google Maps API
    Returns lat, lng, formatted_address, and validation status
    """
    if not gmaps_client:
        logging.warning("Google Maps client not initialized, skipping geocoding")
        return {
            "success": False,
            "lat": None,
            "lng": None,
            "formatted_address": None,
            "error": "Google Maps API not configured"
        }
    
    try:
        full_address = f"{address}, {city}, {country_code}"
        result = gmaps_client.geocode(address=full_address, region=country_code.lower())
        
        if not result:
            return {
                "success": False,
                "lat": None,
                "lng": None,
                "formatted_address": None,
                "error": "Address not found"
            }
        
        location = result[0]['geometry']['location']
        formatted_address = result[0].get('formatted_address', full_address)
        location_type = result[0].get('geometry', {}).get('location_type', 'UNKNOWN')
        
        # Determine if location is valid (ROOFTOP or RANGE_INTERPOLATED are most accurate)
        is_valid = location_type in ['ROOFTOP', 'RANGE_INTERPOLATED']
        
        return {
            "success": True,
            "lat": location['lat'],
            "lng": location['lng'],
            "formatted_address": formatted_address,
            "location_type": location_type,
            "is_valid": is_valid
        }
        
    except Exception as e:
        logging.error(f"Geocoding error: {str(e)}")
        return {
            "success": False,
            "lat": None,
            "lng": None,
            "formatted_address": None,
            "error": str(e)
        }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        print(f"🔍 JWT Payload - sub (user_id): {payload.get('sub')}, role: {payload.get('role')}")
        
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"🔍 get_current_user - DB returned role: {user.get('role')} for user: {user.get('email')}")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict]:
    """Optional authentication - returns None if no token provided"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        return user
    except:
        return None

# ============== HEALTH CHECK ENDPOINT ==============
@api_router.get("/health")
async def health_check():
    """
    Health check endpoint for mobile apps to verify backend connectivity.
    Returns current server status and timestamp.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "rrray-api",
        "version": "1.0"
    }

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    # LOG: Received registration data
    print(f"🔍 REGISTER - Received role: {data.role}")
    
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        hashed_password=hash_password(data.password)
    )
    
    # LOG: User object created
    print(f"🔍 REGISTER - User object role: {user.role}")
    
    await db.users.insert_one(user.model_dump())
    
    # LOG: Verify what was inserted
    inserted_user = await db.users.find_one({"email": data.email}, {"_id": 0, "role": 1, "email": 1})
    print(f"🔍 REGISTER - DB stored role: {inserted_user.get('role')}")
    
    # Create wallet for customers with welcome bonus
    if user.role == UserRole.customer:
        wallet = Wallet(user_id=user.id, credits_balance=50)
        await db.wallets.insert_one(wallet.model_dump())
        
        # Log welcome bonus transaction
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "transaction_type": "earn",
            "amount": 50,
            "source": "welcome_bonus",
            "description": "Welcome to rayy! Here's your first 50 credits",
            "balance_after": 50,
            "created_at": datetime.now(timezone.utc),
            "metadata": {"reason": "signup_bonus"}
        })
    
    token = create_token(user.id, user.role.value)
    user_resp = UserResponse(
        id=user.id,
        role=user.role,
        name=user.name,
        email=user.email,
        phone=user.phone,
        child_profiles=user.child_profiles,
        onboarding_complete=user.onboarding_complete
    )
    
    return TokenResponse(access_token=token, user=user_resp, is_new_user=True)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    user_resp = UserResponse(
        id=user["id"],
        role=UserRole(user["role"]),
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        child_profiles=[ChildProfile(**cp) for cp in user.get("child_profiles", [])],
        onboarding_complete=user.get("onboarding_complete", False)
    )
    
    return TokenResponse(access_token=token, user=user_resp, is_new_user=False)

# OTP Authentication for Customers
@api_router.post("/auth/send-otp")
async def send_otp(data: dict):
    """
    Send OTP to email or phone number
    For now, OTP is always 1234 (hardcoded)
    """
    identifier = data.get("identifier", "")
    
    # Check if user exists by email or phone
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": identifier}
        ]
    }, {"_id": 0})
    
    is_new_user = user is None
    user_id = user["id"] if user else None
    
    # For now, always use OTP = 1234 (hardcoded)
    otp = "1234"
    
    # Store OTP in database with expiry (5 minutes)
    await db.otps.update_one(
        {"identifier": identifier},
        {
            "$set": {
                "identifier": identifier,
                "otp": otp,
                "user_id": user_id,
                "is_new_user": is_new_user,
                "created_at": datetime.now(timezone.utc),
                "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
                "verified": False
            }
        },
        upsert=True
    )
    
    # In production, send OTP via SMS/Email here
    # For now, return success message
    return {
        "message": "OTP sent successfully",
        "otp": otp,  # Remove this in production
        "identifier": identifier,
        "is_new_user": is_new_user
    }


@api_router.post("/auth/check-partner-exists")
async def check_partner_exists(data: dict):
    """Check if a partner account exists for the given identifier"""
    identifier = data.get("identifier")
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier required")
    
    # Check if user exists with partner role
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": identifier}
        ],
        "role": {"$in": ["partner_owner", "partner_staff"]}
    }, {"_id": 0, "id": 1})
    
    logging.info(f"🔍 check-partner-exists - identifier: {identifier}, user found: {user is not None}")
    
    return {"exists": user is not None}

@api_router.post("/auth/verify-otp", response_model=TokenResponse)
async def verify_otp(data: dict):
    """
    Verify OTP and login/signup user
    """
    identifier = data.get("identifier", "")
    otp = data.get("otp", "")
    name = data.get("name")
    role = data.get("role", "customer")
    
    # Find OTP record
    otp_record = await db.otps.find_one({"identifier": identifier}, {"_id": 0})
    
    if not otp_record:
        raise HTTPException(status_code=404, detail="OTP not found. Please request a new OTP.")
    
    # Check if OTP expired
    expires_at = otp_record["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    # Ensure timezone awareness
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")
    
    # Check if OTP is correct
    if otp_record["otp"] != otp:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    # Mark OTP as verified
    await db.otps.update_one(
        {"identifier": identifier},
        {"$set": {"verified": True}}
    )
    
    # Check if this is a new user
    if otp_record.get("is_new_user", False):
        # Create new user
        if not name:
            raise HTTPException(status_code=400, detail="Name is required for new users")
        
        # Determine if identifier is email or phone
        is_email = "@" in identifier
        
        user = User(
            name=name,
            email=identifier if is_email else f"{identifier}@phone.user",
            phone=identifier if not is_email else None,
            role=UserRole(role),
            hashed_password=hash_password(str(uuid.uuid4()))  # Random password
        )
        
        await db.users.insert_one(user.model_dump())
        
        # Create wallet for customers with welcome bonus
        if user.role == UserRole.customer:
            wallet = Wallet(user_id=user.id, credits_balance=50)
            await db.wallets.insert_one(wallet.model_dump())
            
            # Log welcome bonus transaction
            await db.credit_transactions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "transaction_type": "earn",
                "amount": 50,
                "source": "welcome_bonus",
                "description": "Welcome to rayy! Here's your first 50 credits",
                "balance_after": 50,
                "created_at": datetime.now(timezone.utc),
                "metadata": {"reason": "signup_bonus"}
            })
        
        user_dict = user.model_dump()
    else:
        # Get existing user
        user_dict = await db.users.find_one({"id": otp_record["user_id"]}, {"_id": 0})
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
    
    # Generate JWT token
    token = create_token(user_dict["id"], user_dict["role"])
    user_resp = UserResponse(
        id=user_dict["id"],
        role=UserRole(user_dict["role"]),
        name=user_dict["name"],
        email=user_dict["email"],
        phone=user_dict.get("phone"),
        child_profiles=[ChildProfile(**cp) for cp in user_dict.get("child_profiles", [])]
    )
    
    # CRITICAL: Set is_new_user flag based on whether we just created the account
    is_new_user_flag = otp_record.get("is_new_user", False)
    
    return TokenResponse(access_token=token, user=user_resp, is_new_user=is_new_user_flag)

@api_router.post("/auth/google/session")
async def google_auth_session(request: Request, response: Response):
    """
    Emergent Auth Google OAuth session handler
    Validates session_id from Emergent Auth and creates user session
    """
    # Get session_id from header
    session_id = request.headers.get("X-Session-ID")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    try:
        # Call Emergent Auth to get user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            google_user_data = auth_response.json()
            
            # Extract user info
            email = google_user_data.get("email")
            name = google_user_data.get("name")
            picture = google_user_data.get("picture")
            session_token = google_user_data.get("session_token")
            
            if not email:
                raise HTTPException(status_code=400, detail="Email not found in session data")
            
            # Check if user exists
            user = await db.users.find_one({"email": email}, {"_id": 0})
            
            is_new_user = False
            if not user:
                # Create new user
                is_new_user = True
                user = User(
                    name=name or email.split("@")[0],
                    email=email,
                    role=UserRole.customer,
                    hashed_password=hash_password(str(uuid.uuid4()))  # Random password for OAuth users
                )
                
                await db.users.insert_one(user.model_dump())
                
                # Create wallet for customers with welcome bonus
                wallet = Wallet(user_id=user.id, credits_balance=50)
                await db.wallets.insert_one(wallet.model_dump())
                
                # Log welcome bonus transaction
                await db.credit_transactions.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user.id,
                    "transaction_type": "earn",
                    "amount": 50,
                    "source": "welcome_bonus",
                    "description": "Welcome to rayy! Here's your first 50 credits",
                    "balance_after": 50,
                    "created_at": datetime.now(timezone.utc),
                    "metadata": {"reason": "signup_bonus"}
                })
                
                user_dict = user.model_dump()
            else:
                user_dict = user
            
            # Store session in database
            await db.oauth_sessions.update_one(
                {"session_token": session_token},
                {
                    "$set": {
                        "session_token": session_token,
                        "user_id": user_dict["id"],
                        "email": email,
                        "created_at": datetime.now(timezone.utc),
                        "expires_at": datetime.now(timezone.utc) + timedelta(days=7)
                    }
                },
                upsert=True
            )
            
            # Set httpOnly cookie
            response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                max_age=7 * 24 * 60 * 60,  # 7 days
                path="/"
            )
            
            # Generate our own JWT token for the app
            jwt_token = create_token(user_dict["id"], user_dict["role"])
            
            user_resp = UserResponse(
                id=user_dict["id"],
                role=UserRole(user_dict["role"]),
                name=user_dict["name"],
                email=user_dict["email"],
                phone=user_dict.get("phone"),
                child_profiles=[ChildProfile(**cp) for cp in user_dict.get("child_profiles", [])]
            )
            
            return {
                "access_token": jwt_token,
                "token_type": "bearer",
                "user": user_resp.model_dump(),
                "is_new_user": is_new_user
            }
            
    except httpx.HTTPError as e:
        logging.error(f"Error connecting to Emergent Auth: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error")
    except Exception as e:
        logging.error(f"Error in Google auth: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """
    Logout user and clear session
    """
    session_token = request.cookies.get("session_token")
    
    if session_token:
        # Delete session from database
        await db.oauth_sessions.delete_one({"session_token": session_token})
    
    # Clear cookie
    response.delete_cookie(key="session_token", path="/")
    
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: Dict = Depends(get_current_user)):
    # LOG: What role is in current_user from JWT
    print(f"🔍 /auth/me - current_user role from JWT: {current_user.get('role')}")
    
    # LOG: Query fresh from database to compare
    db_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "role": 1, "email": 1})
    print(f"🔍 /auth/me - DB role for user: {db_user.get('role') if db_user else 'NOT FOUND'}")
    
    return UserResponse(
        id=current_user["id"],
        role=UserRole(current_user["role"]),
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        child_profiles=[ChildProfile(**cp) for cp in current_user.get("child_profiles", [])],
        onboarding_complete=current_user.get("onboarding_complete", False)
    )


@api_router.put("/users/me")
async def update_user_profile(
    child_profiles: Optional[List[ChildProfile]] = None,
    preferences: Optional[Dict[str, Any]] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Update user profile with child profiles and preferences"""
    update_data = {}
    
    if child_profiles is not None:
        # Convert Pydantic models to dicts
        update_data["child_profiles"] = [cp.model_dump() if hasattr(cp, 'model_dump') else cp for cp in child_profiles]
    
    if preferences is not None:
        update_data["preferences"] = preferences
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    return {"message": "Profile updated successfully"}


@api_router.put("/auth/update-profile")
async def update_partner_profile(
    profile_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user),
    request: Request = None
):
    """Update partner profile with onboarding data including T&C acceptance"""
    
    # Extract T&C acceptance if present
    tnc_acceptance = profile_data.pop('tncAcceptance', None)
    
    # Prepare update data
    update_data = {
        **profile_data,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Store T&C acceptance metadata
    if tnc_acceptance:
        update_data["tnc_acceptance"] = {
            **tnc_acceptance,
            "ip_address": request.client.host if request else "unknown",
            "accepted_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Update user in database
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user["id"]})
    
    # Send email notifications if onboarding completed
    if profile_data.get('onboardingCompleted') and tnc_acceptance:
        try:
            from email_service import email_service
            
            # Send confirmation email to partner
            email_service.send_partner_registration_confirmation(
                partner_email=updated_user.get('email'),
                partner_data={
                    'name': updated_user.get('name'),
                    'email': updated_user.get('email'),
                    'organizationName': updated_user.get('organizationName'),
                    'phone': updated_user.get('phone') or updated_user.get('contactNumber'),
                    'city': updated_user.get('city'),
                    'state': updated_user.get('state'),
                    'categories': updated_user.get('categories', []),
                    'created_at': updated_user.get('created_at')
                }
            )
            
            # Notify admin of new pending partner
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@rrray.com')
            email_service.send_admin_new_partner_notification(
                admin_email=admin_email,
                partner_data={
                    'name': updated_user.get('name'),
                    'email': updated_user.get('email'),
                    'organizationName': updated_user.get('organizationName'),
                    'phone': updated_user.get('phone') or updated_user.get('contactNumber'),
                    'city': updated_user.get('city'),
                    'state': updated_user.get('state'),
                    'categories': updated_user.get('categories', []),
                    'created_at': updated_user.get('created_at')
                }
            )
            
        except Exception as e:
            logging.error(f"Failed to send partner registration email: {e}")
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user["id"],
            "name": updated_user.get("name"),
            "email": updated_user.get("email"),
            "role": updated_user.get("role"),
            "status": updated_user.get("status", "pending"),
            "onboardingCompleted": updated_user.get("onboardingCompleted", False)
        }
    }


@api_router.get("/auth/children")
async def get_children(current_user: Dict = Depends(get_current_user)):
    """Get all child profiles for current user
    
    CRITICAL: Always returns array [...] even on error.
    """
    try:
        if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "child_profiles": 1})
        
        return user.get("child_profiles", []) if user else []
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logging.error(f"Error in get_children: {e}")
        return []

@api_router.post("/auth/add-child")
async def add_child(child: ChildProfile, current_user: Dict = Depends(get_current_user)):
    # Allow customers and partners to add child profiles
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$push": {"child_profiles": child.model_dump()}}
    )
    
    return {"message": "Child added successfully"}

@api_router.put("/auth/edit-child/{child_index}")
async def edit_child(child_index: int, child: ChildProfile, current_user: Dict = Depends(get_current_user)):
    """Edit a child profile by index"""
    # Allow customers and partners to edit child profiles
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get current user with child profiles
    user = await db.users.find_one({"id": current_user["id"]})
    if not user or "child_profiles" not in user or len(user["child_profiles"]) <= child_index:
        raise HTTPException(status_code=404, detail="Child profile not found")
    
    # Update the specific child profile
    user["child_profiles"][child_index] = child.model_dump()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"child_profiles": user["child_profiles"]}}
    )
    
    return {"message": "Child profile updated successfully"}

@api_router.delete("/auth/delete-child/{child_index}")
async def delete_child(child_index: int, current_user: Dict = Depends(get_current_user)):
    """Delete a child profile by index"""
    # Allow customers and partners to delete child profiles
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get current user with child profiles
    user = await db.users.find_one({"id": current_user["id"]})
    if not user or "child_profiles" not in user or len(user["child_profiles"]) <= child_index:
        raise HTTPException(status_code=404, detail="Child profile not found")
    
    # Remove the child profile at the specified index
    user["child_profiles"].pop(child_index)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"child_profiles": user["child_profiles"]}}
    )
    
    return {"message": "Child profile deleted successfully"}

@api_router.put("/auth/profile")
async def update_customer_profile(profile_data: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """Update user profile information"""
    # Allow customers and partners to update their own profiles
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Prepare update data
    update_data = {}
    
    # Allow updating name and phone
    if "name" in profile_data:
        update_data["name"] = profile_data["name"]
    if "phone" in profile_data:
        update_data["phone"] = profile_data["phone"]
    
    # Handle preferences
    if "preferences" in profile_data:
        update_data["preferences"] = profile_data["preferences"]
    
    # Add updated timestamp
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update user in database
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    return {"message": "Profile updated successfully", "user": updated_user}

@api_router.post("/auth/update-location")
async def update_user_location(location: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """Save user's location preference (lat, lng, city, pin, accuracy, ts)"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"location": location, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Location updated successfully"}


@api_router.post("/auth/complete-onboarding")
async def complete_onboarding(current_user: Dict = Depends(get_current_user)):
    """Mark user's onboarding as complete"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"onboarding_complete": True, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Onboarding completed successfully"}


# ============== CATEGORY ROUTES ==============
@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# ============== SEARCH & DISCOVERY ==============
@api_router.get("/search")
async def search_listings(
    city: Optional[str] = None,
    age: Optional[int] = None,
    category: Optional[str] = None,
    date: Optional[str] = None,
    is_online: Optional[bool] = None,
    trial: Optional[bool] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 10,
    skip: int = 0,
    limit: int = 60
):
    """
    Search listings - location filtering DISABLED for now (showing all listings)
    If lat/lng provided, distance is calculated but not used for filtering
    """
    
    # Build aggregation pipeline
    pipeline = []
    
    # Step 1: Show ALL active listings regardless of location
    # NOTE: Location filtering disabled to show more classes to users
    # We still calculate distance if coordinates are provided, but don't filter by it
    # Only show approved and live listings to public
    pipeline.append({
        "$match": {
            "status": "active",
            "approval_status": "approved",
            "is_live": True
        }
    })
    
    # Step 2: Age filtering
    if age:
        pipeline.append({
            "$match": {
                "age_min": {"$lte": age},
                "age_max": {"$gte": age}
            }
        })
    
    # Step 3: Category filtering
    if category:
        # Direct string match on category field
        pipeline.append({"$match": {"category": category}})
    
    # Step 4: Online/offline filtering
    if is_online is not None:
        pipeline.append({"$match": {"is_online": is_online}})
    
    # Step 5: Trial filtering
    if trial:
        pipeline.append({"$match": {"trial_available": True}})
    
    # Step 5.5: Sort - prioritize trial classes first, then by rating
    pipeline.append({
        "$sort": {
            "trial_available": -1,  # True (1) comes before False (0)
            "rating": -1
        }
    })
    
    # Step 6: Limit results
    pipeline.extend([
        {"$skip": skip},
        {"$limit": limit}
    ])
    
    # Add $lookup stages to join partner and venue data in single query
    pipeline.append({
        "$lookup": {
            "from": "partners",
            "localField": "partner_id",
            "foreignField": "id",
            "as": "partner_data"
        }
    })
    
    pipeline.append({
        "$lookup": {
            "from": "venues",
            "localField": "venue_id",
            "foreignField": "id",
            "as": "venue_data"
        }
    })
    
    # Execute optimized aggregation with joins
    listings = await db.listings.aggregate(pipeline).to_list(None)
    
    # Process and enrich listings with joined data
    for listing in listings:
        listing.pop('_id', None)
        
        # Convert images to media format for frontend
        if listing.get("images") and not listing.get("media"):
            listing["media"] = listing["images"]
        
        # Extract partner info from joined data
        if listing.get("partner_data") and len(listing["partner_data"]) > 0:
            partner = listing["partner_data"][0]
            listing["partner_name"] = partner.get("brand_name", "")
            listing["partner_city"] = partner.get("city", "")
        listing.pop("partner_data", None)  # Remove temporary field
        
        # Extract venue info from joined data
        if listing.get("venue_data") and len(listing["venue_data"]) > 0:
            venue = listing["venue_data"][0]
            venue.pop("_id", None)
            listing["venue"] = venue
            listing["venue_name"] = venue.get("name", "")
            listing["venue_address"] = venue.get("address", "")
            listing["venue_city"] = venue.get("city", "")
            
            # Calculate distance if user coordinates provided and venue has coordinates
            if lat is not None and lng is not None and venue.get("lat") and venue.get("lng"):
                distance_km = calculate_distance_km(lat, lng, venue["lat"], venue["lng"])
                listing["distance_km"] = round(distance_km * 10) / 10
                listing["distance_text"] = format_distance(distance_km)
        listing.pop("venue_data", None)  # Remove temporary field
    
    return {"listings": listings, "total": len(listings)}

@api_router.get("/listings/my")
async def get_my_listings(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0}).to_list(100)
    return {"listings": listings}

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Enrich with partner details
    partner = await db.users.find_one(
        {"id": listing["partner_id"], "role": "partner"}, 
        {"_id": 0, "name": 1, "email": 1, "city": 1, "badges": 1}
    )
    if partner:
        listing["partner"] = {
            "brand_name": partner.get("name", "Partner"),
            "city": partner.get("city", ""),
            "verification_badges": partner.get("badges", [])
        }
    
    # Enrich with venue details if applicable
    if listing.get("venue_id"):
        venue = await db.venues.find_one({"id": listing["venue_id"]}, {"_id": 0})
        if venue:
            listing["venue"] = venue
    
    # Category is already a string field on listing, no need to look up
    # Just ensure it exists
    if not listing.get("category"):
        listing["category"] = "General"
    
    # Convert images array to media array format for frontend
    if listing.get("images") and not listing.get("media"):
        listing["media"] = listing["images"]
    
    return listing

@api_router.get("/listings/{listing_id}/sessions")
async def get_listing_sessions(
    listing_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    """Get sessions for a listing - supports both old (start_at) and new (date/time) structures
    
    CRITICAL: Always returns {"sessions": [...]} even if empty or on error.
    This prevents frontend crashes from receiving validation error objects.
    """
    try:
        # Get the listing to get base price
        listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "base_price_inr": 1})
        base_price = listing.get("base_price_inr", 1000) if listing else 1000
        
        # Get current date for filtering
        today = datetime.now(timezone.utc).date()
        today_str = today.isoformat()
        
        # Default to 90 days ahead if no to_date specified
        if not to_date:
            default_end_date = today + timedelta(days=90)
            to_date = default_end_date.isoformat()
        
        # Query both old and new session structures
        base_query = {"listing_id": listing_id, "status": "scheduled"}
        
        # Get sessions with new structure (date/time fields) - PRIORITIZE THESE
        new_sessions_query = {**base_query, "date": {"$exists": True}}
        if from_date:
            new_sessions_query["date"] = {"$gte": from_date}
        else:
            new_sessions_query["date"] = {"$gte": today_str}
        
        if to_date:
            if "date" in new_sessions_query and isinstance(new_sessions_query["date"], dict):
                new_sessions_query["date"]["$lte"] = to_date
            else:
                new_sessions_query["date"] = {"$lte": to_date}
        
        new_sessions = await db.sessions.find(new_sessions_query, {"_id": 0}).to_list(1000)
        
        # Get sessions with old structure (start_at field) ONLY if no new sessions found
        old_sessions = []
        if len(new_sessions) < 100:  # Get old sessions as fallback if not many new sessions
            old_sessions_query = {**base_query, "start_at": {"$exists": True}}
            if from_date:
                old_sessions_query["start_at"] = {"$gte": datetime.fromisoformat(from_date)}
            else:
                old_sessions_query["start_at"] = {"$gte": datetime.now(timezone.utc)}
                
            if to_date:
                if "start_at" in old_sessions_query and isinstance(old_sessions_query["start_at"], dict):
                    old_sessions_query["start_at"]["$lte"] = datetime.fromisoformat(to_date)
                else:
                    old_sessions_query["start_at"] = {"$lte": datetime.fromisoformat(to_date)}
            
            old_sessions = await db.sessions.find(old_sessions_query, {"_id": 0}).limit(1000).to_list(1000)
        
        # Normalize and combine sessions
        all_sessions = []
        
        # Process new structure sessions (with pricing)
        for session in new_sessions:
            # Convert date/time to datetime for sorting
            try:
                session_date = datetime.fromisoformat(session["date"])
                session_time_str = session["time"]
                
                # Parse time
                if isinstance(session_time_str, str):
                    time_parts = session_time_str.split(':')
                    hour = int(time_parts[0])
                    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                else:
                    hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                    minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
                
                # Combine date and time
                session_datetime = session_date.replace(
                    hour=hour,
                    minute=minute,
                    second=0,
                    microsecond=0,
                    tzinfo=timezone.utc
                )
                
                session["start_at"] = session_datetime
                seats_booked = session.get("seats_booked", 0)
                session["seats_available"] = session["seats_total"] - seats_booked
                
                # Ensure price_inr is present
                if "price_inr" not in session or session["price_inr"] is None:
                    session["price_inr"] = base_price
                
                # Add is_bookable flag
                has_seats = session["seats_available"] > 0
                is_future = session_datetime > datetime.now(timezone.utc)
                session["is_bookable"] = has_seats and is_future
                
                all_sessions.append(session)
            except Exception as e:
                logging.warning(f"Error processing session {session.get('id')}: {e}")
                continue
        
        # Process old structure sessions (add pricing from listing base_price)
        for session in old_sessions:
            seats_booked = session.get("seats_booked", 0)
            session["seats_available"] = session["seats_total"] - seats_booked
            
            # Add price_inr if missing
            if "price_inr" not in session:
                session["price_inr"] = session.get("price_override_inr") or base_price
                session["plan_type"] = "single"
                session["plan_name"] = "Single Session"
                session["sessions_count"] = 1
            
            # Ensure timezone-aware
            if session["start_at"].tzinfo is None:
                session["start_at"] = session["start_at"].replace(tzinfo=timezone.utc)
            
            # Add is_bookable flag
            has_seats = session["seats_available"] > 0
            is_future = session["start_at"] > datetime.now(timezone.utc)
            session["is_bookable"] = has_seats and is_future
            
            all_sessions.append(session)
        
        # Sort by start_at
        all_sessions.sort(key=lambda x: x["start_at"])
        
        return {"sessions": all_sessions}
    except Exception as e:
        # CRITICAL: Return empty array instead of error object to prevent frontend crashes
        logging.error(f"Error in get_listing_sessions for listing {listing_id}: {e}")
        return {"sessions": []}

@api_router.get("/listings/{listing_id}/plans")
async def get_listing_plans(listing_id: str):
    """Get available pricing plans for a listing with session counts and discounts"""
    
    # Get listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    base_price = listing.get("base_price_inr", 1000)
    trial_price = listing.get("trial_price_inr")
    trial_available = listing.get("trial_available", False)
    
    # Count available sessions
    today = datetime.now(timezone.utc).date().isoformat()
    total_sessions = await db.sessions.count_documents({
        "listing_id": listing_id,
        "status": "scheduled",
        "date": {"$gte": today}
    })
    
    # Define pricing plans with discounts
    plans = []
    
    # Trial plan (if available)
    if trial_available and trial_price:
        plans.append({
            "id": "trial",
            "name": "Trial Class",
            "description": "Try before you commit",
            "sessions_count": 1,
            "price_inr": trial_price,
            "price_per_session": trial_price,
            "discount_percent": int(((base_price - trial_price) / base_price) * 100),
            "savings_inr": base_price - trial_price,
            "validity_days": 30,
            "is_trial": True,
            "badge": "Most Popular"
        })
    
    # Single session
    plans.append({
        "id": "single",
        "name": "Single Session",
        "description": "Pay as you go",
        "sessions_count": 1,
        "price_inr": base_price,
        "price_per_session": base_price,
        "discount_percent": 0,
        "savings_inr": 0,
        "validity_days": 30,
        "is_trial": False
    })
    
    # Weekly plan (4 sessions, 10% off) - Always show
    weekly_price_per_session = int(base_price * 0.9)
    weekly_total = weekly_price_per_session * 4
    plans.append({
        "id": "weekly",
        "name": "Weekly Plan",
        "description": "4 sessions per month",
        "sessions_count": 4,
        "price_inr": weekly_total,
        "price_per_session": weekly_price_per_session,
        "discount_percent": 10,
        "savings_inr": (base_price * 4) - weekly_total,
        "validity_days": 60,
        "is_trial": False,
        "badge": "Save 10%",
        "available": total_sessions >= 4
    })
    
    # Monthly plan (12 sessions, 25% off) - Always show
    monthly_price_per_session = int(base_price * 0.75)
    monthly_total = monthly_price_per_session * 12
    plans.append({
        "id": "monthly",
        "name": "Monthly Plan",
        "description": "12 sessions over 3 months",
        "sessions_count": 12,
        "price_inr": monthly_total,
        "price_per_session": monthly_price_per_session,
        "discount_percent": 25,
        "savings_inr": (base_price * 12) - monthly_total,
        "validity_days": 90,
        "is_trial": False,
        "badge": "Best Value",
        "available": total_sessions >= 12
    })
    
    # Quarterly plan (36 sessions, 35% off)
    if total_sessions >= 36:
        quarterly_price_per_session = int(base_price * 0.65)
        quarterly_total = quarterly_price_per_session * 36
        plans.append({
            "id": "quarterly",
            "name": "Quarterly Plan",
            "description": "36 sessions over 6 months",
            "sessions_count": 36,
            "price_inr": quarterly_total,
            "price_per_session": quarterly_price_per_session,
            "discount_percent": 35,
            "savings_inr": (base_price * 36) - quarterly_total,
            "validity_days": 180,
            "is_trial": False,
            "badge": "Maximum Savings"
        })
    
    return {
        "plans": plans,
        "total_available_sessions": total_sessions,
        "base_price_inr": base_price
    }


# ============== FLEXIBLE BOOKING V2 ENDPOINTS ==============

@api_router.get("/listings/{listing_id}/v2")
async def get_listing_v2(listing_id: str):
    """Get listing with full plan options and batches"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return listing

@api_router.put("/listings/{listing_id}/v2")
async def update_listing_v2(
    listing_id: str,
    data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Update listing with plan options and batches"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can update listings")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Verify ownership
    if current_user["role"] != "admin":
        partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
        if not partner or listing["partner_id"] != partner["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Update fields
    data["updated_at"] = datetime.now(timezone.utc)
    await db.listings.update_one({"id": listing_id}, {"$set": data})
    
    return {"message": "Listing updated successfully"}

@api_router.post("/listings/{listing_id}/plan-options")
async def add_plan_option(
    listing_id: str,
    plan: PlanOptionCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Add a new plan option to a listing"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage plans")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Create plan with ID
    plan_dict = plan.model_dump()
    plan_dict["id"] = str(uuid.uuid4())
    plan_dict["is_active"] = True
    
    # Add to listing
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$push": {"plan_options": plan_dict},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Plan option added", "plan_id": plan_dict["id"]}

@api_router.put("/listings/{listing_id}/plan-options/{plan_id}")
async def update_plan_option(
    listing_id: str,
    plan_id: str,
    plan_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Update a plan option"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage plans")
    
    # Update the plan in the array
    result = await db.listings.update_one(
        {"id": listing_id, "plan_options.id": plan_id},
        {
            "$set": {
                "plan_options.$": {**plan_data, "id": plan_id},
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan updated successfully"}

@api_router.delete("/listings/{listing_id}/plan-options/{plan_id}")
async def delete_plan_option(
    listing_id: str,
    plan_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a plan option"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage plans")
    
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$pull": {"plan_options": {"id": plan_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Plan deleted successfully"}

@api_router.post("/listings/{listing_id}/batches")
async def add_batch(
    listing_id: str,
    batch: BatchCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Add a new batch to a listing"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage batches")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Create batch with ID
    batch_dict = batch.model_dump()
    batch_dict["id"] = str(uuid.uuid4())
    batch_dict["enrolled_count"] = 0
    batch_dict["is_active"] = True
    
    # Add to listing
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$push": {"batches": batch_dict},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Batch added", "batch_id": batch_dict["id"]}

@api_router.put("/listings/{listing_id}/batches/{batch_id}")
async def update_batch(
    listing_id: str,
    batch_id: str,
    batch_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Update a batch"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage batches")
    
    # Update the batch in the array
    result = await db.listings.update_one(
        {"id": listing_id, "batches.id": batch_id},
        {
            "$set": {
                "batches.$": {**batch_data, "id": batch_id},
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return {"message": "Batch updated successfully"}

@api_router.delete("/listings/{listing_id}/batches/{batch_id}")
async def delete_batch(
    listing_id: str,
    batch_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a batch"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can manage batches")
    
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$pull": {"batches": {"id": batch_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Batch deleted successfully"}

@api_router.get("/listings/{listing_id}/batches/{batch_id}/availability")
async def check_batch_availability(listing_id: str, batch_id: str):
    """Check batch capacity and availability"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "batches": 1})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find the batch
    batch = next((b for b in listing.get("batches", []) if b["id"] == batch_id), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    available_seats = batch["capacity"] - batch.get("enrolled_count", 0)
    
    return {
        "batch_id": batch_id,
        "capacity": batch["capacity"],
        "enrolled": batch.get("enrolled_count", 0),
        "available": available_seats,
        "is_full": available_seats <= 0
    }

@api_router.post("/listings/{listing_id}/batches/{batch_id}/generate-sessions")
async def generate_batch_sessions(
    listing_id: str,
    batch_id: str,
    weeks: int = 12,
    current_user: Dict = Depends(get_current_user)
):
    """Auto-generate sessions for a batch based on schedule"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can generate sessions")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find the batch
    batch = next((b for b in listing.get("batches", []) if b["id"] == batch_id), None)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Generate sessions
    from datetime import date, timedelta
    sessions_created = []
    
    # Parse start date
    start_date = datetime.fromisoformat(batch["start_date"]).date()
    end_date_limit = start_date + timedelta(weeks=weeks)
    
    # Day name to weekday number mapping
    day_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    
    # Get weekday numbers for this batch
    batch_weekdays = [day_map[day.lower()] for day in batch["days_of_week"]]
    
    # Generate sessions for each matching day
    current_date = start_date
    while current_date < end_date_limit:
        if current_date.weekday() in batch_weekdays:
            # Parse time
            time_parts = batch["time"].split(":")
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            
            # Create datetime
            session_datetime = datetime.combine(
                current_date,
                datetime.min.time().replace(hour=hour, minute=minute)
            ).replace(tzinfo=timezone.utc)
            
            end_datetime = session_datetime + timedelta(minutes=batch["duration_minutes"])
            
            # Create session document
            session_doc = {
                "id": str(uuid.uuid4()),
                "listing_id": listing_id,
                "batch_id": batch_id,
                "start_at": session_datetime,
                "end_at": end_datetime,
                "date": current_date.isoformat(),
                "time": batch["time"],
                "duration_minutes": batch["duration_minutes"],
                "seats_total": batch["capacity"],
                "seats_booked": 0,
                "status": "scheduled",
                "is_rescheduled": False,
                "original_date": None
            }
            
            # Insert session
            await db.sessions.insert_one(session_doc)
            sessions_created.append(session_doc["id"])
        
        current_date += timedelta(days=1)
    
    return {
        "message": f"Generated {len(sessions_created)} sessions",
        "sessions_count": len(sessions_created),
        "batch_id": batch_id
    }

@api_router.get("/listings/{listing_id}/batches/{batch_id}/sessions")
async def get_batch_sessions(
    listing_id: str,
    batch_id: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    """Get sessions for a specific batch
    
    CRITICAL: Always returns {"sessions": [...], "count": N} even on error.
    """
    try:
        query = {
            "listing_id": listing_id,
            "batch_id": batch_id,
            "status": "scheduled"
        }
        
        if from_date:
            query["date"] = {"$gte": from_date}
        
        if to_date:
            if "date" in query:
                query["date"]["$lte"] = to_date
            else:
                query["date"] = {"$lte": to_date}
        
        sessions = await db.sessions.find(query, {"_id": 0}).sort("date", 1).to_list(500)
        
        return {"sessions": sessions, "count": len(sessions)}
    except Exception as e:
        logging.error(f"Error in get_batch_sessions for listing {listing_id}, batch {batch_id}: {e}")
        return {"sessions": [], "count": 0}

@api_router.post("/bookings/v2")
async def create_booking_v2(
    booking_data: BookingCreateV2,
    current_user: Dict = Depends(get_current_user)
):
    """Create a booking with flexible plans and batch assignment"""
    # if current_user["role"] != "customer":
    #     raise HTTPException(status_code=403, detail="Only customers can create bookings")
    
    # Get listing
    listing = await db.listings.find_one({"id": booking_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find plan option
    plan_option = next(
        (p for p in listing.get("plan_options", []) if p["id"] == booking_data.plan_option_id),
        None
    )
    if not plan_option:
        raise HTTPException(status_code=404, detail="Plan option not found")
    
    # Find batch (only for FIXED timing plans)
    batch = None
    timing_type = plan_option.get("timing_type", "FLEXIBLE")
    
    if timing_type == "FIXED" or (booking_data.batch_id and booking_data.batch_id != ""):
        batch = next(
            (b for b in listing.get("batches", []) if b["id"] == booking_data.batch_id),
            None
        )
        if not batch and booking_data.batch_id:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        # Check batch capacity
        if batch and batch.get("enrolled_count", 0) >= batch["capacity"]:
            raise HTTPException(status_code=400, detail="Batch is full")
    
    # Validate session count matches plan
    # if len(booking_data.session_ids) != plan_option["sessions_count"]:
    #     raise HTTPException(
    #         status_code=400,
    #         detail=f"Plan requires {plan_option['sessions_count']} sessions, but {len(booking_data.session_ids)} provided"
    #     )
    
    # Verify all sessions exist and belong to the listing
    sessions = await db.sessions.find(
        {"id": {"$in": booking_data.session_ids}},
        {"_id": 0}
    ).to_list(100)
    
    # For FIXED timing, verify all sessions belong to the same batch
    if timing_type == "FIXED" and batch:
        for session in sessions:
            if session.get("batch_id") != booking_data.batch_id:
                raise HTTPException(status_code=400, detail="All sessions must be from the same batch")
    
    # For FLEXIBLE timing, just verify sessions belong to the listing
    for session in sessions:
        if session.get("listing_id") != booking_data.listing_id:
            raise HTTPException(status_code=400, detail="All sessions must be from this listing")
    
    # Calculate pricing
    total_price = plan_option["price_inr"]
    tax = total_price * (listing.get("tax_percent", 18.0) / 100)
    total_with_tax = total_price + tax
    
    # Handle credits
    credits_used = 0
    if booking_data.use_credits:
        wallet = await db.wallets.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if wallet and wallet.get("credits_balance", 0) > 0:
            credits_used = min(wallet["credits_balance"], int(total_with_tax))
            total_with_tax -= credits_used
    
    # Create bookings for each session
    booking_ids = []
    for session in sessions:
        booking = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "session_id": session["id"],
            "listing_id": booking_data.listing_id,
            "child_profile_name": booking_data.child_profile_name,
            "child_profile_age": booking_data.child_profile_age,
            "qty": 1,
            "unit_price_inr": plan_option["price_inr"] / plan_option["sessions_count"],
            "taxes_inr": tax / plan_option["sessions_count"],
            "total_inr": total_with_tax / plan_option["sessions_count"],
            "credits_used": credits_used / plan_option["sessions_count"] if credits_used > 0 else 0,
            "payment_method": booking_data.payment_method,
            "booking_status": "confirmed",
            "booked_at": datetime.now(timezone.utc),
            "is_trial": plan_option["plan_type"] == "trial",
            "plan_option_id": booking_data.plan_option_id,
            "batch_id": booking_data.batch_id,
            "session_ids": booking_data.session_ids
        }
        
        await db.bookings.insert_one(booking)
        booking_ids.append(booking["id"])
        
        # Update session seats
        await db.sessions.update_one(
            {"id": session["id"]},
            {"$inc": {"seats_booked": 1}}
        )
    
    # Update batch enrollment count
    await db.listings.update_one(
        {"id": booking_data.listing_id, "batches.id": booking_data.batch_id},
        {"$inc": {"batches.$.enrolled_count": 1}}
    )
    
    # Deduct credits if used
    if credits_used > 0:
        await db.wallets.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"credits_balance": -credits_used}}
        )
        
        # Log credit usage
        await db.credit_ledger.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "delta": -credits_used,
            "reason": "booking",
            "ref_booking_id": booking_ids[0],
            "created_at": datetime.now(timezone.utc)
        })
    
    return {
        "message": "Booking successful",
        "booking_ids": booking_ids,
        "total_paid": total_with_tax,
        "credits_used": credits_used
    }

@api_router.get("/listings/{listing_id}/booking-options")
async def get_booking_options(listing_id: str):
    """Get available plans and batches for customer booking"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get active plan options
    plan_options = [p for p in listing.get("plan_options", []) if p.get("is_active", True)]
    
    # Get active batches with availability
    batches = []
    for batch in listing.get("batches", []):
        if not batch.get("is_active", True):
            continue
        
        available_seats = batch["capacity"] - batch.get("enrolled_count", 0)
        batches.append({
            **batch,
            "available_seats": available_seats,
            "is_full": available_seats <= 0
        })
    
    return {
        "listing": {
            "id": listing["id"],
            "title": listing["title"],
            "description": listing.get("description"),
            "media": listing.get("media", []),
            "tax_percent": listing.get("tax_percent", 18.0)
        },
        "plan_options": plan_options,
        "batches": batches
    }


@api_router.get("/trial-eligibility/{listing_id}")
async def check_trial_eligibility(listing_id: str, current_user: Dict = Depends(get_current_user)):
    """Check if user is eligible for trial booking"""
    
    # Check if user has already booked trial for this listing
    existing_trial = await db.bookings.find_one({
        "user_id": current_user["id"],
        "listing_id": listing_id,
        "is_trial": True
    })
    
    if existing_trial:
        return {
            "eligible": False,
            "reason": "You have already taken a trial class for this listing",
            "trials_left": 0
        }
    
    # Check trials booked in the last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trials_this_week = await db.bookings.count_documents({
        "user_id": current_user["id"],
        "is_trial": True,
        "booked_at": {"$gte": week_ago}
    })
    
    if trials_this_week >= 2:
        return {
            "eligible": False,
            "reason": "You have reached the limit of 2 trial classes per week",
            "trials_left": 0
        }
    
    return {
        "eligible": True,
        "trials_left": 2 - trials_this_week,
        "message": "You can book this trial class"
    }

# ============== BOOKING ROUTES ==============
@api_router.post("/bookings")
async def create_booking(data: BookingCreate, current_user: Dict = Depends(get_current_user)):
    # Allow customers and partners to create bookings for themselves/their kids
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate trial eligibility if this is a trial booking
    if data.is_trial:
        # Check if listing offers trial
        listing_check = await db.listings.find_one({"id": data.session_id}, {"_id": 0})
        if not listing_check:
            session_check = await db.sessions.find_one({"id": data.session_id}, {"_id": 0})
            if session_check:
                listing_check = await db.listings.find_one({"id": session_check["listing_id"]}, {"_id": 0})
        
        if not listing_check or not listing_check.get("trial_available"):
            raise HTTPException(status_code=400, detail="Trial not available for this class")
        
        # Check if already booked trial for this listing
        existing_trial = await db.bookings.find_one({
            "user_id": current_user["id"],
            "listing_id": listing_check["id"],
            "is_trial": True
        })
        
        if existing_trial:
            raise HTTPException(status_code=400, detail="You have already booked a trial for this class")
        
        # Check weekly trial limit (2 per week)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        trials_this_week = await db.bookings.count_documents({
            "user_id": current_user["id"],
            "is_trial": True,
            "booked_at": {"$gte": week_ago}
        })
        
        if trials_this_week >= 2:
            raise HTTPException(status_code=400, detail="You have reached the limit of 2 trial classes per week")
    
    # Get session
    session = await db.sessions.find_one({"id": data.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check bookability
    if session["status"] != "scheduled":
        raise HTTPException(status_code=400, detail="Session not available")
    
    now = datetime.now(timezone.utc)
    
    # Handle both old (start_at) and new (date/time) session structures
    if "start_at" in session:
        session_start = session["start_at"]
        # Convert string to datetime if needed
        if isinstance(session_start, str):
            session_start = datetime.fromisoformat(session_start.replace('Z', '+00:00'))
        elif session_start.tzinfo is None:
            session_start = session_start.replace(tzinfo=timezone.utc)
    elif "date" in session and "time" in session:
        # Convert date/time to datetime
        try:
            session_date = datetime.fromisoformat(session["date"])
            session_time_str = session["time"]
            
            # Parse time
            if isinstance(session_time_str, str):
                time_parts = session_time_str.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            else:
                hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
            
            session_start = session_date.replace(
                hour=hour,
                minute=minute,
                second=0,
                microsecond=0,
                tzinfo=timezone.utc
            )
        except Exception as e:
            logging.error(f"Error parsing session date/time: {e}")
            raise HTTPException(status_code=500, detail="Invalid session date/time format")
    else:
        raise HTTPException(status_code=500, detail="Session missing date/time information")
    
    cutoff = session_start - timedelta(minutes=session.get("allow_late_booking_minutes", 60))
    if now >= cutoff:
        raise HTTPException(status_code=400, detail="Booking window closed")
    
    # Atomic seat reservation
    result = await db.sessions.update_one(
        {
            "id": data.session_id,
            "seats_booked": {"$lt": session["seats_total"]}
        },
        {"$inc": {"seats_booked": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No seats available")
    
    # Get listing for pricing
    listing = await db.listings.find_one({"id": session["listing_id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Use trial price if this is a trial booking
    if data.is_trial and listing.get("trial_available"):
        unit_price = listing.get("trial_price_inr") or listing["base_price_inr"]
    else:
        # Use session price if available, otherwise listing base price
        unit_price = session.get("price_inr") or session.get("price_override_inr") or listing["base_price_inr"]
    
    # Calculate taxes (use 0 if tax_percent not defined)
    tax_percent = listing.get("tax_percent", 0)
    taxes = unit_price * (tax_percent / 100)
    total = unit_price + taxes
    
    # Handle payment
    credits_used = 0
    payment_txn_id = None
    
    if data.use_credits:
        # Calculate credit cost based on total price (including taxes)
        # 1 credit = ₹1 (simpler conversion)
        credit_cost = int(total)
        
        # Check wallet
        wallet = await db.wallets.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not wallet or wallet["credits_balance"] < credit_cost:
            # Rollback seat
            await db.sessions.update_one({"id": data.session_id}, {"$inc": {"seats_booked": -1}})
            raise HTTPException(status_code=400, detail="Insufficient credits")
        
        # Deduct credits
        await db.wallets.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"credits_balance": -credit_cost}}
        )
        
        # Log ledger
        ledger_entry = CreditLedger(
            user_id=current_user["id"],
            delta=-credit_cost,
            reason="booking"
        )
        await db.credit_ledger.insert_one(ledger_entry.model_dump())
        
        credits_used = credit_cost
        total = 0  # Credits cover it
    else:
        # Mock payment
        if os.environ.get("PAYMENTS_MODE") == "mock":
            payment_txn_id = f"mock_{uuid.uuid4().hex[:12]}"
        else:
            # TODO: Integrate Razorpay
            payment_txn_id = f"razorpay_{uuid.uuid4().hex[:12]}"
    
    # Create booking
    booking = Booking(
        user_id=current_user["id"],
        session_id=data.session_id,
        listing_id=session["listing_id"],
        child_profile_name=data.child_profile_name,
        child_profile_age=data.child_profile_age,
        qty=1,
        unit_price_inr=unit_price,
        taxes_inr=taxes,
        total_inr=total,
        credits_used=credits_used,
        payment_method=data.payment_method,
        payment_txn_id=payment_txn_id,
        booking_status=BookingStatus.confirmed,
        is_trial=data.is_trial
    )
    
    await db.bookings.insert_one(booking.model_dump())
    
    # AUTO-GENERATE INVOICE for this booking
    try:
        logging.info(f"Starting invoice generation for booking {booking.id}")
        
        # Generate invoice number
        today = datetime.now(timezone.utc)
        date_str = today.strftime("%Y%m%d")
        count = await db.invoices.count_documents({
            "invoice_number": {"$regex": f"^INV-{date_str}-"}
        })
        invoice_number = f"INV-{date_str}-{str(count + 1).zfill(4)}"
        
        logging.info(f"Generated invoice number: {invoice_number}")
        
        # Get partner name from partner user
        partner = await db.users.find_one({"id": listing.get("partner_id")}, {"_id": 0, "name": 1, "business_name": 1})
        partner_name = partner.get("business_name", partner.get("name", "")) if partner else ""
        
        # Create invoice
        invoice = {
            "id": str(uuid.uuid4()),
            "invoice_number": invoice_number,
            "booking_id": booking.id,
            "customer_id": current_user["id"],
            "customer_name": current_user.get("name", ""),
            "customer_email": current_user.get("email", ""),
            "partner_id": listing.get("partner_id", ""),
            "partner_name": partner_name,
            "listing_title": listing["title"],
            "items": [{
                "description": listing["title"],
                "quantity": 1,
                "unit_price": unit_price,
                "total": unit_price
            }],
            "subtotal": unit_price,
            "discount": 0,
            "credits_used": credits_used,
            "credits_value": credits_used,
            "total_inr": total,
            "payment_method": data.payment_method,
            "payment_status": "completed",
            "invoice_date": today,
            "paid_date": today,
            "status": "paid",
            "gst_amount": taxes,
            "session_date": session_start if 'session_start' in locals() else today,
            "session_duration": listing.get("session_duration", 60)
        }
        
        logging.info(f"Invoice object created, inserting into database...")
        await db.invoices.insert_one(invoice)
        logging.info(f"✅ Auto-generated invoice {invoice_number} for booking {booking.id}")
    except Exception as e:
        logging.error(f"❌ Failed to auto-generate invoice for booking {booking.id}: {e}")
        logging.exception("Full traceback:")
        # Don't fail the booking if invoice generation fails
    
    return {"booking": booking.model_dump(), "message": "Booking confirmed!"}

@api_router.post("/bookings/plan")
async def create_plan_booking(data: PlanBookingCreate, current_user: Dict = Depends(get_current_user)):
    """Book multiple sessions as part of a plan (weekly, monthly, quarterly)"""
    # Allow customers and partners to create plan bookings
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get listing
    listing = await db.listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    base_price = listing.get("base_price_inr", 1000)
    
    # Define plan details
    plan_config = {
        "trial": {"sessions": 1, "discount": 0, "price_multiplier": 1.0, "is_trial": True},
        "single": {"sessions": 1, "discount": 0, "price_multiplier": 1.0, "is_trial": False},
        "weekly": {"sessions": 4, "discount": 10, "price_multiplier": 0.9, "is_trial": False},
        "monthly": {"sessions": 12, "discount": 25, "price_multiplier": 0.75, "is_trial": False},
        "quarterly": {"sessions": 36, "discount": 35, "price_multiplier": 0.65, "is_trial": False}
    }
    
    if data.plan_id not in plan_config:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = plan_config[data.plan_id]
    sessions_to_book = plan["sessions"]
    is_trial = plan["is_trial"]
    
    # Validate trial eligibility if trial booking
    if is_trial:
        if not listing.get("trial_available"):
            raise HTTPException(status_code=400, detail="Trial not available for this class")
        
        # Check if already booked trial
        existing_trial = await db.bookings.find_one({
            "user_id": current_user["id"],
            "listing_id": listing["id"],
            "is_trial": True
        })
        
        if existing_trial:
            raise HTTPException(status_code=400, detail="You have already booked a trial for this class")
        
        # Check weekly trial limit
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        trials_this_week = await db.bookings.count_documents({
            "user_id": current_user["id"],
            "is_trial": True,
            "booked_at": {"$gte": week_ago}
        })
        
        if trials_this_week >= 2:
            raise HTTPException(status_code=400, detail="You have reached the limit of 2 trial classes per week")
    
    # Validate session IDs
    if not data.session_ids or len(data.session_ids) != sessions_to_book:
        raise HTTPException(
            status_code=400,
            detail=f"Please select exactly {sessions_to_book} session(s). You selected {len(data.session_ids)}."
        )
    
    # Get the selected sessions
    selected_sessions = await db.sessions.find({
        "id": {"$in": data.session_ids},
        "listing_id": data.listing_id,
        "status": "scheduled"
    }, {"_id": 0}).to_list(sessions_to_book)
    
    if len(selected_sessions) != sessions_to_book:
        raise HTTPException(
            status_code=400,
            detail=f"One or more selected sessions are invalid or no longer available"
        )
    
    # Sort sessions by date/time
    def get_session_datetime(session):
        if "start_at" in session:
            return session["start_at"]
        else:
            # Parse date/time for new format
            date_obj = datetime.fromisoformat(session["date"])
            time_str = session["time"]
            if isinstance(time_str, str):
                time_parts = time_str.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            else:
                hour = time_str.hour if hasattr(time_str, 'hour') else 0
                minute = time_str.minute if hasattr(time_str, 'minute') else 0
            return date_obj.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    selected_sessions.sort(key=get_session_datetime)
    
    # Calculate pricing
    if is_trial:
        unit_price = listing.get("trial_price_inr", base_price)
        total_price = unit_price
    else:
        price_per_session = int(base_price * plan["price_multiplier"])
        total_price = price_per_session * sessions_to_book
    
    tax_percent = listing.get("tax_percent", 0)
    taxes = total_price * (tax_percent / 100)
    grand_total = total_price + taxes
    
    # Handle payment
    credits_used = 0
    payment_txn_id = None
    
    if data.use_credits:
        # 1 credit = ₹1 (includes taxes in grand_total)
        credit_cost = int(grand_total)
        
        wallet = await db.wallets.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not wallet or wallet["credits_balance"] < credit_cost:
            raise HTTPException(status_code=400, detail="Insufficient credits")
        
        await db.wallets.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"credits_balance": -credit_cost}}
        )
        
        ledger_entry = CreditLedger(
            user_id=current_user["id"],
            delta=-credit_cost,
            reason="booking"
        )
        await db.credit_ledger.insert_one(ledger_entry.model_dump())
        
        credits_used = credit_cost
        grand_total = 0
    else:
        if os.environ.get("PAYMENTS_MODE") == "mock":
            payment_txn_id = f"mock_{uuid.uuid4().hex[:12]}"
        else:
            payment_txn_id = f"razorpay_{uuid.uuid4().hex[:12]}"
    
    # Create bookings for each selected session
    booking_ids = []
    for session in selected_sessions:
        # Reserve seat
        result = await db.sessions.update_one(
            {
                "id": session["id"],
                "seats_booked": {"$lt": session["seats_total"]}
            },
            {"$inc": {"seats_booked": 1}}
        )
        
        if result.modified_count == 0:
            # Rollback previous reservations
            for prev_booking_id in booking_ids:
                prev_booking = await db.bookings.find_one({"id": prev_booking_id})
                if prev_booking:
                    await db.sessions.update_one(
                        {"id": prev_booking["session_id"]},
                        {"$inc": {"seats_booked": -1}}
                    )
                    await db.bookings.delete_one({"id": prev_booking_id})
            
            raise HTTPException(status_code=400, detail=f"Failed to reserve seat for session on {session.get('date')}")
        
        # Create booking
        booking = Booking(
            user_id=current_user["id"],
            session_id=session["id"],
            listing_id=data.listing_id,
            child_profile_name=data.child_profile_name,
            child_profile_age=data.child_profile_age,
            qty=1,
            unit_price_inr=total_price / sessions_to_book if not is_trial else unit_price,
            taxes_inr=taxes / sessions_to_book,
            total_inr=grand_total / sessions_to_book if sessions_to_book > 1 else grand_total,
            credits_used=credits_used // sessions_to_book if credits_used > 0 else 0,
            payment_method=data.payment_method,
            payment_txn_id=payment_txn_id,
            booking_status=BookingStatus.confirmed,
            is_trial=is_trial
        )
        
        await db.bookings.insert_one(booking.model_dump())
        booking_ids.append(booking.id)
        
        # AUTO-GENERATE INVOICE for each booking
        try:
            logging.info(f"Starting invoice generation for plan booking {booking.id}")
            
            # Generate invoice number
            today = datetime.now(timezone.utc)
            date_str = today.strftime("%Y%m%d")
            count = await db.invoices.count_documents({
                "invoice_number": {"$regex": f"^INV-{date_str}-"}
            })
            invoice_number = f"INV-{date_str}-{str(count + 1).zfill(4)}"
            
            # Get partner name
            partner = await db.users.find_one({"id": listing.get("partner_id")}, {"_id": 0, "name": 1, "business_name": 1})
            partner_name = partner.get("business_name", partner.get("name", "")) if partner else ""
            
            # Get session date
            session_date = session.get("start_at") if "start_at" in session else datetime.now(timezone.utc)
            
            # Create invoice
            invoice = {
                "id": str(uuid.uuid4()),
                "invoice_number": invoice_number,
                "booking_id": booking.id,
                "customer_id": current_user["id"],
                "customer_name": current_user.get("name", ""),
                "customer_email": current_user.get("email", ""),
                "partner_id": listing.get("partner_id", ""),
                "partner_name": partner_name,
                "listing_title": listing["title"],
                "items": [{
                    "description": f"{listing['title']} ({data.plan_id} plan)",
                    "quantity": 1,
                    "unit_price": booking.unit_price_inr,
                    "total": booking.unit_price_inr
                }],
                "subtotal": booking.unit_price_inr,
                "discount": 0,
                "credits_used": booking.credits_used,
                "credits_value": booking.credits_used,
                "total_inr": booking.total_inr,
                "payment_method": data.payment_method,
                "payment_status": "completed",
                "invoice_date": today,
                "paid_date": today,
                "status": "paid",
                "gst_amount": booking.taxes_inr,
                "session_date": session_date,
                "session_duration": listing.get("session_duration", 60)
            }
            
            await db.invoices.insert_one(invoice)
            logging.info(f"✅ Auto-generated invoice {invoice_number} for plan booking {booking.id}")
        except Exception as e:
            logging.error(f"❌ Failed to auto-generate invoice for plan booking {booking.id}: {e}")
            logging.exception("Full traceback:")
            # Don't fail the booking if invoice generation fails
    
    return {
        "message": f"Successfully booked {sessions_to_book} sessions!",
        "bookings": booking_ids,
        "plan": data.plan_id,
        "sessions_count": sessions_to_book,
        "total_paid": grand_total,
        "discount_percent": plan["discount"],
        "savings": (base_price * sessions_to_book) - total_price if not is_trial else 0
    }

@api_router.get("/bookings/my")
async def get_my_bookings(current_user: Dict = Depends(get_current_user)):
    """Get user's bookings
    
    CRITICAL: Always returns {"bookings": [...]} even on error.
    """
    try:
        # Allow customers and partners to view their own bookings
        # Partners can book classes for themselves/their kids too
        if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        bookings = await db.bookings.find({"user_id": current_user["id"]}, {"_id": 0}).sort("booked_at", -1).to_list(100)
        
        # Enrich with listing and session
        for booking in bookings:
            listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
            if listing:
                booking["listing_title"] = listing["title"]
                booking["listing_media"] = listing.get("media", [])
            
            session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
            if session:
                # Handle both old (start_at) and new (date/time) session structures
                if "start_at" in session:
                    booking["session_start"] = session["start_at"]
                    booking["session_end"] = session.get("end_at")
                    # Add frontend-friendly fields
                    booking["session_date"] = session["start_at"]
                    booking["session_time"] = session["start_at"].strftime("%I:%M %p") if isinstance(session["start_at"], datetime) else "TBD"
                elif "date" in session and "time" in session:
                    # Convert date/time to datetime for compatibility
                    try:
                        session_date = datetime.fromisoformat(session["date"])
                        session_time_str = session["time"]
                        
                        # Parse time
                        if isinstance(session_time_str, str):
                            time_parts = session_time_str.split(':')
                            hour = int(time_parts[0])
                            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                        else:
                            hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                            minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
                        
                        # Combine date and time
                        session_datetime = session_date.replace(
                            hour=hour,
                            minute=minute,
                            second=0,
                            microsecond=0,
                            tzinfo=timezone.utc
                        )
                        
                        booking["session_start"] = session_datetime
                        # Calculate end time based on duration (assume 90 minutes if not specified)
                        duration_minutes = session.get("duration_minutes", 90)
                        booking["session_end"] = session_datetime + timedelta(minutes=duration_minutes)
                        
                        # Add frontend-friendly fields
                        booking["session_date"] = session_datetime.isoformat()
                        booking["session_time"] = session_datetime.strftime("%I:%M %p")
                    except Exception as e:
                        logging.warning(f"Error parsing session date/time for booking {booking['id']}: {e}")
                        booking["session_start"] = None
                        booking["session_end"] = None
                        booking["session_date"] = datetime.now(timezone.utc).isoformat()
                        booking["session_time"] = "TBD"
            else:
                # No session found - provide defaults
                booking["session_date"] = booking.get("booked_at", datetime.now(timezone.utc).isoformat())
                booking["session_time"] = "TBD"
        
        return {"bookings": bookings}
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logging.error(f"Error in get_my_bookings: {e}")
        return {"bookings": []}

@api_router.post("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, reason: Optional[str] = None, current_user: Dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    if booking["booking_status"] in ["canceled", "refunded"]:
        raise HTTPException(status_code=400, detail="Already canceled")
    
    # Check if this is a trial booking - no cancellation allowed
    if booking.get("is_trial", False):
        raise HTTPException(status_code=400, detail="Trial bookings cannot be canceled")
    
    # Get session to check timing
    session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Handle both old (start_at) and new (date/time) session structures
    now = datetime.now(timezone.utc)
    
    if "start_at" in session:
        session_start = session["start_at"]
        if session_start.tzinfo is None:
            session_start = session_start.replace(tzinfo=timezone.utc)
    elif "date" in session and "time" in session:
        # Convert date/time to datetime
        try:
            session_date = datetime.fromisoformat(session["date"])
            session_time_str = session["time"]
            
            # Parse time
            if isinstance(session_time_str, str):
                time_parts = session_time_str.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            else:
                hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
            
            session_start = session_date.replace(
                hour=hour,
                minute=minute,
                second=0,
                microsecond=0,
                tzinfo=timezone.utc
            )
        except Exception as e:
            logging.error(f"Error parsing session date/time: {e}")
            raise HTTPException(status_code=500, detail="Invalid session date/time format")
    else:
        raise HTTPException(status_code=500, detail="Session missing date/time information")
    
    # Calculate hours before session starts
    hours_before = (session_start - now).total_seconds() / 3600
    
    # Cancellation policy:
    # - More than 6 hours before: 100% refund
    # - Between 2-6 hours before: 50% refund
    # - Less than 2 hours before: No refund (0%)
    refund_pct = 0
    if hours_before >= 6:
        refund_pct = 100
    elif hours_before >= 2:
        refund_pct = 50
    else:
        # No cancellation within 2 hours
        raise HTTPException(
            status_code=400, 
            detail=f"Cancellation not allowed within 2 hours of class start time. Session starts in {hours_before:.1f} hours."
        )
    
    refund_amount = booking["total_inr"] * (refund_pct / 100)
    refund_credits = int(booking["credits_used"] * (refund_pct / 100))
    
    # Release seat
    await db.sessions.update_one({"id": booking["session_id"]}, {"$inc": {"seats_booked": -1}})
    
    # Refund credits
    if refund_credits > 0:
        await db.wallets.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"credits_balance": refund_credits}}
        )
        ledger_entry = CreditLedger(
            user_id=current_user["id"],
            delta=refund_credits,
            reason="refund",
            ref_booking_id=booking_id
        )
        await db.credit_ledger.insert_one(ledger_entry.model_dump())
    
    # Update booking
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "booking_status": "canceled",
                "canceled_at": datetime.now(timezone.utc),
                "canceled_by": "customer",
                "cancellation_reason": reason,
                "refund_amount_inr": refund_amount,
                "refund_credits": refund_credits,
                "refund_percentage": refund_pct,
                "payout_eligible": False
            }
        }
    )
    
    return {
        "message": f"Booking canceled successfully with {refund_pct}% refund",
        "refund_amount_inr": refund_amount,
        "refund_credits": refund_credits,
        "refund_percentage": refund_pct,
        "hours_before_session": round(hours_before, 1)
    }



class RescheduleRequest(BaseModel):
    new_session_id: str

@api_router.post("/bookings/{booking_id}/reschedule")
async def reschedule_booking(
    booking_id: str, 
    request: RescheduleRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Reschedule a booking to a different session (ALL plan types allowed - only once per booking)"""
    new_session_id = request.new_session_id
    # Get original booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    if booking["booking_status"] in ["canceled", "refunded", "attended"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule {booking['booking_status']} booking")
    
    # Check if reschedule is allowed - now allowed for ALL plan types (Trial, Single, Weekly, Monthly)
    # Get listing and plan details to check time limit
    listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Find the plan this booking was made with to get reschedule_limit_minutes
    plan_option_id = booking.get("plan_option_id")
    reschedule_limit = 30  # Default 30 minutes
    
    if plan_option_id and listing.get("plan_options"):
        plan = next((p for p in listing["plan_options"] if p.get("id") == plan_option_id), None)
        if plan:
            reschedule_limit = plan.get("reschedule_limit_minutes", 30)
    
    # Check time limit - must be at least reschedule_limit minutes before class
    old_session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    if old_session:
        session_start = old_session.get("start_at")
        if session_start:
            # Ensure session_start is timezone-aware
            if session_start.tzinfo is None:
                session_start = session_start.replace(tzinfo=timezone.utc)
            
            time_until_session = (session_start - datetime.now(timezone.utc)).total_seconds() / 60
            if time_until_session < reschedule_limit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reschedule within {reschedule_limit} minutes of class start time"
                )
    
    # Check if booking has already been rescheduled
    reschedule_count = booking.get("reschedule_count", 0)
    if reschedule_count >= 1:
        raise HTTPException(status_code=400, detail="This booking has already been rescheduled once. Only one reschedule is allowed per booking.")
    
    # Get original session
    old_session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    if not old_session:
        raise HTTPException(status_code=404, detail="Original session not found")
    
    # Get new session
    new_session = await db.sessions.find_one({"id": new_session_id}, {"_id": 0})
    if not new_session:
        raise HTTPException(status_code=404, detail="New session not found")
    
    # Verify same listing
    if old_session["listing_id"] != new_session["listing_id"]:
        raise HTTPException(status_code=400, detail="Can only reschedule to sessions from the same class")
    
    # Check if new session is in the future
    now = datetime.now(timezone.utc)
    if "start_at" in new_session:
        session_start = new_session["start_at"]
        if session_start.tzinfo is None:
            session_start = session_start.replace(tzinfo=timezone.utc)
    elif "date" in new_session and "time" in new_session:
        session_date = datetime.fromisoformat(new_session["date"])
        # Ensure session_date is timezone-aware
        if session_date.tzinfo is None:
            session_date = session_date.replace(tzinfo=timezone.utc)
        time_parts = new_session["time"].split(':')
        hour = int(time_parts[0])
        minute = int(time_parts[1]) if len(time_parts) > 1 else 0
        session_start = session_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    else:
        raise HTTPException(status_code=500, detail="New session missing date/time")
    
    if session_start <= now:
        raise HTTPException(status_code=400, detail="Cannot reschedule to a past session")
    
    # Check new session availability
    if new_session.get("status") != "scheduled":
        raise HTTPException(status_code=400, detail="New session is not available")
    
    seats_booked = new_session.get("seats_booked", 0)
    seats_total = new_session.get("seats_total", 10)
    
    if seats_booked >= seats_total:
        raise HTTPException(status_code=400, detail="New session is fully booked")
    
    # Free up old session seat
    await db.sessions.update_one(
        {"id": booking["session_id"]},
        {"$inc": {"seats_booked": -1}}
    )
    
    # Book new session seat
    await db.sessions.update_one(
        {"id": new_session_id},
        {"$inc": {"seats_booked": 1}}
    )
    
    # Update booking with reschedule count
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "session_id": new_session_id,
                "rescheduled_at": datetime.now(timezone.utc),
                "rescheduled_from": booking["session_id"]
            },
            "$inc": {"reschedule_count": 1}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "booking_rescheduled",
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "target_id": booking_id,
        "target_type": "booking",
        "details": {
            "old_session_id": booking["session_id"],
            "new_session_id": new_session_id,
            "listing_id": old_session["listing_id"]
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Booking rescheduled successfully",
        "booking_id": booking_id,
        "new_session_id": new_session_id,
        "new_session_time": session_start.isoformat()
    }



# Unable to Attend endpoints
@api_router.post("/bookings/{booking_id}/unable-to-attend")
async def mark_unable_to_attend(
    booking_id: str,
    reason: str,
    custom_note: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Mark user as unable to attend a session (for weekly/monthly plans)
    This notifies the partner but doesn't cancel the booking
    """
    try:
        # Validate reason
        valid_reasons = ["feeling_unwell", "traveling", "scheduling_conflict", "other"]
        if reason not in valid_reasons:
            raise HTTPException(status_code=400, detail=f"Invalid reason. Must be one of: {valid_reasons}")
        
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        # Get listing to find partner
        listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0, "partner_id": 1})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Get session details
        session = await db.sessions.find_one({"id": session_id or booking["session_id"]}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get session datetime
        if "start_at" in session:
            session_datetime = session["start_at"]
        elif "date" in session and "time" in session:
            session_date = datetime.fromisoformat(session["date"])
            time_parts = session["time"].split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            session_datetime = session_date.replace(hour=hour, minute=minute, tzinfo=timezone.utc)
        else:
            session_datetime = datetime.now(timezone.utc)
        
        # Create unable to attend record
        unable_to_attend = {
            "id": str(uuid.uuid4()),
            "booking_id": booking_id,
            "session_id": session_id or booking["session_id"],
            "user_id": current_user["id"],
            "listing_id": booking["listing_id"],
            "partner_id": listing["partner_id"],
            "session_date_time": session_datetime,
            "reason": reason,
            "custom_note": custom_note,
            "notification_sent": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.unable_to_attend.insert_one(unable_to_attend)
        
        # Create notification for partner
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": listing["partner_id"],
            "type": "unable_to_attend",
            "title": "Student Unable to Attend",
            "message": f"{current_user.get('name', 'A student')} won't be attending the session on {session_datetime.strftime('%b %d, %Y at %I:%M %p')}",
            "data": {
                "booking_id": booking_id,
                "student_name": current_user.get("name", "Student"),
                "session_datetime": session_datetime.isoformat(),
                "reason": reason,
                "custom_note": custom_note,
                "child_name": booking.get("child_profile_name", "")
            },
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.notifications.insert_one(notification)
        
        # Mark notification as sent
        await db.unable_to_attend.update_one(
            {"id": unable_to_attend["id"]},
            {"$set": {"notification_sent": True}}
        )
        
        return {
            "message": "Partner has been notified",
            "unable_to_attend_id": unable_to_attend["id"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error marking unable to attend: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")


@api_router.get("/bookings/{booking_id}/unable-to-attend-history")
async def get_unable_to_attend_history(
    booking_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get unable to attend history for a booking"""
    try:
        # Verify booking belongs to user
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your booking")
        
        # Get history
        history = await db.unable_to_attend.find(
            {"booking_id": booking_id},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"history": history, "count": len(history)}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching unable to attend history: {e}")
        return {"history": [], "count": 0}


@api_router.get("/bookings/{booking_id}/available-sessions")
async def get_available_sessions_for_reschedule(
    booking_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get available sessions for rescheduling"""
    # Get booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    # Get current session to find listing
    session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    listing_id = session["listing_id"]
    
    # Get all future sessions from same listing
    now = datetime.now(timezone.utc)
    
    # Query for scheduled sessions with available seats
    future_sessions = await db.sessions.find({
        "listing_id": listing_id,
        "status": "scheduled",
        "$expr": {"$lt": ["$seats_booked", "$seats_total"]}  # Has available seats
    }, {"_id": 0}).sort("start_at", 1).to_list(100)
    
    # Filter to only future sessions and exclude current session
    available_sessions = []
    for s in future_sessions:
        if s["id"] == booking["session_id"]:
            continue  # Skip current session
        
        # Parse session time
        if "start_at" in s:
            session_start = s["start_at"]
            if session_start.tzinfo is None:
                session_start = session_start.replace(tzinfo=timezone.utc)
        elif "date" in s and "time" in s:
            session_date = datetime.fromisoformat(s["date"])
            time_parts = s["time"].split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            session_start = session_date.replace(hour=hour, minute=minute, second=0, microsecond=0, tzinfo=timezone.utc)
        else:
            continue
        
        if session_start > now:
            available_sessions.append({
                **s,
                "available_seats": s.get("seats_total", 10) - s.get("seats_booked", 0),
                "session_datetime": session_start.isoformat()
            })
    
    return {
        "sessions": available_sessions,
        "listing_id": listing_id,
        "current_session_id": booking["session_id"]
    }

# ============== CREDIT & WALLET ==============
@api_router.get("/credit-plans")
async def get_credit_plans():
    plans = await db.credit_plans.find({}, {"_id": 0}).to_list(100)
    return {"plans": plans}

class PlanSubscribeRequest(BaseModel):
    plan_id: str

@api_router.post("/credit-plans/subscribe")
async def subscribe_plan(request: PlanSubscribeRequest, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can subscribe")
    
    plan = await db.credit_plans.find_one({"id": request.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Mock payment
    payment_txn_id = f"mock_plan_{uuid.uuid4().hex[:12]}"
    
    # Grant credits
    await db.wallets.update_one(
        {"user_id": current_user["id"]},
        {
            "$inc": {"credits_balance": plan["credits_per_month"]},
            "$set": {"last_grant_at": datetime.now(timezone.utc)}
        }
    )
    
    # Log ledger
    ledger_entry = CreditLedger(
        user_id=current_user["id"],
        delta=plan["credits_per_month"],
        reason="purchase"
    )
    await db.credit_ledger.insert_one(ledger_entry.model_dump())
    
    return {"message": f"Subscribed to {plan['name']}", "credits_granted": plan["credits_per_month"]}

@api_router.get("/wallet/me")
async def get_wallet(current_user: Dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not wallet:
        # Create if missing
        wallet = Wallet(user_id=current_user["id"])
        await db.wallets.insert_one(wallet.model_dump())
    return wallet

@api_router.get("/wallet/ledger")
async def get_ledger(current_user: Dict = Depends(get_current_user)):
    ledger = await db.credit_ledger.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"ledger": ledger}

@api_router.post("/wallet/activate")
async def activate_wallet(bonus_credits: int = 10, current_user: Dict = Depends(get_current_user)):
    """Activate wallet with bonus credits for new users"""
    wallet = await db.wallets.find_one({"user_id": current_user["id"]})
    
    if not wallet:
        # Create wallet with bonus
        wallet = Wallet(
            user_id=current_user["id"],
            credits_balance=bonus_credits,
            cash_balance_inr=0.0
        )
        await db.wallets.insert_one(wallet.model_dump())
        
        # Create ledger entry for bonus
        ledger_entry = CreditLedger(
            user_id=current_user["id"],
            delta=bonus_credits,
            reason="welcome_bonus",
            description=f"Welcome to rayy! {bonus_credits} bonus credits"
        )
        await db.credit_ledger.insert_one(ledger_entry.model_dump())
        
        return {"message": "Wallet activated", "bonus_credits": bonus_credits}
    else:
        # Wallet already exists, just add bonus if not already given
        existing_bonus = await db.credit_ledger.find_one({
            "user_id": current_user["id"],
            "reason": "welcome_bonus"
        })
        
        if not existing_bonus:
            # Add bonus
            await db.wallets.update_one(
                {"user_id": current_user["id"]},
                {"$inc": {"credits_balance": bonus_credits}}
            )
            
            ledger_entry = CreditLedger(
                user_id=current_user["id"],
                delta=bonus_credits,
                reason="welcome_bonus",
                description=f"Welcome to rayy! {bonus_credits} bonus credits"
            )
            await db.credit_ledger.insert_one(ledger_entry.model_dump())
            
            return {"message": "Bonus credits added", "bonus_credits": bonus_credits}
        else:
            return {"message": "Wallet already activated", "bonus_credits": 0}

# ============== PARTNER ROUTES ==============
@api_router.post("/partners")
async def create_partner(data: PartnerCreate, current_user: Dict = Depends(get_current_user)):
    # Allow partner_owner or admin to create partner profiles
    if current_user["role"] not in ["partner_owner", "admin", "customer"]:
        raise HTTPException(status_code=403, detail="Invalid role for partner creation")
    
    # Validate KYC documents if provided
    if data.pan_number and not validate_pan(data.pan_number):
        raise HTTPException(status_code=400, detail="Invalid PAN format. Format: ABCDE1234F")
    
    if data.aadhaar_number and not validate_aadhaar(data.aadhaar_number):
        raise HTTPException(status_code=400, detail="Invalid Aadhaar format. Must be 12 digits")
    
    if data.gst_number and not validate_gst(data.gst_number):
        raise HTTPException(status_code=400, detail="Invalid GST format")
    
    if data.bank_ifsc and not validate_ifsc(data.bank_ifsc):
        raise HTTPException(status_code=400, detail="Invalid IFSC code format")
    
    # Check if all KYC documents are submitted (now optional - just check if basic info is there)
    kyc_documents_submitted = bool(
        data.pan_number and
        data.aadhaar_number and
        data.bank_account_number and data.bank_ifsc and
        data.bank_account_holder_name
    )
    
    # Check if partner profile already exists
    existing_partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if existing_partner:
        # Update existing partner instead of throwing error
        update_data = {
            "brand_name": data.brand_name,
            "legal_name": data.legal_name,
            "description": data.description,
            "address": data.address,
            "city": data.city,
            "updated_at": datetime.now(timezone.utc),
            "kyc_documents_submitted": kyc_documents_submitted
        }
        
        # Add KYC fields if provided
        if data.pan_number:
            update_data["pan_number"] = data.pan_number
        if data.pan_document:
            update_data["pan_document"] = data.pan_document
        if data.aadhaar_number:
            update_data["aadhaar_number"] = data.aadhaar_number
        if data.aadhaar_document:
            update_data["aadhaar_document"] = data.aadhaar_document
        if data.gst_number:
            update_data["gst_number"] = data.gst_number
        if data.gst_document:
            update_data["gst_document"] = data.gst_document
        if data.bank_account_number:
            update_data["bank_account_number"] = data.bank_account_number
        if data.bank_ifsc:
            update_data["bank_ifsc"] = data.bank_ifsc
        if data.bank_account_holder_name:
            update_data["bank_account_holder_name"] = data.bank_account_holder_name
        if data.bank_name:
            update_data["bank_name"] = data.bank_name
        if data.bank_account_type:
            update_data["bank_account_type"] = data.bank_account_type
        if data.cancelled_cheque_document:
            update_data["cancelled_cheque_document"] = data.cancelled_cheque_document
        if data.partner_photo:
            update_data["partner_photo"] = data.partner_photo
        
        # Legacy fields
        if data.gstin:
            update_data["gstin"] = data.gstin
        if data.pan:
            update_data["pan"] = data.pan
        if data.kyc_documents:
            update_data["kyc_documents"] = data.kyc_documents
        if data.bank_details:
            update_data["bank_details"] = data.bank_details
        if data.kyc_status:
            update_data["kyc_status"] = data.kyc_status
        
        await db.partners.update_one(
            {"owner_user_id": current_user["id"]},
            {"$set": update_data}
        )
        return {"id": existing_partner["id"], "partner": existing_partner, "updated": True}
    
    # Update user role to partner_owner if they're currently customer
    if current_user["role"] == "customer":
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "partner_owner"}}
        )
        # Issue new token with updated role
        new_token = create_token(current_user["id"], "partner_owner")
    else:
        new_token = None
    
    partner = Partner(
        owner_user_id=current_user["id"],
        brand_name=data.brand_name,
        legal_name=data.legal_name,
        description=data.description,
        address=data.address,
        city=data.city,
        pan_number=data.pan_number,
        pan_document=data.pan_document,
        aadhaar_number=data.aadhaar_number,
        aadhaar_document=data.aadhaar_document,
        gst_number=data.gst_number,
        gst_document=data.gst_document,
        bank_account_number=data.bank_account_number,
        bank_ifsc=data.bank_ifsc,
        bank_account_holder_name=data.bank_account_holder_name,
        bank_name=data.bank_name,
        bank_account_type=data.bank_account_type,
        cancelled_cheque_document=data.cancelled_cheque_document,
        partner_photo=data.partner_photo,
        kyc_documents_submitted=kyc_documents_submitted,
        gstin=data.gstin,
        pan=data.pan,
        kyc_documents=data.kyc_documents,
        bank_details=data.bank_details,
        kyc_status=data.kyc_status or "pending"
    )
    
    await db.partners.insert_one(partner.model_dump())
    
    # Create wallet for partner if doesn't exist
    existing_wallet = await db.wallets.find_one({"user_id": current_user["id"]})
    if not existing_wallet:
        wallet = Wallet(user_id=current_user["id"])
        await db.wallets.insert_one(wallet.model_dump())
    
    response = {"id": partner.id, "partner": partner.model_dump()}
    if new_token:
        response["new_token"] = new_token
    
    return response

@api_router.get("/partners/my")
async def get_my_partner(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    
    # Auto-create partner profile if it doesn't exist
    if not partner:
        # Create a basic partner profile with user's information
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        partner = {
            "id": str(uuid.uuid4()),
            "owner_user_id": current_user["id"],
            "brand_name": user.get("name", "My Studio"),
            "legal_name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "address": "",
            "city": "",
            "description": "",
            "kyc_status": "pending",
            "kyc_documents": {},
            "bank_details": {},
            "commission_percent": 15.0,
            "partner_photo": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.partners.insert_one(partner)
        
        # Create audit log
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "action": "partner_auto_created",
            "entity_type": "partner",
            "entity_id": partner["id"],
            "details": {"auto_created": True},
            "created_at": datetime.now(timezone.utc)
        })
    
    return partner

@api_router.get("/partners/my/completion")
async def get_profile_completion(current_user: Dict = Depends(get_current_user)):
    """Calculate partner profile completion percentage"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Define completion criteria with weights
    sections = {
        "basic_info": {
            "weight": 40,
            "fields": ["brand_name", "legal_name", "description", "partner_photo"],
            "completed": 0,
            "total": 4
        },
        "address": {
            "weight": 10,
            "fields": ["address", "city"],
            "completed": 0,
            "total": 2
        },
        "kyc_documents": {
            "weight": 25,
            "fields": ["pan_number", "pan_document", "aadhaar_number", "aadhaar_document"],
            "completed": 0,
            "total": 4
        },
        "bank_details": {
            "weight": 25,
            "fields": ["bank_account_number", "bank_ifsc", "bank_account_holder_name", "bank_name", "bank_account_type"],
            "completed": 0,
            "total": 5
        }
    }
    
    # Calculate completion for each section
    for section_name, section_data in sections.items():
        for field in section_data["fields"]:
            value = partner.get(field)
            if value is not None and value != "" and value != []:
                section_data["completed"] += 1
    
    # Calculate total percentage
    total_percentage = 0
    section_percentages = {}
    missing_fields = []
    
    for section_name, section_data in sections.items():
        section_completion = (section_data["completed"] / section_data["total"]) * 100
        section_percentage = (section_completion / 100) * section_data["weight"]
        total_percentage += section_percentage
        
        section_percentages[section_name] = {
            "percentage": round(section_completion, 1),
            "completed": section_data["completed"],
            "total": section_data["total"],
            "weight": section_data["weight"]
        }
        
        # Track missing fields
        for field in section_data["fields"]:
            value = partner.get(field)
            if value is None or value == "" or value == []:
                missing_fields.append({
                    "field": field,
                    "section": section_name,
                    "label": field.replace("_", " ").title()
                })
    
    return {
        "total_percentage": round(total_percentage, 1),
        "sections": section_percentages,
        "missing_fields": missing_fields,
        "meets_minimum": total_percentage >= 70,
        "minimum_required": 70
    }

@api_router.put("/partners/profile")
async def update_partner_profile_details(
    profile_updates: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Update partner profile details (description, KYC, bank info)"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Allowed fields to update (safe fields that don't impact critical business logic)
    allowed_fields = [
        'description', 'partner_photo',
        'pan_number', 'aadhaar_number', 'gst_number',
        'bank_account_number', 'bank_ifsc', 'bank_account_holder_name',
        'bank_name', 'bank_account_type'
    ]
    
    # Filter updates to only allowed fields
    filtered_updates = {
        k: v for k, v in profile_updates.items() 
        if k in allowed_fields and v is not None and v != ''
    }
    
    if not filtered_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # Add updated timestamp
    filtered_updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Update partner profile
    await db.partners.update_one(
        {"owner_user_id": current_user["id"]},
        {"$set": filtered_updates}
    )
    
    return {
        "message": "Profile updated successfully",
        "updated_fields": list(filtered_updates.keys())
    }

@api_router.post("/partners/documents")
async def upload_partner_documents(
    pan_document: UploadFile = File(None),
    aadhaar_document: UploadFile = File(None),
    gst_document: UploadFile = File(None),
    cancelled_cheque_document: UploadFile = File(None),
    current_user: Dict = Depends(get_current_user)
):
    """Upload KYC and bank documents for partner"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    updates = {}
    uploaded_docs = []
    
    # Process each document
    if pan_document:
        content = await pan_document.read()
        pan_base64 = base64.b64encode(content).decode('utf-8')
        updates['pan_document'] = f"data:{pan_document.content_type};base64,{pan_base64}"
        uploaded_docs.append('PAN Document')
    
    if aadhaar_document:
        content = await aadhaar_document.read()
        aadhaar_base64 = base64.b64encode(content).decode('utf-8')
        updates['aadhaar_document'] = f"data:{aadhaar_document.content_type};base64,{aadhaar_base64}"
        uploaded_docs.append('Aadhaar Document')
    
    if gst_document:
        content = await gst_document.read()
        gst_base64 = base64.b64encode(content).decode('utf-8')
        updates['gst_document'] = f"data:{gst_document.content_type};base64,{gst_base64}"
        uploaded_docs.append('GST Document')
    
    if cancelled_cheque_document:
        content = await cancelled_cheque_document.read()
        cheque_base64 = base64.b64encode(content).decode('utf-8')
        updates['cancelled_cheque_document'] = f"data:{cancelled_cheque_document.content_type};base64,{cheque_base64}"
        uploaded_docs.append('Cancelled Cheque')
    
    if not updates:
        raise HTTPException(status_code=400, detail="No documents provided")
    
    # Mark KYC as submitted if PAN and Aadhaar are uploaded
    if 'pan_document' in updates and 'aadhaar_document' in updates:
        updates['kyc_documents_submitted'] = True
        updates['kyc_status'] = 'submitted'
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Update partner with documents
    await db.partners.update_one(
        {"owner_user_id": current_user["id"]},
        {"$set": updates}
    )
    
    return {
        "message": "Documents uploaded successfully",
        "uploaded_documents": uploaded_docs
    }

@api_router.get("/partners/my/stats")
async def get_partner_stats(current_user: Dict = Depends(get_current_user)):
    """Get dashboard stats for partner"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    partner_id = partner["id"]
    
    # Get partner's listings first (limit to reasonable number)
    listings = await db.listings.find({"partner_id": partner_id}, {"id": 1}).to_list(500)
    listing_ids = [l["id"] for l in listings]
    
    # Get stats
    total_bookings = await db.bookings.count_documents({"listing_id": {"$in": listing_ids}})
    
    # Revenue this month
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_pipeline = [
        {
            "$match": {
                "listing_id": {"$in": listing_ids},
                "booking_status": {"$in": ["confirmed", "attended"]},
                "booked_at": {"$gte": start_of_month}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$total_inr"}
            }
        }
    ]
    revenue_result = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    revenue_this_month = revenue_result[0]["total"] if revenue_result else 0.0
    
    # Active listings
    active_listings = await db.listings.count_documents({
        "partner_id": partner_id,
        "status": "active"
    })
    
    # Upcoming sessions
    upcoming_sessions = await db.sessions.count_documents({
        "listing_id": {"$in": listing_ids},
        "start_at": {"$gte": datetime.now(timezone.utc)},
        "status": "scheduled"
    })
    
    return {
        "total_bookings": total_bookings,
        "revenue_this_month": revenue_this_month,
        "active_listings": active_listings,
        "upcoming_sessions": upcoming_sessions,
        "pending_approvals": 0
    }

@api_router.get("/partners/my/bookings")
async def get_partner_bookings(
    limit: int = 10,
    current_user: Dict = Depends(get_current_user)
):
    """Get bookings for partner's listings"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        return {"bookings": []}
    
    # Get partner's listings
    listings = await db.listings.find({"partner_id": partner["id"]}, {"id": 1, "title": 1}).to_list(500)
    listing_ids = [l["id"] for l in listings]
    listing_titles = {l["id"]: l["title"] for l in listings}
    
    # Get bookings
    bookings = await db.bookings.find(
        {"listing_id": {"$in": listing_ids}},
        {"_id": 0}
    ).sort("booked_at", -1).limit(limit).to_list(limit)
    
    # Enrich with listing title and session info
    for booking in bookings:
        booking["listing_title"] = listing_titles.get(booking["listing_id"], "Unknown")
        session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
        if session:
            # Handle both old (start_at) and new (date/time) session structures
            if "start_at" in session:
                booking["session_start"] = session["start_at"]
            elif "date" in session and "time" in session:
                # Convert date/time to datetime for compatibility
                try:
                    session_date = datetime.fromisoformat(session["date"])
                    session_time_str = session["time"]
                    
                    # Parse time
                    if isinstance(session_time_str, str):
                        time_parts = session_time_str.split(':')
                        hour = int(time_parts[0])
                        minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                    else:
                        hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                        minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
                    
                    # Combine date and time
                    session_datetime = session_date.replace(
                        hour=hour,
                        minute=minute,
                        second=0,
                        microsecond=0,
                        tzinfo=timezone.utc
                    )
                    
                    booking["session_start"] = session_datetime
                except Exception as e:
                    logging.warning(f"Error parsing session date/time for booking {booking['id']}: {e}")
                    booking["session_start"] = None
    
    return {"bookings": bookings}


# ============== PARTNER BOOKING MANAGEMENT ==============
@api_router.get("/partner/bookings")
async def get_partner_bookings_advanced(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    status: Optional[str] = None,
    listing_id: Optional[str] = None,
    session_id: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    current_user: Dict = Depends(get_current_user)
):
    """Get bookings for partner's listings with advanced filtering"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Get partner
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        return {"items": [], "page": page, "total": 0}
    
    # Get partner's listings
    listings = await db.listings.find({"partner_id": partner["id"]}, {"id": 1, "title": 1}).to_list(500)
    listing_ids = [l["id"] for l in listings]
    listing_map = {l["id"]: l["title"] for l in listings}
    
    if not listing_ids:
        return {"items": [], "page": page, "total": 0}
    
    # Build query
    query = {"listing_id": {"$in": listing_ids}}
    
    # Add filters
    if status:
        query["booking_status"] = status
    if listing_id:
        query["listing_id"] = listing_id
    if session_id:
        query["session_id"] = session_id
    
    # Date range filter on session start_at
    if from_date or to_date:
        date_query = {}
        if from_date:
            date_query["$gte"] = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        if to_date:
            date_query["$lte"] = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        # We'll filter by session date after fetching
    
    # Text search in child name
    if q:
        query["child_profile_name"] = {"$regex": q, "$options": "i"}
    
    # Get total count
    total = await db.bookings.count_documents(query)
    
    # Get bookings with pagination
    skip = (page - 1) * limit
    bookings = await db.bookings.find(
        query,
        {"_id": 0}
    ).sort("booked_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with listing and session data
    items = []
    for booking in bookings:
        # Get session
        session = await db.sessions.find_one(
            {"id": booking["session_id"]},
            {"_id": 0, "start_at": 1, "seats_total": 1}
        )
        
        # Apply date filter if needed
        if session and (from_date or to_date):
            session_start = session["start_at"]
            if session_start.tzinfo is None:
                session_start = session_start.replace(tzinfo=timezone.utc)
            
            if from_date:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                if session_start < from_dt:
                    continue
            if to_date:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                if session_start > to_dt:
                    continue
        
        if session:
            # Get user info
            user = await db.users.find_one(
                {"id": booking["user_id"]},
                {"_id": 0, "name": 1, "email": 1, "phone": 1}
            )
            
            item = {
                "booking_id": booking["id"],
                "created_at": booking["booked_at"].isoformat() if booking["booked_at"] else None,
                "status": booking["booking_status"],
                "child": {
                    "name": booking["child_profile_name"],
                    "age_band": f"{booking['child_profile_age']}-{booking['child_profile_age']+1}"
                },
                "listing": {
                    "id": booking["listing_id"],
                    "title": listing_map.get(booking["listing_id"], "Unknown")
                },
                "session": {
                    "id": booking["session_id"],
                    "start_at": session["start_at"].isoformat() if session["start_at"] else None,
                    "seats_total": session.get("seats_total", 0)
                },
                "payment": {
                    "method": booking["payment_method"],
                    "total_inr": booking["total_inr"],
                    "credits_used": booking["credits_used"]
                },
                "attendance": booking.get("attendance"),
                "notes": booking.get("attendance_notes", ""),
                "customer": {
                    "name": user.get("name", "Unknown") if user else "Unknown",
                    "email": user.get("email", "") if user else "",
                    "phone": user.get("phone", "") if user else ""
                }
            }
            items.append(item)
    
    return {
        "items": items,
        "page": page,
        "total": total
    }

@api_router.put("/partner/bookings/{booking_id}/attendance")
async def mark_attendance(
    booking_id: str,
    request: AttendanceUpdateRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Mark attendance for a booking"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Validate status
    if request.status not in ["present", "absent", "late"]:
        raise HTTPException(status_code=400, detail="Invalid attendance status")
    
    # Validate notes length
    if request.notes and len(request.notes) > 240:
        raise HTTPException(status_code=400, detail="Notes too long (max 240 chars)")
    
    # Get booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify partner owns this listing
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=403, detail="Partner profile not found")
    
    listing = await db.listings.find_one(
        {"id": booking["listing_id"], "partner_id": partner["id"]},
        {"_id": 0, "id": 1}
    )
    if not listing:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    # Determine payout eligibility
    payout_eligible = request.status == "present"
    
    # Update booking status based on attendance
    new_status = "attended" if request.status == "present" else "no_show"
    
    # Update booking
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "attendance": request.status,
                "attendance_notes": request.notes,
                "attendance_at": datetime.now(timezone.utc),
                "payout_eligible": payout_eligible,
                "booking_status": new_status
            }
        }
    )
    
    # Create audit log
    audit_entry = {
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "action": "partner_mark_attendance",
        "resource_type": "booking",
        "resource_id": booking_id,
        "details": {
            "attendance": request.status,
            "notes": request.notes,
            "payout_eligible": payout_eligible
        },
        "timestamp": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(audit_entry)
    
    # TODO: Send review email if present (T+4h)
    
    return {
        "message": "Attendance marked successfully",
        "booking_id": booking_id,
        "attendance": request.status,
        "payout_eligible": payout_eligible
    }

@api_router.put("/partner/bookings/{booking_id}/cancel")
async def partner_cancel_booking(
    booking_id: str,
    request: PartnerCancelBookingRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: Dict = Depends(get_current_user)
):
    """Partner cancels a booking - issues full refund + goodwill credit"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Get booking
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify partner owns this listing
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=403, detail="Partner profile not found")
    
    listing = await db.listings.find_one(
        {"id": booking["listing_id"], "partner_id": partner["id"]},
        {"_id": 0, "id": 1, "title": 1}
    )
    if not listing:
        raise HTTPException(status_code=403, detail="Not your booking")
    
    # Check if already canceled
    if booking["booking_status"] in ["canceled", "refunded"]:
        raise HTTPException(status_code=400, detail="Already canceled")
    
    # Get session
    session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get goodwill config
    config = await db.configs.find_one({"_id": "partner_cancel_goodwill"}, {"_id": 0})
    goodwill_credits = 5
    goodwill_inr = 100
    if config:
        goodwill_type = config.get("type", "credits")
        goodwill_amount = config.get("amount", 5)
        if goodwill_type == "credits":
            goodwill_credits = goodwill_amount
            goodwill_inr = 0
        else:
            goodwill_inr = goodwill_amount
            goodwill_credits = 0
    
    # Partner cancel = 100% refund + goodwill
    refund_amount = booking["total_inr"]
    refund_credits = booking["credits_used"]
    
    # Release seat
    await db.sessions.update_one({"id": booking["session_id"]}, {"$inc": {"seats_booked": -1}})
    
    # Refund credits + goodwill
    total_credits_refund = refund_credits + goodwill_credits
    if total_credits_refund > 0:
        await db.wallets.update_one(
            {"user_id": booking["user_id"]},
            {"$inc": {"credits_balance": total_credits_refund}}
        )
        # Create ledger entries
        if refund_credits > 0:
            ledger_entry = CreditLedger(
                user_id=booking["user_id"],
                delta=refund_credits,
                reason="refund",
                ref_booking_id=booking_id
            )
            await db.credit_ledger.insert_one(ledger_entry.model_dump())
        
        if goodwill_credits > 0:
            goodwill_entry = CreditLedger(
                user_id=booking["user_id"],
                delta=goodwill_credits,
                reason="goodwill",
                ref_booking_id=booking_id
            )
            await db.credit_ledger.insert_one(goodwill_entry.model_dump())
    
    # Update booking
    cancellation_message = f"Partner canceled: {request.reason}. {request.message or ''}"
    await db.bookings.update_one(
        {"id": booking_id},
        {
            "$set": {
                "booking_status": "canceled",
                "canceled_at": datetime.now(timezone.utc),
                "canceled_by": "partner",
                "cancellation_reason": cancellation_message,
                "refund_amount_inr": refund_amount,
                "refund_credits": refund_credits,
                "payout_eligible": False
            }
        }
    )
    
    # Create audit log
    audit_entry = {
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "action": "partner_cancel_booking",
        "resource_type": "booking",
        "resource_id": booking_id,
        "details": {
            "reason": request.reason,
            "message": request.message,
            "refund_inr": refund_amount,
            "refund_credits": refund_credits,
            "goodwill_credits": goodwill_credits,
            "goodwill_inr": goodwill_inr
        },
        "timestamp": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(audit_entry)
    
    # Get customer info for notification
    user = await db.users.find_one({"id": booking["user_id"]}, {"_id": 0, "email": 1, "name": 1})
    
    # TODO: Send email notification to customer
    # TODO: Send email notification to admin
    
    return {
        "message": "Booking canceled successfully",
        "booking_id": booking_id,
        "refund_amount_inr": refund_amount,
        "refund_credits": refund_credits,
        "goodwill_credits": goodwill_credits,
        "goodwill_inr": goodwill_inr,
        "customer_email": user.get("email") if user else None
    }


# ============== PARTNER FINANCIALS & PAYOUTS ==============

class PayoutRequest(BaseModel):
    amount_inr: float
    bank_account_id: Optional[str] = None
    notes: Optional[str] = None

@api_router.get("/partner/financials/summary")
async def get_partner_financials_summary(current_user: Dict = Depends(get_current_user)):
    """Get partner's financial summary - earnings, pending payouts, available balance"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Get partner
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Get partner's listings
    listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0, "id": 1}).to_list(500)
    listing_ids = [l["id"] for l in listings]
    
    if not listing_ids:
        return {
            "total_earnings_inr": 0,
            "available_balance_inr": 0,
            "pending_payout_inr": 0,
            "lifetime_earnings_inr": 0,
            "total_bookings": 0,
            "commission_rate": partner.get("commission_percent", 15.0),
            "currency": "INR"
        }
    
    # Get all payout-eligible bookings (attended status with payout_eligible=True)
    eligible_bookings = await db.bookings.find({
        "listing_id": {"$in": listing_ids},
        "booking_status": "attended",
        "payout_eligible": True
    }, {"_id": 0}).to_list(None)
    
    # Get all bookings for total count
    total_bookings = await db.bookings.count_documents({
        "listing_id": {"$in": listing_ids},
        "booking_status": {"$in": ["confirmed", "attended"]}
    })
    
    # Calculate gross earnings from eligible bookings
    gross_earnings = sum(b.get("total_inr", 0) for b in eligible_bookings)
    
    # Calculate commission
    commission_rate = partner.get("commission_percent", 15.0) / 100
    commission_amount = gross_earnings * commission_rate
    net_earnings = gross_earnings - commission_amount
    
    # Get pending payout requests
    pending_payouts = await db.payout_requests.find({
        "partner_id": partner["id"],
        "status": "pending"
    }, {"_id": 0}).to_list(None)
    pending_payout_amount = sum(p.get("amount_inr", 0) for p in pending_payouts)
    
    # Get completed payouts for lifetime earnings
    completed_payouts = await db.payout_requests.find({
        "partner_id": partner["id"],
        "status": "completed"
    }, {"_id": 0}).to_list(None)
    completed_payout_amount = sum(p.get("amount_inr", 0) for p in completed_payouts)
    
    # Available balance = net earnings - pending payouts - completed payouts
    available_balance = net_earnings - pending_payout_amount - completed_payout_amount
    
    return {
        "total_earnings_inr": round(net_earnings, 2),
        "available_balance_inr": round(available_balance, 2),
        "pending_payout_inr": round(pending_payout_amount, 2),
        "lifetime_earnings_inr": round(completed_payout_amount, 2),
        "total_bookings": total_bookings,
        "commission_rate": partner.get("commission_percent", 15.0),
        "currency": "INR",
        "gross_revenue_inr": round(gross_earnings, 2),
        "commission_paid_inr": round(commission_amount, 2)
    }


@api_router.get("/partner/financials/transactions")
async def get_partner_transactions(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    transaction_type: Optional[str] = None,  # "booking" or "payout"
    page: int = 1,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get partner's transaction history"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Get partner
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Get partner's listings
    listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0, "id": 1, "title": 1}).to_list(500)
    listing_ids = [l["id"] for l in listings]
    listing_map = {l["id"]: l["title"] for l in listings}
    
    transactions = []
    
    # Build date filter
    date_filter = {}
    if from_date:
        date_filter["$gte"] = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
    if to_date:
        date_filter["$lte"] = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
    
    # Get bookings as transactions
    if not transaction_type or transaction_type == "booking":
        booking_query = {
            "listing_id": {"$in": listing_ids},
            "booking_status": {"$in": ["confirmed", "attended", "refunded"]}
        }
        if date_filter:
            booking_query["booked_at"] = date_filter
        
        bookings = await db.bookings.find(booking_query, {"_id": 0}).sort("booked_at", -1).to_list(1000)
        
        commission_rate = partner.get("commission_percent", 15.0) / 100
        
        for booking in bookings:
            gross_amount = booking.get("total_inr", 0)
            commission = gross_amount * commission_rate
            net_amount = gross_amount - commission
            
            transactions.append({
                "id": booking["id"],
                "type": "booking",
                "date": booking["booked_at"],
                "listing_title": listing_map.get(booking["listing_id"], "Unknown"),
                "child_name": booking.get("child_profile_name", "Unknown"),
                "gross_amount_inr": round(gross_amount, 2),
                "commission_inr": round(commission, 2),
                "net_amount_inr": round(net_amount, 2),
                "status": booking["booking_status"],
                "payout_eligible": booking.get("payout_eligible", False)
            })
    
    # Get payout requests as transactions
    if not transaction_type or transaction_type == "payout":
        payout_query = {"partner_id": partner["id"]}
        if date_filter:
            payout_query["requested_at"] = date_filter
        
        payouts = await db.payout_requests.find(payout_query, {"_id": 0}).sort("requested_at", -1).to_list(200)
        
        for payout in payouts:
            transactions.append({
                "id": payout["id"],
                "type": "payout",
                "date": payout["requested_at"],
                "amount_inr": payout["amount_inr"],
                "status": payout["status"],
                "notes": payout.get("notes", ""),
                "processed_at": payout.get("processed_at"),
                "reference_number": payout.get("reference_number", "")
            })
    
    # Sort by date
    transactions.sort(key=lambda x: x["date"], reverse=True)
    
    # Paginate
    total = len(transactions)
    start = (page - 1) * limit
    end = start + limit
    paginated = transactions[start:end]
    
    return {
        "transactions": paginated,
        "page": page,
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }


@api_router.post("/partner/financials/payout-request")
async def request_payout(request: PayoutRequest, current_user: Dict = Depends(get_current_user)):
    """Request a payout"""
    if current_user["role"] not in ["partner_owner"]:
        raise HTTPException(status_code=403, detail="Only partner owners can request payouts")
    
    # Get partner
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Validate bank details exist
    if not partner.get("bank_details"):
        raise HTTPException(status_code=400, detail="Please add bank details before requesting payout")
    
    # Get financial summary to check available balance
    summary_response = await get_partner_financials_summary(current_user)
    available_balance = summary_response["available_balance_inr"]
    
    # Validate amount
    if request.amount_inr <= 0:
        raise HTTPException(status_code=400, detail="Payout amount must be greater than 0")
    
    if request.amount_inr > available_balance:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ₹{available_balance}")
    
    # Minimum payout amount check (e.g., ₹500)
    MIN_PAYOUT = 500
    if request.amount_inr < MIN_PAYOUT:
        raise HTTPException(status_code=400, detail=f"Minimum payout amount is ₹{MIN_PAYOUT}")
    
    # Create payout request
    payout_request = {
        "id": str(uuid.uuid4()),
        "partner_id": partner["id"],
        "partner_name": partner["brand_name"],
        "amount_inr": request.amount_inr,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc),
        "bank_account_id": request.bank_account_id or partner.get("bank_details", {}).get("account_number", ""),
        "notes": request.notes or "",
        "processed_at": None,
        "reference_number": None
    }
    
    await db.payout_requests.insert_one(payout_request)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "payout_requested",
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "target_id": payout_request["id"],
        "target_type": "payout_request",
        "details": {
            "partner_id": partner["id"],
            "amount_inr": request.amount_inr
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    # TODO: Send email notification to admin and partner
    
    return {
        "message": "Payout request submitted successfully",
        "payout_request_id": payout_request["id"],
        "amount_inr": request.amount_inr,
        "status": "pending"
    }


@api_router.get("/partner/financials/payout-requests")
async def get_partner_payout_requests(
    page: int = 1,
    limit: int = 20,
    current_user: Dict = Depends(get_current_user)
):
    """Get partner's payout request history"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Get partner
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    # Get payout requests
    total = await db.payout_requests.count_documents({"partner_id": partner["id"]})
    skip = (page - 1) * limit
    
    requests = await db.payout_requests.find(
        {"partner_id": partner["id"]},
        {"_id": 0}
    ).sort("requested_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "requests": requests,
        "page": page,
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }



@api_router.post("/partners/create")
async def create_partner_profile(
    brand_name: str,
    legal_name: str,
    address: str,
    city: str,
    description: str = "",
    kyc_documents: dict = {},
    bank_details: dict = {},
    current_user: Dict = Depends(get_current_user)
):
    """Create partner profile"""
    # Check if partner already exists
    existing = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Partner profile already exists")
    
    partner = {
        "id": str(uuid.uuid4()),
        "owner_user_id": current_user["id"],
        "brand_name": brand_name,
        "legal_name": legal_name,
        "address": address,
        "city": city,
        "description": description,
        "kyc_status": "pending",
        "kyc_documents": kyc_documents,
        "bank_details": bank_details,
        "commission_percent": 15.0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.partners.insert_one(partner)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "partner_created",
        "entity_type": "partner",
        "entity_id": partner["id"],
        "details": {"brand_name": brand_name},
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"id": partner["id"], "message": "Partner created successfully"}

@api_router.post("/partners/{partner_id}/venues")
async def create_venue(
    partner_id: str,
    data: VenueCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Create venue for partner"""
    # Verify partner ownership
    partner = await db.partners.find_one({"id": partner_id, "owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    venue = {
        "id": str(uuid.uuid4()),
        "partner_id": partner_id,
        "name": data.name,
        "address": data.address,
        "city": data.city,
        "pincode": data.pincode or "",
        "google_maps_link": data.google_maps_link or "",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.venues.insert_one(venue)
    
    return {"id": venue["id"], "message": "Venue created successfully"}

@api_router.get("/partners/my/listings")
async def get_partner_listings(current_user: Dict = Depends(get_current_user)):
    """Get all listings for current partner"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        return {"listings": []}
    
    listings = await db.listings.find(
        {"partner_id": partner["id"]},
        {"_id": 0}
    ).to_list(None)
    
    return {"listings": listings}

@api_router.get("/partners/{partner_id}/listings")

class TimeSlot(BaseModel):
    time: str
    seats: int

class BulkSessionCreate(BaseModel):
    listing_id: str
    start_date: str
    end_date: str
    days: List[str]
    time_slots: List[TimeSlot]
    duration_minutes: int = 60
    price_override: Optional[float] = None

@api_router.post("/sessions/bulk-create")
async def bulk_create_sessions(
    data: BulkSessionCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Bulk create sessions with recurring pattern"""
    listing_id = data.listing_id
    start_date = data.start_date
    end_date = data.end_date
    days = data.days
    time_slots = data.time_slots
    duration_minutes = data.duration_minutes
    price_override = data.price_override
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    # Verify listing ownership
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner or listing["partner_id"] != partner["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Parse dates
    from datetime import datetime, timedelta
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    
    # Day mapping
    day_map = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }
    
    selected_weekdays = [day_map[day.lower()] for day in days if day.lower() in day_map]
    
    sessions_created = []
    current_date = start
    
    while current_date <= end:
        if current_date.weekday() in selected_weekdays:
            # Create session for each time slot
            for slot in time_slots:
                time_parts = slot.time.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                
                session_start = current_date.replace(
                    hour=hour, 
                    minute=minute, 
                    second=0, 
                    microsecond=0,
                    tzinfo=timezone.utc
                )
                
                session_end = session_start + timedelta(minutes=duration_minutes)
                
                session = Session(
                    id=str(uuid.uuid4()),
                    listing_id=listing_id,
                    start_at=session_start,
                    end_at=session_end,
                    seats_total=int(slot.seats),
                    seats_booked=0,
                    price_override_inr=price_override,
                    status="scheduled"
                )
                
                await db.sessions.insert_one(session.model_dump())
                sessions_created.append(session.id)
        
        current_date += timedelta(days=1)
    
    return {
        "message": f"Created {len(sessions_created)} sessions",
        "sessions_created": len(sessions_created)
    }

@api_router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a session"""
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if session has bookings
    bookings_count = await db.bookings.count_documents({"session_id": session_id})
    if bookings_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete session with existing bookings")
    
    result = await db.sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session deleted successfully"}

# ============== VENUE MANAGEMENT ROUTES ==============
@api_router.post("/venues")
async def create_venue(data: VenueCreate, current_user: Dict = Depends(get_current_user)):
    """Create a new venue for partner"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Only partners can create venues")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    
    # Auto-create partner profile if it doesn't exist (same as /partners/my)
    if not partner:
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        partner = {
            "id": str(uuid.uuid4()),
            "owner_user_id": current_user["id"],
            "brand_name": user.get("name", "My Studio"),
            "legal_name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "address": "",
            "city": "",
            "description": "",
            "kyc_status": "pending",
            "kyc_documents": {},
            "bank_details": {},
            "commission_percent": 15.0,
            "partner_photo": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.partners.insert_one(partner)
        
        # Create audit log
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "action": "partner_auto_created_venue",
            "entity_type": "partner",
            "entity_id": partner["id"],
            "details": {"auto_created": True, "trigger": "venue_creation"},
            "created_at": datetime.now(timezone.utc)
        })
    
    # Geocode address using Google Maps API (optional)
    lat, lng = None, None
    if GOOGLE_MAPS_API_KEY:
        try:
            full_address = f"{data.address}, {data.city}, {data.pincode or ''}"
            gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
            geocode_result = gmaps.geocode(full_address)
            
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                lat = location['lat']
                lng = location['lng']
        except Exception as e:
            print(f"Geocoding error: {e}")
    
    venue = Venue(
        partner_id=partner["id"],
        name=data.name,
        address=data.address,
        city=data.city,
        pincode=data.pincode,
        google_maps_link=data.google_maps_link,
        landmarks=data.landmarks,
        lat=lat,
        lng=lng
    )
    
    await db.venues.insert_one(venue.model_dump())
    return {"id": venue.id, "venue": venue.model_dump()}

@api_router.get("/venues/my")
async def get_my_venues(current_user: Dict = Depends(get_current_user)):
    """Get all venues for current partner"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Only partners can access venues")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    
    # Auto-create partner profile if it doesn't exist
    if not partner:
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        partner = {
            "id": str(uuid.uuid4()),
            "owner_user_id": current_user["id"],
            "brand_name": user.get("name", "My Studio"),
            "legal_name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "address": "",
            "city": "",
            "description": "",
            "kyc_status": "pending",
            "kyc_documents": {},
            "bank_details": {},
            "commission_percent": 15.0,
            "partner_photo": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.partners.insert_one(partner)
        
        # Create audit log
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "action": "partner_auto_created_venues",
            "entity_type": "partner",
            "entity_id": partner["id"],
            "details": {"auto_created": True, "trigger": "venues_fetch"},
            "created_at": datetime.now(timezone.utc)
        })
    
    venues = await db.venues.find(
        {"partner_id": partner["id"], "is_active": True},
        {"_id": 0}
    ).to_list(None)
    
    return {"venues": venues}

@api_router.get("/venues/{venue_id}")
async def get_venue(venue_id: str, current_user: Dict = Depends(get_current_user)):
    """Get specific venue details"""
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Verify partner owns this venue
    if current_user["role"] in ["partner_owner", "partner_staff"]:
        partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
        if partner and venue["partner_id"] != partner["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this venue")
    
    return venue

@api_router.put("/venues/{venue_id}")
async def update_venue(venue_id: str, data: VenueCreate, current_user: Dict = Depends(get_current_user)):
    """Update venue details"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Only partners can update venues")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    if venue["partner_id"] != partner["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this venue")
    
    # Geocode new address if changed
    lat, lng = venue.get("lat"), venue.get("lng")
    if GOOGLE_MAPS_API_KEY and (data.address != venue.get("address") or data.city != venue.get("city")):
        try:
            full_address = f"{data.address}, {data.city}, {data.pincode or ''}"
            gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
            geocode_result = gmaps.geocode(full_address)
            
            if geocode_result:
                location = geocode_result[0]['geometry']['location']
                lat = location['lat']
                lng = location['lng']
        except Exception as e:
            print(f"Geocoding error: {e}")
    
    await db.venues.update_one(
        {"id": venue_id},
        {
            "$set": {
                "name": data.name,
                "address": data.address,
                "city": data.city,
                "pincode": data.pincode,
                "google_maps_link": data.google_maps_link,
                "landmarks": data.landmarks,
                "lat": lat,
                "lng": lng,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Venue updated successfully"}

@api_router.delete("/venues/{venue_id}")
async def delete_venue(venue_id: str, current_user: Dict = Depends(get_current_user)):
    """Soft delete a venue"""
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Only partners can delete venues")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    
    venue = await db.venues.find_one({"id": venue_id})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    if venue["partner_id"] != partner["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this venue")
    
    # Check if venue is used by any active listings
    active_listings = await db.listings.count_documents({"venue_id": venue_id, "status": "active"})
    if active_listings > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete venue. {active_listings} active listings are using this venue"
        )
    
    # Soft delete
    await db.venues.update_one(
        {"id": venue_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Venue deleted successfully"}

# ============== LISTINGS ROUTES ==============
@api_router.post("/listings")
async def create_listing(data: ListingCreate, request: Request, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Only partners can create listings")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    
    # Auto-create partner profile if it doesn't exist (same as other endpoints)
    if not partner:
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        
        partner = {
            "id": str(uuid.uuid4()),
            "owner_user_id": current_user["id"],
            "brand_name": user.get("name", "My Studio"),
            "legal_name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "address": "",
            "city": "",
            "description": "",
            "kyc_status": "pending",
            "kyc_documents": {},
            "bank_details": {},
            "commission_percent": 15.0,
            "partner_photo": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.partners.insert_one(partner)
        
        # Create audit log
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "action": "partner_auto_created_listing",
            "entity_type": "partner",
            "entity_id": partner["id"],
            "details": {"auto_created": True, "trigger": "listing_creation"},
            "created_at": datetime.now(timezone.utc)
        })
    
    # Validate venue requirement for offline listings
    if not data.is_online:
        if not data.venue_id:
            raise HTTPException(
                status_code=400,
                detail="venue_id is required for offline/in-person listings"
            )
        
        # Verify venue exists and belongs to partner
        venue = await db.venues.find_one({"id": data.venue_id})
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
        
        if venue["partner_id"] != partner["id"]:
            raise HTTPException(status_code=403, detail="Venue does not belong to your partner account")
        
        if not venue.get("is_active", True):
            raise HTTPException(status_code=400, detail="Cannot use inactive venue")
    else:
        # For online listings, venue_id should be None
        data.venue_id = None
    
    # Process media - save base64 to files and store paths
    processed_media = []
    uploads_dir = Path("/app/backend/uploads/listings")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    for i, media_url in enumerate(data.media):
        if media_url and media_url.startswith('data:'):
            # This is base64 data - save to file
            try:
                # Extract base64 data
                header, encoded = media_url.split(',', 1)
                
                # Determine file extension
                if 'image/jpeg' in header or 'image/jpg' in header:
                    ext = 'jpg'
                elif 'image/png' in header:
                    ext = 'png'
                elif 'image/webp' in header:
                    ext = 'webp'
                else:
                    ext = 'jpg'  # default
                
                # Generate unique filename (use UUID before listing object is created)
                unique_id = str(uuid.uuid4())
                filename = f"{unique_id}_{i}.{ext}"
                filepath = uploads_dir / filename
                
                # Decode and save
                import base64
                file_data = base64.b64decode(encoded)
                with open(filepath, 'wb') as f:
                    f.write(file_data)
                
                # Store absolute URL with backend domain from request
                # Use /api/uploads to ensure proper routing through ingress
                host = request.headers.get("host", "localhost:8001")
                scheme = "https" if "emergentagent.com" in host else "http"
                backend_url = f"{scheme}://{host}"
                media_path = f"{backend_url}/api/uploads/listings/{filename}"
                processed_media.append(media_path)
                logging.info(f"Media {i}: Saved to {media_path} (size: {len(file_data)} bytes)")
            except Exception as e:
                logging.error(f"Failed to save media {i}: {str(e)}")
                continue
        elif media_url:
            # Already a URL
            processed_media.append(media_url)
            logging.info(f"Media {i}: External URL - {media_url[:100]}")
    
    listing = Listing(
        partner_id=partner["id"],
        **data.model_dump(exclude={'media'}),
        media=processed_media
    )
    
    listing_dict = listing.model_dump()
    logging.info(f"Successfully created listing {listing.id} with {len(processed_media)} media items")
    
    try:
        await db.listings.insert_one(listing_dict)
        
        # Fetch the created listing without _id for clean response
        created_listing = await db.listings.find_one({"id": listing.id}, {"_id": 0})
        return {"listing": created_listing}
    except Exception as e:
        logging.error(f"Failed to insert listing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create listing: {str(e)}")

# Moved to before /listings/{listing_id} to avoid route conflict

@api_router.patch("/listings/{listing_id}")
async def update_listing(listing_id: str, updates: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.listings.update_one({"id": listing_id}, {"$set": updates})
    
    return {"message": "Listing updated successfully", "listing_id": listing_id}

@api_router.post("/sessions")
async def create_session(data: SessionCreate, current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    listing = await db.listings.find_one({"id": data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    end_at = data.start_at + timedelta(minutes=data.duration_minutes)
    
    session = Session(
        listing_id=data.listing_id,
        start_at=data.start_at,
        end_at=end_at,
        seats_total=data.seats_total,
        price_override_inr=data.price_override_inr
    )
    
    await db.sessions.insert_one(session.model_dump())
    return {"session": session.model_dump()}

@api_router.get("/sessions/my")
async def get_my_sessions(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] not in ["partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Not a partner")
    
    partner = await db.partners.find_one({"owner_user_id": current_user["id"]}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0}).to_list(100)
    
    # Return empty array if no listings, don't error
    if not listings:
        return {"sessions": []}
    
    listing_ids = [l["id"] for l in listings]
    sessions = await db.sessions.find({"listing_id": {"$in": listing_ids}}, {"_id": 0}).sort("start_at", 1).to_list(200)
    return {"sessions": sessions}

@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Handle both old (start_at) and new (date/time) session structures
    if "start_at" in session:
        # Old structure
        session_start = session["start_at"]
        if session_start.tzinfo is None:
            session_start = session_start.replace(tzinfo=timezone.utc)
    elif "date" in session and "time" in session:
        # New structure - convert date/time to datetime
        try:
            session_date = datetime.fromisoformat(session["date"])
            session_time_str = session["time"]
            
            # Parse time
            if isinstance(session_time_str, str):
                time_parts = session_time_str.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            else:
                hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
            
            # Combine date and time
            session_start = session_date.replace(
                hour=hour,
                minute=minute,
                second=0,
                microsecond=0,
                tzinfo=timezone.utc
            )
            session["start_at"] = session_start
        except Exception as e:
            logging.error(f"Error parsing session date/time: {e}")
            raise HTTPException(status_code=500, detail="Invalid session date/time format")
    else:
        raise HTTPException(status_code=500, detail="Session missing date/time information")
    
    # Add availability info
    seats_booked = session.get("seats_booked", 0)
    session["seats_available"] = session["seats_total"] - seats_booked
    session["is_bookable"] = (
        session["seats_available"] > 0 and
        datetime.now(timezone.utc) < (session_start - timedelta(minutes=session.get("allow_late_booking_minutes", 60)))
    )
    
    return {"session": session}

# ============== RATINGS ==============
@api_router.post("/ratings")
async def create_rating(data: RatingCreate, current_user: Dict = Depends(get_current_user)):
    # Allow customers and partners to rate classes they've attended
    if current_user["role"] not in ["customer", "partner_owner", "partner_staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify booking
    booking = await db.bookings.find_one({"id": data.booking_id, "user_id": current_user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["booking_status"] not in ["attended", "confirmed"]:
        raise HTTPException(status_code=400, detail="Can only rate attended bookings")
    
    # Check if already rated
    existing = await db.ratings.find_one({"booking_id": data.booking_id}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already rated")
    
    rating = Rating(
        user_id=current_user["id"],
        listing_id=booking["listing_id"],
        booking_id=data.booking_id,
        stars=data.stars,
        text=data.text
    )
    
    await db.ratings.insert_one(rating.model_dump())
    
    # Update listing rating
    ratings = await db.ratings.find({"listing_id": booking["listing_id"]}, {"_id": 0}).to_list(1000)
    avg = sum(r["stars"] for r in ratings) / len(ratings)
    await db.listings.update_one(
        {"id": booking["listing_id"]},
        {"$set": {"rating_avg": round(avg, 1), "rating_count": len(ratings)}}
    )
    
    return {"rating": rating.model_dump()}

@api_router.get("/listings/{listing_id}/ratings")
async def get_listing_ratings(listing_id: str):
    ratings = await db.ratings.find({"listing_id": listing_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Enrich with user names
    for rating in ratings:
        user = await db.users.find_one({"id": rating["user_id"]}, {"_id": 0})
        if user:
            rating["user_name"] = user["name"]
    
    return {"ratings": ratings}

# ============== ADMIN ==============
@api_router.get("/admin/dashboard")
async def admin_dashboard(current_user: Dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    total_partners = await db.partners.count_documents({})
    
    # Revenue - use aggregation for better performance
    revenue_result = await db.bookings.aggregate([
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total_inr"}
        }}
    ]).to_list(1)
    
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_bookings": total_bookings,
        "total_users": total_users,
        "total_partners": total_partners,
        "total_revenue_inr": total_revenue
    }


@api_router.get("/admin/users")
async def admin_get_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: Dict = Depends(get_current_user)
):
    """Get all users with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if role:
        query["role"] = role
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.users.count_documents(query)
    skip = (page - 1) * limit
    
    users = await db.users.find(query, {"_id": 0, "hashed_password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "users": users,
        "page": page,
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }




@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin deletes a user"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Cannot delete admin users
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    # If partner, also delete partner profile
    if user["role"] in ["partner_owner", "partner_staff"]:
        await db.partners.delete_many({"owner_user_id": user_id})
        # Also delete their listings
        partner = await db.partners.find_one({"owner_user_id": user_id}, {"_id": 0})
        if partner:
            await db.listings.delete_many({"partner_id": partner["id"]})
    
    # Delete associated data
    await db.bookings.delete_many({"customer_id": user_id})
    await db.wallets.delete_one({"user_id": user_id})
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "admin_deleted_user",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": user_id,
        "target_type": "user",
        "details": {
            "user_email": user["email"],
            "user_role": user["role"],
            "user_name": user.get("name", "")
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"message": "User deleted successfully", "user_id": user_id}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(
    user_id: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Admin updates user information"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot update admin users
    if user["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot update admin users")
    
    # Prepare update fields
    update_fields = {}
    if name is not None:
        update_fields["name"] = name
    if email is not None:
        # Check if email already exists for another user
        existing = await db.users.find_one({"email": email, "id": {"$ne": user_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_fields["email"] = email
    if phone is not None:
        update_fields["phone"] = phone
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user_id}, {"$set": update_fields})
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "admin_updated_user",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": user_id,
        "target_type": "user",
        "details": {
            "updated_fields": list(update_fields.keys()),
            "user_email": user["email"]
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return {"message": "User updated successfully", "user": updated_user}

# ==================== BADGE MANAGEMENT ENDPOINTS ====================

@api_router.post("/admin/partners/{partner_id}/badge/verify")
async def admin_verify_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin assigns 'Verified by rayy' badge to partner"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find partner
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update partner with verified badge
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "verified_by_rrray": True,
                "verified_date": datetime.now(timezone.utc),
                "verified_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc)
            },
            "$addToSet": {"badges": "verified"}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "partner_verified",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": partner_id,
        "target_type": "partner",
        "details": {
            "badge": "verified_by_rrray",
            "partner_name": partner.get("brand_name")
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"message": "Partner verified successfully", "badge": "verified_by_rrray"}

@api_router.delete("/admin/partners/{partner_id}/badge/verify")
async def admin_unverify_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin removes 'Verified by rayy' badge from partner"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Update partner
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "verified_by_rrray": False,
                "updated_at": datetime.now(timezone.utc)
            },
            "$pull": {"badges": "verified"}
        }
    )
    
    return {"message": "Verified badge removed"}

@api_router.post("/admin/partners/{partner_id}/badge/founding")
async def admin_mark_founding_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin assigns 'Founding Partner' badge (PERMANENT)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find partner
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Check if already a founding partner
    if partner.get("founding_partner"):
        raise HTTPException(status_code=400, detail="Already a founding partner")
    
    # Update partner with founding partner badge (PERMANENT)
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "founding_partner": True,
                "founding_partner_date": datetime.now(timezone.utc),
                "founding_partner_granted_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc)
            },
            "$addToSet": {"badges": "founding"}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "founding_partner_granted",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": partner_id,
        "target_type": "partner",
        "details": {
            "badge": "founding_partner",
            "partner_name": partner.get("brand_name"),
            "permanent": True
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Founding Partner badge granted successfully (PERMANENT)",
        "badge": "founding_partner"
    }

@api_router.post("/admin/listings/{listing_id}/badge/verify")
async def admin_verify_listing(
    listing_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin assigns 'Verified by rayy' badge to listing"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Update listing with verified badge
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "verified_by_rrray": True,
                "verified_date": datetime.now(timezone.utc),
                "verified_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc)
            },
            "$addToSet": {"badges": "verified"}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_verified",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "badge": "verified_by_rrray",
            "listing_title": listing.get("title")
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"message": "Listing verified successfully", "badge": "verified_by_rrray"}

@api_router.delete("/admin/listings/{listing_id}/badge/verify")
async def admin_unverify_listing(
    listing_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin removes 'Verified by rayy' badge from listing"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Update listing
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "verified_by_rrray": False,
                "updated_at": datetime.now(timezone.utc)
            },
            "$pull": {"badges": "verified"}
        }
    )
    
    return {"message": "Verified badge removed"}

# ==================== ADMIN LISTING MANAGEMENT ====================

@api_router.get("/admin/listings")
async def admin_get_all_listings(
    status: Optional[str] = None,
    partner_id: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Get all listings with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if partner_id:
        query["partner_id"] = partner_id
    if category:
        query["category"] = category
    
    # Get listings
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.listings.count_documents(query)
    
    return {
        "listings": listings,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.get("/admin/listings/pending")
async def admin_get_pending_listings(
    skip: int = 0,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Get all pending listings awaiting approval"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get pending listings
    query = {"approval_status": "pending"}
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.listings.count_documents(query)
    
    return {
        "listings": listings,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/listings/{listing_id}/approve")
async def admin_approve_listing(
    listing_id: str,
    admin_notes: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Approve a pending listing and make it live"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Update approval status and make it live
    update_fields = {
        "approval_status": "approved",
        "is_live": True,
        "status": "active",
        "approved_at": datetime.now(timezone.utc),
        "approved_by": current_user["id"],
        "updated_at": datetime.now(timezone.utc)
    }
    
    if admin_notes:
        update_fields["admin_notes"] = admin_notes
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": update_fields}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_approved",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "listing_title": listing.get("title"),
            "partner_id": listing.get("partner_id"),
            "admin_notes": admin_notes
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Listing approved and made live successfully",
        "listing_id": listing_id,
        "approval_status": "approved",
        "is_live": True
    }

@api_router.post("/admin/listings/{listing_id}/reject")
async def admin_reject_listing(
    listing_id: str,
    reason: str,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Reject a pending listing"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Update approval status to rejected
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "approval_status": "rejected",
                "is_live": False,
                "admin_notes": reason,
                "rejected_at": datetime.now(timezone.utc),
                "rejected_by": current_user["id"],
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_rejected",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "listing_title": listing.get("title"),
            "partner_id": listing.get("partner_id"),
            "rejection_reason": reason
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Listing rejected",
        "listing_id": listing_id,
        "approval_status": "rejected"
    }

@api_router.put("/admin/listings/{listing_id}/edit")
async def admin_edit_listing(
    listing_id: str,
    updates: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Edit any field of a listing including video_url"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Add metadata
    updates["updated_at"] = datetime.now(timezone.utc)
    updates["updated_by"] = current_user["id"]
    
    # Update listing
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": updates}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_edited_by_admin",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "listing_title": listing.get("title"),
            "updated_fields": list(updates.keys())
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Listing updated successfully",
        "listing_id": listing_id,
        "updated_fields": list(updates.keys())
    }

@api_router.put("/admin/listings/{listing_id}/status")
async def admin_update_listing_status(
    listing_id: str,
    status: str,
    reason: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Update listing status (draft/active/paused/rejected)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Validate status
    valid_statuses = ["draft", "active", "paused", "rejected", "pending"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Update status
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc),
        "updated_by": current_user["id"]
    }
    
    if reason:
        update_data["status_reason"] = reason
    
    await db.listings.update_one(
        {"id": listing_id},
        {"$set": update_data}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_status_updated",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "old_status": listing.get("status"),
            "new_status": status,
            "reason": reason,
            "listing_title": listing.get("title")
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": f"Listing status updated to {status}",
        "listing_id": listing_id,
        "status": status
    }

@api_router.delete("/admin/listings/{listing_id}")
async def admin_delete_listing(
    listing_id: str,
    reason: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Admin: Delete a listing (soft delete)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find listing
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Soft delete by updating status
    await db.listings.update_one(
        {"id": listing_id},
        {
            "$set": {
                "status": "deleted",
                "deleted_at": datetime.now(timezone.utc),
                "deleted_by": current_user["id"],
                "deletion_reason": reason,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "listing_deleted",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "listing_title": listing.get("title"),
            "partner_id": listing.get("partner_id"),
            "reason": reason
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Listing deleted successfully",
        "listing_id": listing_id
    }

# ==================== CREDIT WALLET ENDPOINTS ====================

@api_router.get("/wallet")
async def get_customer_wallet(current_user: Dict = Depends(get_current_user)):
    """Get customer credit wallet with balance and recent transactions"""
    user_id = current_user["id"]
    
    # Get or create wallet from the correct collection
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        # Create wallet with welcome bonus
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "credits_balance": 50,
            "balance": 50,  # Keep for backward compatibility
            "lifetime_earned": 50,
            "lifetime_spent": 0,
            "last_activity": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "tier": "silver",
            "status": "active"
        }
        await db.wallets.insert_one(wallet)
        
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
    
    # Ensure wallet has both balance and credits_balance for compatibility
    if wallet and "credits_balance" in wallet and "balance" not in wallet:
        wallet["balance"] = wallet["credits_balance"]
    
    return {
        "wallet": wallet,
        "transactions": transactions,
        "expiring_soon": {
            "amount": expiring_amount,
            "days_left": 7
        }
    }

@api_router.get("/credit-packages")
async def get_credit_packages():
    """Get available credit purchase packages"""
    packages = await db.credit_packages.find(
        {"active": True},
        {"_id": 0}
    ).sort("amount_inr", 1).to_list(length=None)
    
    return {"packages": packages}

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

@api_router.get("/admin/users/stats")
async def admin_get_user_stats(current_user: Dict = Depends(get_current_user)):
    """Get user statistics"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    total = await db.users.count_documents({})
    customers = await db.users.count_documents({"role": "customer"})
    partners = await db.users.count_documents({"role": {"$in": ["partner_owner", "partner_staff"]}})
    admins = await db.users.count_documents({"role": "admin"})
    
    return {
        "total": total,
        "customers": customers,
        "partners": partners,
        "admins": admins
    }


@api_router.post("/admin/listings/create")
async def admin_create_listing(
    listing_data: dict,
    current_user: Dict = Depends(get_current_user)
):
    """Admin creates a listing on behalf of a partner"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner_id = listing_data.get("partner_id")
    if not partner_id:
        raise HTTPException(status_code=400, detail="Partner ID required")
    
    # Verify partner exists and is approved
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    if partner.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Partner must be approved to create listings")
    
    # Create listing
    listing_id = str(uuid.uuid4())
    listing = {
        "id": listing_id,
        "partner_id": partner_id,
        "title": listing_data.get("title"),
        "category": listing_data.get("category", "other"),
        "age_min": listing_data.get("age_min", 5),
        "age_max": listing_data.get("age_max", 15),
        "description": listing_data.get("description", ""),
        "address": listing_data.get("address"),
        "city": listing_data.get("city"),
        "state": listing_data.get("state"),
        "pincode": listing_data.get("pincode"),
        "location": {
            "type": "Point",
            "coordinates": [
                listing_data.get("longitude", 77.0266),
                listing_data.get("latitude", 28.4595)
            ]
        },
        "price_inr": listing_data.get("price_inr", 500),
        "duration_minutes": listing_data.get("duration_minutes", 60),
        "max_capacity": listing_data.get("max_capacity", 10),
        "active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": "admin",
        "admin_id": current_user["id"]
    }
    
    await db.listings.insert_one(listing)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "admin_created_listing",
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "target_id": listing_id,
        "target_type": "listing",
        "details": {
            "partner_id": partner_id,
            "partner_name": partner["brand_name"],
            "listing_title": listing["title"]
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {
        "message": "Listing created successfully",
        "listing_id": listing_id,
        "listing": listing
    }



# ============== HOME ENRICHMENT APIs ==============
@api_router.get("/home/trending")
async def get_trending_listings(city: Optional[str] = "Gurgaon", limit: int = 50):
    """Get trending listings by last 7-day bookings"""
    # Get bookings from last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Aggregate bookings by listing_id
    pipeline = [
        {"$match": {"booked_at": {"$gte": seven_days_ago}}},
        {"$group": {"_id": "$listing_id", "booking_count": {"$sum": 1}}},
        {"$sort": {"booking_count": -1}},
        {"$limit": limit}
    ]
    
    trending = await db.bookings.aggregate(pipeline).to_list(limit)
    listing_ids = [t["_id"] for t in trending]
    
    if not listing_ids or len(listing_ids) < 10:
        # Fallback to featured (highest rated) and mix with trending
        fallback_listings = await db.listings.find(
            {"status": "active"},
            {"_id": 0}
        ).sort("rating_avg", -1).limit(limit).to_list(limit)
        
        if listing_ids:
            # Get trending listings first
            trending_listings = await db.listings.find(
                {"id": {"$in": listing_ids}, "status": "active"},
                {"_id": 0}
            ).to_list(len(listing_ids))
            
            # Add fallback listings that aren't already in trending
            trending_ids_set = {l["id"] for l in trending_listings}
            for fb_listing in fallback_listings:
                if fb_listing["id"] not in trending_ids_set:
                    trending_listings.append(fb_listing)
            
            listings = trending_listings[:limit]
        else:
            listings = fallback_listings
    else:
        listings = await db.listings.find(
            {"id": {"$in": listing_ids}, "status": "active"},
            {"_id": 0}
        ).to_list(limit)
    
    # Enrich with next session and partner info
    for listing in listings:
        # Get next session
        now = datetime.now(timezone.utc)
        session = await db.sessions.find_one(
            {
                "listing_id": listing["id"],
                "status": "scheduled",
                "start_at": {"$gt": now}
            },
            {"_id": 0}
        )
        if session:
            seats_booked = session.get("seats_booked", 0)
            listing["next_session"] = {
                "id": session["id"],
                "start_at": session["start_at"],
                "seats_available": session["seats_total"] - seats_booked
            }
        
        # Get partner
        partner = await db.partners.find_one({"id": listing["partner_id"]}, {"_id": 0})
        if partner:
            listing["partner_city"] = partner.get("city", "Not specified")
    
    return {"listings": listings}

@api_router.get("/home/trials")
async def get_trial_sessions(limit: int = 50):
    """Get trial sessions available within next 7 days"""
    now = datetime.now(timezone.utc)
    seven_days = now + timedelta(days=7)
    
    # Find listings with trials
    listings = await db.listings.find(
        {"trial_available": True, "status": "active"},
        {"_id": 0}
    ).limit(limit * 2).to_list(limit * 2)  # Fetch more to filter
    
    # Enrich with next session within 7 days
    result = []
    for listing in listings:
        # Check for any upcoming session (scheduled or upcoming status)
        session = await db.sessions.find_one(
            {
                "listing_id": listing["id"],
                "status": {"$in": ["scheduled", "upcoming"]},
                "datetime": {"$gte": now.isoformat(), "$lte": seven_days.isoformat()}
            },
            {"_id": 0}
        )
        
        # Fallback: check with start_at field
        if not session:
            session = await db.sessions.find_one(
                {
                    "listing_id": listing["id"],
                    "status": {"$in": ["scheduled", "upcoming"]},
                    "start_at": {"$gte": now, "$lte": seven_days}
                },
                {"_id": 0}
            )
        
        if session:
            listing["next_session"] = {
                "id": session.get("id"),
                "start_at": session.get("start_at") or session.get("datetime"),
                "seats_available": session.get("seats_total", 10) - session.get("seats_booked", 0)
            }
            result.append(listing)
            
            # Stop when we have enough results
            if len(result) >= limit:
                break
    
    return {"listings": result}

@api_router.get("/home/starting-soon")
async def get_starting_soon():
    """Get sessions starting within next 2 hours"""
    now = datetime.now(timezone.utc)
    two_hours = now + timedelta(hours=2)
    cutoff = now + timedelta(minutes=60)  # Don't show if < 60 min
    
    sessions = await db.sessions.find(
        {
            "status": "scheduled",
            "start_at": {"$gte": cutoff, "$lte": two_hours},
            "$expr": {"$lt": ["$seats_booked", "$seats_total"]}
        },
        {"_id": 0}
    ).sort("start_at", 1).limit(10).to_list(10)
    
    # Enrich with listing info
    for session in sessions:
        listing = await db.listings.find_one({"id": session["listing_id"]}, {"_id": 0})
        if listing:
            session["listing"] = {
                "id": listing["id"],
                "title": listing["title"],
                "media": listing.get("media", []),
                "age_min": listing["age_min"],
                "age_max": listing["age_max"],
                "base_price_inr": listing["base_price_inr"]
            }
        seats_booked = session.get("seats_booked", 0)
        session["seats_available"] = session["seats_total"] - seats_booked
        session["countdown_seconds"] = int((session["start_at"] - now).total_seconds())
    
    return {"sessions": sessions}

@api_router.get("/home/weekend-camps")
async def get_weekend_camps(limit: int = 12):
    """Get upcoming camps (listing_type=camp)"""
    
    camps = await db.listings.find(
        {
            "status": "active",
            "listing_type": "camp"
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with partner details
    for camp in camps:
        partner = await db.users.find_one(
            {"id": camp["partner_id"]}, 
            {"_id": 0, "name": 1, "badges": 1}
        )
        if partner:
            camp["partner_name"] = partner.get("name", "Partner")
            camp["partner_badges"] = partner.get("badges", [])
    
    return {"camps": camps}

@api_router.get("/home/workshops")
async def get_workshops(limit: int = 15):
    """Get upcoming expert workshops (listing_type=workshop)"""
    now = datetime.now(timezone.utc)
    
    workshops = await db.listings.find(
        {
            "status": "active",
            "listing_type": "workshop"
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Calculate seats left and add metadata
    for workshop in workshops:
        workshop["seats_left"] = workshop.get("seats_total", 0) - workshop.get("seats_booked", 0)
        
        # Add urgency if not already present
        if not workshop.get("urgency_message"):
            if workshop["seats_left"] <= 15:
                workshop["urgency_message"] = f"🔥 Only {workshop['seats_left']} seats left!"
            elif workshop.get("seats_booked", 0) > workshop.get("seats_total", 1) * 0.7:
                workshop["urgency_message"] = "⏰ Filling fast!"
    
    return {"workshops": workshops}

@api_router.get("/home/for-age/{age}")
async def get_for_age(age: int, limit: int = 6):
    """Get listings for specific age"""
    listings = await db.listings.find(
        {
            "age_min": {"$lte": age},
            "age_max": {"$gte": age},
            "status": "active"
        },
        {"_id": 0}
    ).sort("rating_avg", -1).limit(limit).to_list(limit)
    
    # Enrich with next session
    for listing in listings:
        now = datetime.now(timezone.utc)
        session = await db.sessions.find_one(
            {
                "listing_id": listing["id"],
                "status": "scheduled",
                "start_at": {"$gt": now}
            },
            {"_id": 0}
        )
        if session:
            seats_booked = session.get("seats_booked", 0)
            listing["next_session"] = {
                "id": session["id"],
                "start_at": session["start_at"],
                "seats_available": session["seats_total"] - seats_booked
            }
    
    return {"listings": listings}

@api_router.get("/home/top-partners")
async def get_top_partners(limit: int = 6):
    """Get top-rated partners (≥4.6 rating, ≥10 reviews)"""
    # Get all listings with high ratings
    listings = await db.listings.find(
        {
            "rating_avg": {"$gte": 4.6},
            "rating_count": {"$gte": 10},
            "status": "active"
        },
        {"_id": 0}
    ).to_list(1000)


# ============== ADMIN PARTNER MANAGEMENT ==============
@api_router.get("/admin/partners")
async def admin_get_partners(
    status: Optional[str] = None,
    kyc_status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: Dict = Depends(get_current_user)
):
    """Get all partners for admin review"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    if kyc_status:
        query["kyc_status"] = kyc_status
    
    # Get total count
    total = await db.partners.count_documents(query)
    
    # Get partners with pagination
    skip = (page - 1) * limit
    partners = await db.partners.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with owner user info
    for partner in partners:
        user = await db.users.find_one({"id": partner["owner_user_id"]}, {"_id": 0, "name": 1, "email": 1, "phone": 1})
        if user:
            partner["owner_name"] = user.get("name")
            partner["owner_email"] = user.get("email")
            partner["owner_phone"] = user.get("phone")
        
        # Get venue count
        venue_count = await db.venues.count_documents({"partner_id": partner["id"]})
        partner["venue_count"] = venue_count
        
        # Get listing count
        listing_count = await db.listings.count_documents({"partner_id": partner["id"]})
        partner["listing_count"] = listing_count
    
    return {
        "partners": partners,
        "page": page,
        "total": total,
        "pages": (total + limit - 1) // limit
    }


@api_router.post("/admin/partners/create")
async def admin_create_partner(
    partner_data: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Admin creates a new partner account manually"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Extract user and partner data
        email = partner_data.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Hash password
        password = partner_data.get('password')
        if not password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(password)
        
        # Create user account
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "name": partner_data.get('name'),
            "email": email,
            "phone": partner_data.get('phone'),
            "password": hashed_password,
            "role": "partner_owner",
            "status": partner_data.get('status', 'pending'),
            "onboardingCompleted": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "admin",
            "admin_created_by": current_user.get("id"),
            
            # Organization details
            "organizationName": partner_data.get('organizationName'),
            "organizationType": partner_data.get('organizationType'),
            "description": partner_data.get('description'),
            
            # Location
            "address": partner_data.get('address'),
            "city": partner_data.get('city'),
            "state": partner_data.get('state'),
            "pincode": partner_data.get('pincode'),
            
            # Categories & Capacity
            "categories": partner_data.get('categories', []),
            "ageBrackets": partner_data.get('ageBrackets', []),
            "monthlyCapacity": partner_data.get('monthlyCapacity'),
            
            # Contact
            "contactNumber": partner_data.get('contactNumber') or partner_data.get('phone'),
            "alternateNumber": partner_data.get('alternateNumber'),
            
            # T&C acceptance (admin-created bypass)
            "tnc_acceptance": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0",
                "accepted_at": datetime.now(timezone.utc).isoformat(),
                "created_by_admin": True,
                "admin_id": current_user.get("id")
            }
        }
        
        await db.users.insert_one(user_doc)
        
        # Create partner document
        partner_id = str(uuid.uuid4())
        partner_doc = {
            "id": partner_id,
            "owner_user_id": user_id,
            "owner_email": email,
            "owner_name": partner_data.get('name'),
            "brand_name": partner_data.get('organizationName'),
            "legal_name": partner_data.get('organizationName'),
            "description": partner_data.get('description'),
            "address": partner_data.get('address'),
            "city": partner_data.get('city'),
            "state": partner_data.get('state'),
            "pincode": partner_data.get('pincode'),
            "status": partner_data.get('status', 'pending'),
            "kyc_status": "pending",
            "kyc_documents_submitted": False,
            "categories": partner_data.get('categories', []),
            "age_brackets": partner_data.get('ageBrackets', []),
            "monthly_capacity": partner_data.get('monthlyCapacity'),
            "contact_number": partner_data.get('contactNumber') or partner_data.get('phone'),
            "alternate_number": partner_data.get('alternateNumber'),
            "verification_badges": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "admin",
            "admin_created_by": current_user.get("id")
        }
        
        result = await db.partners.insert_one(partner_doc)
        logging.info(f"Partner document inserted: partner_id={partner_id}, brand_name={partner_data.get('organizationName')}")
        
        # Send invitation email if requested
        if partner_data.get('sendEmail', True):
            try:
                from email_service import email_service
                
                # Send admin-created partner invitation
                email_service.send_partner_admin_invitation(
                    partner_email=email,
                    partner_data={
                        'name': partner_data.get('name'),
                        'email': email,
                        'password': password,  # Send plaintext password in email
                        'organizationName': partner_data.get('organizationName'),
                        'status': partner_data.get('status', 'pending')
                    }
                )
            except Exception as e:
                logging.error(f"Failed to send invitation email: {e}")
        
        return {
            "message": "Partner created successfully",
            "user_id": user_id,
            "partner_id": partner_id,
            "email": email,
            "status": partner_data.get('status', 'pending')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating partner: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/partners/{partner_id}/approve")
async def admin_approve_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Approve partner and activate their account"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get partner
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Validate and geocode partner address if not already done
    if not partner.get("lat") or not partner.get("lng"):
        geocode_result = geocode_address(
            partner.get("address", ""),
            partner.get("city", ""),
            "IN"
        )
        
        if geocode_result["success"] and geocode_result["is_valid"]:
            # Update partner with geocoded location
            await db.partners.update_one(
                {"id": partner_id},
                {
                    "$set": {
                        "lat": geocode_result["lat"],
                        "lng": geocode_result["lng"],
                        "formatted_address": geocode_result["formatted_address"]
                    }
                }
            )
            logging.info(f"Geocoded partner address: {geocode_result['formatted_address']}")
        else:
            logging.warning(f"Failed to geocode partner address: {geocode_result.get('error', 'Unknown error')}")
    
    # Update partner status
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "status": "active",
                "kyc_status": "approved",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create audit log
    audit_entry = {
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "action": "partner_approved",
        "resource_type": "partner",
        "resource_id": partner_id,
        "details": {
            "partner_name": partner["brand_name"],
            "previous_status": partner.get("status"),
            "new_status": "active"
        },
        "timestamp": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(audit_entry)
    
    # Send approval email to partner
    try:
        from email_service import email_service
        owner = await db.users.find_one({"id": partner["owner_user_id"]}, {"_id": 0})
        if owner:
            email_service.send_partner_approval_notification(
                owner["email"],
                {
                    "name": owner.get("name", "Partner"),
                    "organizationName": partner.get("brand_name")
                }
            )
    except Exception as e:
        logging.error(f"Failed to send approval email: {str(e)}")
    
    return {
        "message": "Partner approved successfully",
        "partner_id": partner_id
    }

class PartnerRejectRequest(BaseModel):
    reason: str

@api_router.put("/admin/partners/{partner_id}/reject")
async def admin_reject_partner(
    partner_id: str,
    request: PartnerRejectRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Reject partner application - partner can resubmit after addressing issues"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reason = request.reason
    
    # Get partner
    partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update partner status to rejected
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "status": "rejected",
                "kyc_status": "rejected",
                "rejection_reason": reason,
                "rejection_date": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Create audit log
    audit_entry = {
        "id": str(uuid.uuid4()),
        "actor_id": current_user["id"],
        "actor_role": "admin",
        "action": "partner_rejected",
        "resource_type": "partner",
        "resource_id": partner_id,
        "details": {
            "partner_name": partner["brand_name"],
            "reason": reason
        },
        "timestamp": datetime.now(timezone.utc)
    }
    await db.audit_logs.insert_one(audit_entry)
    
    # Send rejection email to partner with resubmission instructions
    try:
        from email_service import email_service
        owner = await db.users.find_one({"id": partner["owner_user_id"]}, {"_id": 0})
        if owner:
            email_service.send_partner_rejection(
                owner["email"],
                {
                    "brand_name": partner["brand_name"],
                    "owner_name": owner.get("name", "Partner")
                },
                reason
            )
    except Exception as e:
        logging.error(f"Failed to send rejection email: {str(e)}")
    
    return {
        "message": "Partner rejected - they can resubmit after addressing the issues",
        "partner_id": partner_id,
        "reason": reason
    }

    
    # Group by partner
    partner_ids = list(set([l["partner_id"] for l in listings]))
    
    partners = await db.partners.find(
        {"id": {"$in": partner_ids}, "status": "active"},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Enrich with categories
    for partner in partners:
        partner_listings = [l for l in listings if l["partner_id"] == partner["id"]]
        category_ids = list(set([l["category_id"] for l in partner_listings]))
        categories = await db.categories.find(
            {"id": {"$in": category_ids}},
            {"_id": 0}
        ).to_list(10)
        partner["categories"] = [c["name"] for c in categories]
        partner["avg_rating"] = sum(l["rating_avg"] for l in partner_listings) / len(partner_listings) if partner_listings else 0
    
    return {"partners": partners}

# ============== ADMIN ENHANCED APIs ==============
@api_router.get("/admin/dashboard/today")
async def admin_dashboard_today(current_user: Dict = Depends(get_current_user)):
    """Enhanced dashboard with today's metrics"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Today's bookings
    today_bookings = await db.bookings.count_documents({
        "booked_at": {"$gte": today_start, "$lt": today_end}
    })
    
    # Today's revenue
    bookings_today = await db.bookings.find({
        "booked_at": {"$gte": today_start, "$lt": today_end}
    }, {"_id": 0}).to_list(1000)
    today_revenue = sum(b.get("total_inr", 0) for b in bookings_today)
    credits_used = sum(b.get("credits_used", 0) for b in bookings_today)
    
    # Attendance rate (simplified)
    total_bookings = await db.bookings.count_documents({})
    attended = await db.bookings.count_documents({"booking_status": "attended"})
    attendance_rate = (attended / total_bookings * 100) if total_bookings > 0 else 0
    
    # Cancellations by window
    cancellations = await db.bookings.find({"booking_status": "canceled"}, {"_id": 0}).to_list(1000)
    cancel_by_window = {
        "6h_plus": 0,
        "2h_to_6h": 0,
        "under_2h": 0
    }
    
    # New users today
    new_users = await db.users.count_documents({
        "created_at": {"$gte": today_start, "$lt": today_end}
    })
    
    # Top 5 listings by today's bookings
    pipeline = [
        {"$match": {"booked_at": {"$gte": today_start, "$lt": today_end}}},
        {"$group": {"_id": "$listing_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_listings_ids = await db.bookings.aggregate(pipeline).to_list(5)
    
    top_listings = []
    for item in top_listings_ids:
        listing = await db.listings.find_one({"id": item["_id"]}, {"_id": 0})
        if listing:
            top_listings.append({
                "title": listing["title"],
                "bookings": item["count"]
            })
    
    # Last 7 days bookings (sparkline data)
    seven_days_data = []
    for i in range(7):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = await db.bookings.count_documents({
            "booked_at": {"$gte": day_start, "$lt": day_end}
        })
        seven_days_data.append({"date": day_start.isoformat(), "count": count})
    
    return {
        "today_bookings": today_bookings,
        "today_revenue_inr": today_revenue,
        "credits_used_today": credits_used,
        "attendance_rate": round(attendance_rate, 1),
        "cancellations_by_window": cancel_by_window,
        "new_users_today": new_users,
        "top_listings": top_listings,
        "last_7_days": list(reversed(seven_days_data))
    }

@api_router.get("/admin/bookings/all")
async def admin_get_all_bookings(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get all bookings with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["booking_status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("booked_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich
    for booking in bookings:
        listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
        if listing:
            booking["listing_title"] = listing["title"]
        
        session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
        if session:
            # Handle both old (start_at) and new (date/time) session structures
            if "start_at" in session:
                booking["session_start"] = session["start_at"]
            elif "date" in session and "time" in session:
                # Convert date/time to datetime for compatibility
                try:
                    session_date = datetime.fromisoformat(session["date"])
                    session_time_str = session["time"]
                    
                    # Parse time
                    if isinstance(session_time_str, str):
                        time_parts = session_time_str.split(':')
                        hour = int(time_parts[0])
                        minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                    else:
                        hour = session_time_str.hour if hasattr(session_time_str, 'hour') else 0
                        minute = session_time_str.minute if hasattr(session_time_str, 'minute') else 0
                    
                    # Combine date and time
                    session_datetime = session_date.replace(
                        hour=hour,
                        minute=minute,
                        second=0,
                        microsecond=0,
                        tzinfo=timezone.utc
                    )
                    
                    booking["session_start"] = session_datetime
                except Exception as e:
                    logging.warning(f"Error parsing session date/time for booking {booking['id']}: {e}")
                    booking["session_start"] = None
    
    total = await db.bookings.count_documents(query)
    
    return {"bookings": bookings, "total": total}

@api_router.get("/admin/partners/all")
async def admin_get_all_partners(
    skip: int = 0,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get all partners"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partners = await db.partners.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with stats
    for partner in partners:
        # Count active listings
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
    
    total = await db.partners.count_documents({})
    
    return {"partners": partners, "total": total}

@api_router.get("/admin/payouts/weekly")
async def admin_get_payouts(current_user: Dict = Depends(get_current_user)):
    """Get weekly payout statements"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Calculate payouts for all partners
    partners = await db.partners.find({}, {"_id": 0}).to_list(100)
    
    payouts = []
    for partner in partners:
        # Get all bookings for this partner
        listings = await db.listings.find({"partner_id": partner["id"]}, {"_id": 0}).to_list(100)
        listing_ids = [l["id"] for l in listings]
        
        bookings = await db.bookings.find({
            "listing_id": {"$in": listing_ids},
            "booking_status": {"$in": ["confirmed", "attended"]}
        }, {"_id": 0}).to_list(1000)
        
        gross = sum(b.get("total_inr", 0) for b in bookings)
        fees = gross * 0.15  # 15% commission
        
        # Calculate refunds
        refunds = await db.bookings.find({
            "listing_id": {"$in": listing_ids},
            "booking_status": "refunded"
        }, {"_id": 0}).to_list(1000)
        refund_amount = sum(r.get("refund_amount_inr", 0) for r in refunds)
        
        net = gross - fees - refund_amount
        
        payouts.append({
            "partner_id": partner["id"],
            "partner_name": partner["brand_name"],
            "period": "Current Week",
            "gross_inr": gross,
            "fees_inr": fees,
            "refunds_inr": refund_amount,
            "net_inr": net,
            "status": "pending"
        })
    
    return {"payouts": payouts}


@api_router.get("/admin/payout-requests")
async def admin_get_payout_requests(
    status: Optional[str] = None,  # pending, approved, rejected, completed
    partner_id: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get all payout requests with filters"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["status"] = status
    if partner_id:
        query["partner_id"] = partner_id
    
    total = await db.payout_requests.count_documents(query)
    skip = (page - 1) * limit
    
    requests = await db.payout_requests.find(
        query,
        {"_id": 0}
    ).sort("requested_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "requests": requests,
        "page": page,
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }


class PayoutApprovalRequest(BaseModel):
    reference_number: Optional[str] = None
    notes: Optional[str] = None


@api_router.put("/admin/payout-requests/{payout_id}/approve")
async def admin_approve_payout(
    payout_id: str,
    request: PayoutApprovalRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Approve and process a payout request"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get payout request
    payout = await db.payout_requests.find_one({"id": payout_id}, {"_id": 0})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    
    if payout["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve payout with status: {payout['status']}")
    
    # Update payout status
    await db.payout_requests.update_one(
        {"id": payout_id},
        {"$set": {
            "status": "completed",
            "processed_at": datetime.now(timezone.utc),
            "processed_by": current_user["id"],
            "reference_number": request.reference_number or f"PAY-{payout_id[:8].upper()}",
            "admin_notes": request.notes or ""
        }}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "payout_approved",
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "target_id": payout_id,
        "target_type": "payout_request",
        "details": {
            "partner_id": payout["partner_id"],
            "amount_inr": payout["amount_inr"],
            "reference_number": request.reference_number
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    # TODO: Send email notification to partner about approved payout
    
    return {
        "message": "Payout approved and processed successfully",
        "payout_id": payout_id,
        "status": "completed"
    }


@api_router.put("/admin/payout-requests/{payout_id}/reject")
async def admin_reject_payout(
    payout_id: str,
    reason: str,
    current_user: Dict = Depends(get_current_user)
):
    """Reject a payout request"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get payout request
    payout = await db.payout_requests.find_one({"id": payout_id}, {"_id": 0})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    
    if payout["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject payout with status: {payout['status']}")
    
    # Update payout status
    await db.payout_requests.update_one(
        {"id": payout_id},
        {"$set": {
            "status": "rejected",
            "processed_at": datetime.now(timezone.utc),
            "processed_by": current_user["id"],
            "rejection_reason": reason
        }}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "payout_rejected",
        "actor_id": current_user["id"],
        "actor_role": current_user["role"],
        "target_id": payout_id,
        "target_type": "payout_request",
        "details": {
            "partner_id": payout["partner_id"],
            "amount_inr": payout["amount_inr"],
            "reason": reason
        },
        "timestamp": datetime.now(timezone.utc)
    })
    
    # TODO: Send email notification to partner about rejected payout
    
    return {
        "message": "Payout request rejected",
        "payout_id": payout_id,
        "status": "rejected",
        "reason": reason
    }




# ============== ADMIN BOOKINGS MANAGEMENT ==============
class BookingActionRequest(BaseModel):
    action: str
    reason: Optional[str] = None

@api_router.post("/admin/bookings/{booking_id}/action")
async def admin_booking_action(
    booking_id: str,
    request: BookingActionRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Admin action on booking"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if request.action == "cancel":
        session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        now = datetime.now(timezone.utc)
        hours_before = (session["start_at"] - now).total_seconds() / 3600
        
        refund_pct = 0
        if hours_before >= 6:
            refund_pct = 100
        elif hours_before >= 2:
            refund_pct = 50
        
        refund_amount = booking["total_inr"] * (refund_pct / 100)
        refund_credits = int(booking.get("credits_used", 0) * (refund_pct / 100))
        
        await db.sessions.update_one({"id": booking["session_id"]}, {"$inc": {"seats_booked": -1}})
        
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
        
        # Log audit
        await db.audit_logs.insert_one({
            "id": str(uuid.uuid4()),
            "actor_user_id": current_user["id"],
            "action": "booking.cancel",
            "entity": "booking",
            "entity_id": booking_id,
            "before": booking,
            "after": await db.bookings.find_one({"id": booking_id}, {"_id": 0}),
            "at": datetime.now(timezone.utc)
        })
        
        return {"message": "Booking canceled", "refund_amount_inr": refund_amount, "refund_credits": refund_credits}
    
    elif request.action == "mark_attended":
        await db.bookings.update_one({"id": booking_id}, {"$set": {"booking_status": "attended"}})
        return {"message": "Marked as attended"}
    
    elif request.action == "mark_no_show":
        await db.bookings.update_one({"id": booking_id}, {"$set": {"booking_status": "no_show"}})
        return {"message": "Marked as no-show"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@api_router.get("/admin/bookings/export")
async def export_bookings_csv(
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Export bookings as CSV"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["booking_status"] = status
    if from_date and to_date:
        start = datetime.fromisoformat(from_date)
        end = datetime.fromisoformat(to_date)
        query["booked_at"] = {"$gte": start, "$lt": end}
    
    # Limit to 5000 bookings for CSV export to prevent memory issues
    # For larger exports, consider implementing pagination or streaming
    bookings = await db.bookings.find(query, {"_id": 0}).sort("booked_at", -1).to_list(5000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Booking ID", "Date/Time", "Listing", "Partner", "Child Name", 
        "Child Age", "Status", "Payment INR", "Credits Used", "Refundable"
    ])
    
    for booking in bookings:
        listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
        listing_title = listing["title"] if listing else "Unknown"
        
        partner_name = "Unknown"
        if listing:
            partner = await db.partners.find_one({"id": listing["partner_id"]}, {"_id": 0})
            partner_name = partner["brand_name"] if partner else "Unknown"
        
        writer.writerow([
            booking["id"],
            booking["booked_at"].isoformat(),
            listing_title,
            partner_name,
            booking.get("child_profile_name", ""),
            booking.get("child_profile_age", ""),
            booking["booking_status"],
            booking.get("total_inr", 0),
            booking.get("credits_used", 0),
            "Yes" if booking["booking_status"] == "confirmed" else "No"
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bookings_export.csv"}
    )

# ============== PDF GENERATION ==============
@api_router.get("/admin/bookings/{booking_id}/receipt.pdf")
async def generate_booking_receipt_pdf(
    booking_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Generate PDF receipt for booking"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0})
    session = await db.sessions.find_one({"id": booking["session_id"]}, {"_id": 0})
    user = await db.users.find_one({"id": booking["user_id"]}, {"_id": 0})
    
    # Simple HTML receipt (would use reportlab or weasyprint for production)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>YUNO Receipt - {booking_id}</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }}
            .header {{ text-align: center; margin-bottom: 40px; }}
            .header h1 {{ color: #06b6d4; margin: 0; }}
            .details {{ margin: 20px 0; }}
            .details table {{ width: 100%; border-collapse: collapse; }}
            .details td {{ padding: 10px; border-bottom: 1px solid #e2e8f0; }}
            .details td:first-child {{ font-weight: bold; width: 200px; }}
            .total {{ font-size: 24px; font-weight: bold; color: #06b6d4; text-align: right; margin-top: 20px; }}
            .footer {{ margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>YUNO</h1>
            <p>Booking Receipt</p>
        </div>
        
        <div class="details">
            <table>
                <tr><td>Booking ID</td><td>{booking["id"]}</td></tr>
                <tr><td>Date</td><td>{booking["booked_at"].strftime("%B %d, %Y %I:%M %p")}</td></tr>
                <tr><td>Customer</td><td>{user["name"] if user else "Unknown"}</td></tr>
                <tr><td>Email</td><td>{user["email"] if user else ""}</td></tr>
                <tr><td>Class</td><td>{listing["title"] if listing else "Unknown"}</td></tr>
                <tr><td>Child</td><td>{booking.get("child_profile_name", "")} (Age {booking.get("child_profile_age", "")})</td></tr>
                <tr><td>Session Date</td><td>{session["start_at"].strftime("%B %d, %Y %I:%M %p") if session else ""}</td></tr>
                <tr><td>Duration</td><td>{listing["duration_minutes"] if listing else ""} minutes</td></tr>
                <tr><td>Status</td><td>{booking["booking_status"].upper()}</td></tr>
                <tr><td>Payment Method</td><td>{"Credits" if booking.get("credits_used", 0) > 0 else "INR"}</td></tr>
            </table>
        </div>
        
        <div class="total">
            Total: {f"{booking['credits_used']} Credits" if booking.get("credits_used", 0) > 0 else f"₹{booking['total_inr']:.2f}"}
        </div>
        
        <div class="footer">
            <p>Thank you for choosing YUNO!</p>
            <p>For support, email: support@yuno.app</p>
        </div>
    </body>
    </html>
    """
    
    # For production, use weasyprint or reportlab to convert HTML to PDF
    # For now, return HTML that can be printed to PDF
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f"inline; filename=receipt_{booking_id}.html"}
    )

# ============== PARTNER MANAGEMENT ==============
class PartnerStatusRequest(BaseModel):
    status: str

@api_router.post("/admin/partners/{partner_id}/verify")
async def admin_verify_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Verify partner KYC"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "kyc_status": "verified",
                "verification_badges": ["verified", "background_checked"]
            }
        }
    )
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "actor_user_id": current_user["id"],
        "action": "partner.verify",
        "entity": "partner",
        "entity_id": partner_id,
        "before": {},
        "after": {"kyc_status": "verified"},
        "at": datetime.now(timezone.utc)
    })
    
    return {"message": "Partner verified"}

@api_router.post("/admin/partners/{partner_id}/status")
async def admin_update_partner_status(
    partner_id: str,
    request: PartnerStatusRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Update partner status"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": request.status}}
    )
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "actor_user_id": current_user["id"],
        "action": "partner.status_change",
        "entity": "partner",
        "entity_id": partner_id,
        "before": {},
        "after": {"status": request.status},
        "at": datetime.now(timezone.utc)
    })
    
    return {"message": f"Partner {request.status}"}

# ============== CONFIG MANAGEMENT ==============
class ConfigUpdateRequest(BaseModel):
    value: Any

@api_router.get("/admin/configs/{key}")
async def admin_get_config(
    key: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get config"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    config = await db.configs.find_one({"_id": key}, {"_id": 0})
    if not config:
        # Defaults
        if key == "cancellation_policy":
            return {"value": {
                "windows": [
                    {"min_hours": 6, "max_hours": 9999, "refund_pct": 100},
                    {"min_hours": 2, "max_hours": 6, "refund_pct": 50},
                    {"min_hours": 0, "max_hours": 2, "refund_pct": 0}
                ]
            }}
        elif key == "commission":
            return {"value": {"standard_pct": 15, "subscriber_pct": 10}}
        else:
            raise HTTPException(status_code=404, detail="Config not found")
    
    return config

@api_router.post("/admin/configs/{key}")
async def admin_update_config(
    key: str,
    request: ConfigUpdateRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Update config"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    before = await db.configs.find_one({"_id": key}, {"_id": 0})
    
    await db.configs.update_one(
        {"_id": key},
        {"$set": {"value": request.value, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    after = await db.configs.find_one({"_id": key}, {"_id": 0})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "actor_user_id": current_user["id"],
        "action": "config.update",
        "entity": "config",
        "entity_id": key,
        "before": before or {},
        "after": after,
        "at": datetime.now(timezone.utc)
    })
    
    return {"message": f"Config {key} updated"}

# ============== AUDIT LOGS ==============
@api_router.get("/admin/audit")
async def admin_get_audit_logs(
    action: Optional[str] = None,
    entity: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get audit logs"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if action:
        query["action"] = action
    if entity:
        query["entity"] = entity
    
    skip = (page - 1) * limit
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("at", -1).skip(skip).limit(limit).to_list(limit)
    
    for log in logs:
        actor = await db.users.find_one({"id": log["actor_user_id"]}, {"_id": 0})
        if actor:
            log["actor_name"] = actor["name"]
    
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }



# ============================================================================
# Additional Admin Panel Endpoints
# ============================================================================

@api_router.get("/admin/bookings")
async def admin_get_bookings(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: Dict = Depends(get_current_user)
):
    """Get all bookings with pagination for admin"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["booking_status"] = status
    
    skip = (page - 1) * limit
    total = await db.bookings.count_documents(query)
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("booked_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich bookings with user, listing, and session details
    for booking in bookings:
        # Get customer info
        if booking.get("customer_id") or booking.get("user_id"):
            user_id = booking.get("customer_id") or booking.get("user_id")
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
            if user:
                booking["customer_name"] = user.get("name", "Unknown")
                booking["customer_email"] = user.get("email", "")
        
        # Get listing info
        if booking.get("listing_id"):
            listing = await db.listings.find_one({"id": booking["listing_id"]}, {"_id": 0, "title": 1, "category": 1})
            if listing:
                booking["listing_title"] = listing.get("title", "Unknown")
                booking["listing_category"] = listing.get("category", "")
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }


@api_router.get("/admin/financials/summary")
async def admin_get_financial_summary(current_user: Dict = Depends(get_current_user)):
    """Get financial summary for admin dashboard"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Use aggregation for better performance - no need to fetch all records
    pending_result = await db.payout_requests.aggregate([
        {"$match": {"status": "pending"}},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]).to_list(1)
    
    processed_result = await db.payout_requests.aggregate([
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]).to_list(1)
    
    pending_amount = pending_result[0]["total_amount"] if pending_result else 0
    pending_count = pending_result[0]["count"] if pending_result else 0
    processed_amount = processed_result[0]["total_amount"] if processed_result else 0
    processed_count = processed_result[0]["count"] if processed_result else 0
    
    return {
        "pending_payouts": pending_amount,
        "processed_payouts": processed_amount,
        "total_payout_requests": pending_count + processed_count
    }


@api_router.get("/admin/payouts")
async def admin_get_payouts(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: Dict = Depends(get_current_user)
):
    """Get all payout requests for admin review"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    total = await db.payout_requests.count_documents(query)
    
    payouts = await db.payout_requests.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with partner details
    for payout in payouts:
        if payout.get("partner_id"):
            partner = await db.partners.find_one({"id": payout["partner_id"]}, {"_id": 0, "business_name": 1, "owner_user_id": 1})
            if partner:
                payout["partner_name"] = partner.get("business_name", "Unknown")
    
    return {
        "payouts": payouts,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@api_router.post("/admin/payouts/{payout_id}/approve")
async def admin_approve_payout(
    payout_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Approve a payout request"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    payout = await db.payout_requests.find_one({"id": payout_id})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    
    if payout.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending payouts can be approved")
    
    # Update payout status
    await db.payout_requests.update_one(
        {"id": payout_id},
        {
            "$set": {
                "status": "completed",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "processed_by": current_user["id"]
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "payout_approved",
        "entity": "payout_request",
        "entity_id": payout_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Payout approved successfully"}


@api_router.post("/admin/payouts/{payout_id}/reject")
async def admin_reject_payout(
    payout_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Reject a payout request"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    payout = await db.payout_requests.find_one({"id": payout_id})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout request not found")
    
    if payout.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending payouts can be rejected")
    
    # Update payout status
    await db.payout_requests.update_one(
        {"id": payout_id},
        {
            "$set": {
                "status": "rejected",
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "processed_by": current_user["id"]
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "payout_rejected",
        "entity": "payout_request",
        "entity_id": payout_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Payout rejected"}


@api_router.post("/admin/users/{user_id}/suspend")
async def admin_suspend_user(
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Suspend a user account"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "user_suspended",
        "entity": "user",
        "entity_id": user_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "User suspended successfully"}


@api_router.post("/admin/users/{user_id}/activate")
async def admin_activate_user(
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Activate a suspended user account"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": "active"}, "$unset": {"suspended_at": ""}}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "user_activated",
        "entity": "user",
        "entity_id": user_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "User activated successfully"}


@api_router.post("/admin/users/{user_id}/adjust-credits")
async def admin_adjust_user_credits(
    user_id: str,
    request: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Adjust user's credit balance"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    amount = request.get("amount", 0)
    if amount == 0:
        raise HTTPException(status_code=400, detail="Amount must be non-zero")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create wallet
    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "credits_balance": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet)
    
    # Update credits
    new_balance = wallet.get("credits_balance", 0) + amount
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {"credits_balance": new_balance}}
    )
    
    # Create ledger entry
    await db.credit_ledger.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": amount,
        "type": "admin_adjustment",
        "description": f"Admin credit adjustment by {current_user.get('name', 'Admin')}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "credits_adjusted",
        "entity": "user",
        "entity_id": user_id,
        "actor_user_id": current_user["id"],
        "metadata": {"amount": amount, "new_balance": new_balance},
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": f"Credits adjusted by {amount}",
        "new_balance": new_balance
    }


@api_router.post("/admin/partners/{partner_id}/approve-kyc")
async def admin_approve_partner_kyc(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Approve partner KYC documents"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "kyc_status": "approved",
                "kyc_approved_at": datetime.now(timezone.utc).isoformat(),
                "kyc_approved_by": current_user["id"]
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "kyc_approved",
        "entity": "partner",
        "entity_id": partner_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Partner KYC approved successfully"}


@api_router.post("/admin/partners/{partner_id}/reject-kyc")
async def admin_reject_partner_kyc(
    partner_id: str,
    request: Dict[str, Any],
    current_user: Dict = Depends(get_current_user)
):
    """Reject partner KYC documents"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    reason = request.get("reason", "Documents incomplete or invalid")
    
    await db.partners.update_one(
        {"id": partner_id},
        {
            "$set": {
                "kyc_status": "rejected",
                "kyc_rejection_reason": reason,
                "kyc_rejected_at": datetime.now(timezone.utc).isoformat(),
                "kyc_rejected_by": current_user["id"]
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "kyc_rejected",
        "entity": "partner",
        "entity_id": partner_id,
        "actor_user_id": current_user["id"],
        "metadata": {"reason": reason},
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Partner KYC rejected", "reason": reason}


@api_router.post("/admin/partners/{partner_id}/suspend")
async def admin_suspend_partner(
    partner_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Suspend a partner account"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    await db.partners.update_one(
        {"id": partner_id},
        {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "action": "partner_suspended",
        "entity": "partner",
        "entity_id": partner_id,
        "actor_user_id": current_user["id"],
        "at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Partner suspended successfully"}



# AI Advisor Service
# from ai_advisor_service import AIAdvisorService
# ai_advisor = AIAdvisorService(db)

# Admin Analytics APIs
from admin_analytics_apis import router as analytics_router, init_router as init_analytics
init_analytics(db, get_current_user)

# Review System APIs
from review_system_apis import router as review_router, init_router as init_reviews
init_reviews(db, get_current_user)

# Badge System APIs
from badge_system_apis import router as badge_router, init_router as init_badges
init_badges(db, get_current_user)

# Invoice System APIs
from invoice_system_apis import router as invoice_router, init_router as init_invoices
init_invoices(db)

# Production Database Seeding APIs
from seed_production import router as seed_router, init_router as init_seed
init_seed(db)

class AIAdvisorRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    location: Optional[Dict] = None

@api_router.post("/ai-advisor/chat")
async def ai_advisor_chat(
    request: AIAdvisorRequest,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """AI-powered class advisor chatbot"""
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get user location and ID if logged in
        user_location = None
        user_id = None
        if current_user:
            user_location = request.location
            user_id = current_user.get("id")
        
        # Get AI recommendations with user context
        result = await ai_advisor.get_recommendations(
            user_message=request.message,
            session_id=session_id,
            user_location=user_location,
            user_id=user_id
        )
        
        return result
        
    except Exception as e:
        logging.error(f"AI Advisor error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process request")


# Include routers
api_router.include_router(analytics_router)
api_router.include_router(review_router)
api_router.include_router(badge_router)
api_router.include_router(invoice_router)
api_router.include_router(seed_router)

# Import and include AI Advisor router
# from ai_advisor_apis import router as ai_advisor_router
# api_router.include_router(ai_advisor_router)

# ===== WISHLIST ENDPOINTS (MUST BE BEFORE app.include_router) =====
@api_router.get("/wishlist")
async def get_wishlist(current_user: Dict = Depends(get_current_user)):
    """Get user's wishlist (just listing IDs)"""
    user = current_user
    
    # Get wishlist from user document
    user_doc = await db.users.find_one({"id": user['id']}, {"_id": 0, "wishlist": 1})
    wishlist = user_doc.get('wishlist', []) if user_doc else []
    
    return wishlist

@api_router.get("/wishlist/listings")
async def get_wishlist_listings(current_user: Dict = Depends(get_current_user)):
    """Get user's wishlist with full listing details
    
    CRITICAL: Always returns array [...] even on error.
    """
    try:
        user = current_user
        
        # Get wishlist from user document
        user_doc = await db.users.find_one({"id": user['id']}, {"_id": 0, "wishlist": 1})
        wishlist_ids = user_doc.get('wishlist', []) if user_doc else []
        
        if not wishlist_ids:
            return []
        
        # Get full listing details
        listings = await db.listings.find(
            {"id": {"$in": wishlist_ids}},
            {"_id": 0}
        ).to_list(100)
        
        return listings
    except Exception as e:
        logging.error(f"Error in get_wishlist_listings: {e}")
        return []

@api_router.post("/wishlist/{listing_id}")
async def add_to_wishlist(listing_id: str, current_user: Dict = Depends(get_current_user)):
    """Add listing to user's wishlist"""
    user = current_user
    
    # Check if listing exists
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "id": 1})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Add to wishlist (using $addToSet to avoid duplicates)
    result = await db.users.update_one(
        {"id": user['id']},
        {"$addToSet": {"wishlist": listing_id}}
    )
    
    return {"status": "success", "message": "Added to wishlist"}

@api_router.delete("/wishlist/{listing_id}")
async def remove_from_wishlist(listing_id: str, current_user: Dict = Depends(get_current_user)):
    """Remove listing from user's wishlist"""
    user = current_user
    
    # Remove from wishlist
    result = await db.users.update_one(
        {"id": user['id']},
        {"$pull": {"wishlist": listing_id}}
    )
    
    return {"status": "success", "message": "Removed from wishlist"}
# ===== END WISHLIST ENDPOINTS =====

# Include API router first
app.include_router(api_router)

# Mount static files at /api/uploads AFTER router so it takes precedence
uploads_path = Path("/app/backend/uploads")
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Most permissive CORS setup for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/test-cors")
async def test_cors():
    return {"message": "CORS is working"}

@app.options("/api/test-cors")
async def test_cors_options():
    return {"message": "OK"}

    

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}
# ============ PUSH NOTIFICATIONS ============
from push_notification_service import (
    send_push_notification,
    send_push_to_multiple,
    send_push_to_topic,
    subscribe_to_topic,
    unsubscribe_from_topic
)

class PushTokenCreate(BaseModel):
    """Model for storing FCM push token"""
    token: str
    platform: str  # 'ios' or 'android'
    device_info: Optional[Dict] = None

class PushNotificationRequest(BaseModel):
    """Model for sending push notification"""
    title: str
    body: str
    data: Optional[Dict] = None
    image_url: Optional[str] = None

@app.post("/users/push-token")
async def save_push_token(
    token_data: PushTokenCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Save FCM push token for user"""
    try:
        user_id = current_user["id"]
        # Update user with push token
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "fcm_token": token_data.token,
                    "platform": token_data.platform,
                    "device_info": token_data.device_info,
                    "token_updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Subscribe to general topic
        await subscribe_to_topic([token_data.token], "all_users")
        
        return {"success": True, "message": "Push token saved"}
    except Exception as e:
        logger.error(f"Error saving push token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/partners/push-token")
async def save_partner_push_token(
    token_data: PushTokenCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Save FCM push token for partner"""
    try:
        partner_id = current_user["id"]
        await db.partners.update_one(
            {"id": partner_id},
            {
                "$set": {
                    "fcm_token": token_data.token,
                    "platform": token_data.platform,
                    "device_info": token_data.device_info,
                    "token_updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Subscribe to partner topics
        await subscribe_to_topic([token_data.token], "all_partners")
        await subscribe_to_topic([token_data.token], "partner_notifications")
        
        return {"success": True, "message": "Push token saved"}
    except Exception as e:
        logger.error(f"Error saving partner push token: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/send-push")
async def send_push_admin(
    notification: PushNotificationRequest,
    user_id: Optional[str] = None,
    partner_id: Optional[str] = None,
    topic: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Send push notification (Admin only)"""
    role = current_user.get("role")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Send to specific user
        if user_id:
            user = await db.users.find_one({"id": user_id})
            if not user or not user.get("fcm_token"):
                raise HTTPException(status_code=404, detail="User or FCM token not found")
            
            result = await send_push_notification(
                token=user["fcm_token"],
                title=notification.title,
                body=notification.body,
                data=notification.data,
                image_url=notification.image_url
            )
            return result
        
        # Send to specific partner
        elif partner_id:
            partner = await db.partners.find_one({"id": partner_id})
            if not partner or not partner.get("fcm_token"):
                raise HTTPException(status_code=404, detail="Partner or FCM token not found")
            
            result = await send_push_notification(
                token=partner["fcm_token"],
                title=notification.title,
                body=notification.body,
                data=notification.data,
                image_url=notification.image_url
            )
            return result
        
        # Send to topic
        elif topic:
            result = await send_push_to_topic(
                topic=topic,
                title=notification.title,
                body=notification.body,
                data=notification.data,
                image_url=notification.image_url
            )
            return result
        
        else:
            raise HTTPException(status_code=400, detail="Specify user_id, partner_id, or topic")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to send booking reminder
async def send_booking_reminder(booking_id: str):
    """Send booking reminder push notification"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            return
        
        user = await db.users.find_one({"id": booking["user_id"]})
        if not user or not user.get("fcm_token"):
            return
        
        session = await db.sessions.find_one({"id": booking["session_id"]})
        if not session:
            return
        
        listing = await db.listings.find_one({"id": session["listing_id"]})
        if not listing:
            return
        
        # Send notification
        await send_push_notification(
            token=user["fcm_token"],
            title="Class Reminder",
            body=f"Your {listing['title']} class is tomorrow at {session['time']}",
            data={
                "type": "booking_reminder",
                "booking_id": booking_id,
                "session_id": session["id"]
            }
        )
    except Exception as e:
        logger.error(f"Error sending booking reminder: {e}")

# Helper function to send new booking notification to partner
async def send_partner_booking_notification(booking_id: str):
    """Send new booking notification to partner"""
    try:
        booking = await db.bookings.find_one({"id": booking_id})
        if not booking:
            return
        
        session = await db.sessions.find_one({"id": booking["session_id"]})
        if not session:
            return
        
        listing = await db.listings.find_one({"id": session["listing_id"]})
        if not listing:
            return
        
        partner = await db.partners.find_one({"id": listing["partner_id"]})
        if not partner or not partner.get("fcm_token"):
            return
        
        # Send notification
        await send_push_notification(
            token=partner["fcm_token"],
            title="New Booking!",
            body=f"You have a new booking for {listing['title']}",
            data={
                "type": "new_booking",
                "booking_id": booking_id,
                "session_id": session["id"],
                "listing_id": listing["id"]
            }
        )
    except Exception as e:
        logger.error(f"Error sending partner booking notification: {e}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def startup_auto_seed():
    """Automatically seed database if empty on startup"""
    try:
        logger.info("🔍 Checking if database needs seeding...")
        
        # Check if database is empty or incomplete
        categories_count = await db.categories.count_documents({})
        workshops_count = await db.listings.count_documents({'listing_type': 'workshop'})
        camps_count = await db.listings.count_documents({'listing_type': 'camp'})
        trial_listings_count = await db.listings.count_documents({'trial_available': True})
        sessions_count = await db.sessions.count_documents({})
        
        needs_seeding = categories_count < 12 or workshops_count < 10 or camps_count < 10 or trial_listings_count < 20 or sessions_count < 500
        
        if needs_seeding:
            logger.info("🌱 Database needs seeding. Running in background...")
            # Run seeding in background thread to not block startup
            asyncio.create_task(run_seeding_background())
        else:
            logger.info("✅ Database already seeded. Skipping auto-seed.")
        
        # Create indexes (these are quick)
        await create_indexes()
            
    except Exception as e:
        logger.error(f"❌ Auto-seed check failed: {str(e)}")

async def run_seeding_background():
    """Run seeding scripts in background"""
    try:
        import subprocess
        
        logger.info("Starting background seeding...")
        
        # Run with timeout to prevent hanging
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            # Run seeding with 5 minute timeout
            await asyncio.wait_for(
                loop.run_in_executor(
                    executor,
                    run_seeding_scripts
                ),
                timeout=300
            )
        
        logger.info("🎉 Background seeding complete!")
        
    except asyncio.TimeoutError:
        logger.error("❌ Seeding timed out after 5 minutes")
    except Exception as e:
        logger.error(f"❌ Background seeding failed: {str(e)}")

def run_seeding_scripts():
    """Run the actual seeding scripts (blocking function)"""
    import subprocess
    import sys
    
    try:
        # Add categories
        subprocess.run(['python', '/app/backend/add_categories.py'], 
                      check=True, timeout=30)
        
        # Add workshops and camps
        subprocess.run(['python', '/app/backend/setup_workshops_camps.py'], 
                      check=True, timeout=60)
        
        # Add trial listings
        subprocess.run(['python3', '/app/backend/seed_production_direct.py'], 
                      check=True, timeout=120)
        
        # Update pricing
        subprocess.run(['python', '/app/backend/update_prices.py'], 
                      check=True, timeout=30)
        
        # Assign images
        subprocess.run(['python', '/app/backend/assign_unique_images.py'], 
                      check=True, timeout=30)
        
    except subprocess.TimeoutExpired as e:
        logger.error(f"Seeding script timed out: {e}")
        raise
    except subprocess.CalledProcessError as e:
        logger.error(f"Seeding script failed: {e}")
        raise

async def create_indexes():
    """Create database indexes quickly"""
    logger.info("📊 Creating database indexes...")
    try:
        # Your existing index creation code here
        await db.listings.create_index([("is_live", 1)])
        # ... rest of indexes
        logger.info("✅ Database indexes created")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {str(e)}")


@app.post("/api/admin/seed-production-database")
async def seed_production_database(
    secret_key: str = Header(..., alias="X-Seed-Secret")
):
    """
    Emergency endpoint to seed production database with all trial listings and sessions.
    Requires secret key for security.
    """
    # Security check - use a simple key (you can enhance this)
    expected_secret = os.environ.get("SEED_SECRET_KEY", "rrray-seed-2025")
    if secret_key != expected_secret:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    try:
        logger.info("🌱 PRODUCTION SEEDING INITIATED")
        
        # Import the seeding logic
        import subprocess
        import sys
        
        # Run the comprehensive trial listings seeding script
        logger.info("   Running trial listings seeding script...")
        result = subprocess.run(
            [sys.executable, '/app/backend/add_trial_listings_with_sessions.py'],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            logger.error(f"   Seeding script failed: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Seeding script failed: {result.stderr}"
            )
        
        logger.info(f"   Script output: {result.stdout}")
        
        # Verify the seeding
        listings_count = await db.listings.count_documents({})
        trial_listings = await db.listings.count_documents({'trial_available': True})
        sessions_count = await db.sessions.count_documents({})
        users_count = await db.users.count_documents({})
        
        logger.info(f"✅ PRODUCTION SEEDING COMPLETE!")
        logger.info(f"   Listings: {listings_count} (Trials: {trial_listings})")
        logger.info(f"   Sessions: {sessions_count}")
        logger.info(f"   Users: {users_count}")
        
        return {
            "status": "success",
            "message": "Production database seeded successfully",
            "data": {
                "total_listings": listings_count,
                "trial_listings": trial_listings,
                "total_sessions": sessions_count,
                "total_users": users_count
            },
            "script_output": result.stdout
        }
        
    except subprocess.TimeoutExpired:
        logger.error("   Seeding script timed out")
        raise HTTPException(status_code=500, detail="Seeding script timed out after 120s")
    except Exception as e:
        logger.error(f"   Seeding failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")

# ============== WISHLIST ENDPOINTS ==============


async def shutdown_db_client():
    client.close()
