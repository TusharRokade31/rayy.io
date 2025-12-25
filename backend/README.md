# RRRAY Backend API

A FastAPI-based backend service for the RRRAY platform - a marketplace for kids' activities, classes, and experiences.

## Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (via Motor async driver)
- **Authentication**: JWT (PyJWT)
- **Payments**: Razorpay
- **Email**: SendGrid
- **Storage**: Cloudinary (for media uploads)
- **Maps**: Google Maps API

---

## Project Structure

```
backend/
├── server.py                    # Main FastAPI application (all routes ~8600 lines)
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── uploads/                     # Local file uploads
│   └── listings/               
│
├── # Supporting API Modules
├── admin_apis.py               # Admin management endpoints
├── admin_apis_part2.py         # Additional admin endpoints  
├── admin_analytics_apis.py     # Analytics & dashboard
├── ai_advisor_apis.py          # AI-powered recommendations
├── ai_advisor_service.py       # AI advisor business logic
├── badge_system_apis.py        # User badges & achievements
├── credit_wallet_apis.py       # Credits & wallet
├── invoice_system_apis.py      # Invoice generation
├── review_system_apis.py       # Ratings & reviews
├── razorpay_service.py         # Payment processing
├── email_service.py            # Email notifications
├── push_notification_service.py # Push notifications
│
├── # Seed & Migration Scripts
├── seed_data.py                # Initial data seeding
├── seed_production.py          # Production data seeding
└── ... (other utility scripts)
```

---

## server.py Code Structure (~8600 lines)

The main `server.py` file is organized into sections:

| Line Range | Section | Description |
|------------|---------|-------------|
| 1-65 | **Imports & Config** | Dependencies, env vars, DB connection |
| 67-126 | **Utility Functions** | Distance calc, validators (PAN, GST, etc.) |
| 127-175 | **Enums** | UserRole, BookingStatus, PaymentMethod, etc. |
| 175-627 | **Pydantic Models** | All data models |
| 628-726 | **Auth Utilities** | Password hashing, JWT, get_current_user |
| 728-1386 | **Auth Routes** | `/auth/*` - Login, Register, OTP, Profile |
| 1388-1820 | **Listings Routes** | `/listings/*` - Search, Categories, Sessions |
| 1820-2360 | **Flexible Booking V2** | Plan options, batches, sessions |
| 2364-3410 | **Booking Routes** | `/bookings/*` - Create, Cancel, Reschedule |
| 3411-3515 | **Credit & Wallet** | `/wallet/*` - Credits, Plans |
| 3515-4860 | **Partner Routes** | `/partners/*` - Profile, Venues, Listings |
| 4864-5090 | **Venue Management** | Partner venue CRUD |
| 5089-5330 | **Listings CRUD** | Create/Update listings, sessions |
| 5332-5560 | **Ratings** | Reviews and ratings |
| 5384-6070 | **Admin Basic** | Dashboard, Users, Partners |
| 6071-6280 | **Credit Wallet** | Customer wallet endpoints |
| 6279-6535 | **Home APIs** | Trending, Trials, Starting Soon |
| 6534-7280 | **Admin Extended** | Partner management, Payouts |
| 7277-7880 | **Admin Bookings** | Booking management, CSV export |
| 7877-8145 | **Admin Actions** | Suspend, Adjust credits, KYC |
| 8145-8190 | **AI Advisor** | Chat endpoint |
| 8187-8270 | **Wishlist** | Add/Remove from wishlist |
| 8274-8495 | **Push Notifications** | Token storage, Send push |
| 8493-8672 | **Startup & Seeding** | Auto-seed, shutdown |

---

## Quick Start

### 1. Prerequisites

- Python 3.10+
- MongoDB 4.4+ (running locally or remote)
- pip (Python package manager)

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# For emergent integrations
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### 3. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run the Server

```bash
# Development mode with hot reload
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Production mode
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

**API available at:** `http://localhost:8001`  
**Swagger Docs:** `http://localhost:8001/docs`

---

## Environment Variables

### Required

```env
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="rrray_db"

# JWT Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_ALGORITHM="HS256"
JWT_EXPIRY_HOURS=720

# CORS
CORS_ORIGINS="*"
```

### Optional (for full functionality)

```env
# App Configuration
APP_ENV="dev"                    # dev, staging, production
BASE_URL="http://localhost:3000" # Frontend URL

# Payments - Razorpay
PAYMENTS_MODE="mock"             # mock, test, live
RAZORPAY_KEY_ID=""              
RAZORPAY_KEY_SECRET=""          
RAZORPAY_WEBHOOK_SECRET=""      

# Email - SendGrid
NOTIFY_PROVIDER="email"          
SENDGRID_API_KEY=""             
FROM_EMAIL="RRRAY <no-reply@rrray.com>"

# Google OAuth
GOOGLE_CLIENT_ID=""             
GOOGLE_CLIENT_SECRET=""

# Google Maps
GOOGLE_MAPS_API_KEY=""          

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=""        
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# AI Features
EMERGENT_LLM_KEY=""             
```

---

## API Endpoints Overview

### Authentication (`/api/auth/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone/email |
| POST | `/auth/verify-otp` | Verify OTP and get token |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/add-child` | Add child profile |
| PUT | `/auth/edit-child/{index}` | Edit child profile |
| DELETE | `/auth/delete-child/{index}` | Delete child profile |

### Listings & Search (`/api/listings/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/listings` | Get all listings |
| GET | `/listings/{id}` | Get listing details |
| GET | `/listings/{id}/sessions` | Get listing sessions |
| GET | `/search` | Search listings |
| GET | `/categories` | Get all categories |

### Home Page (`/api/home/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home/trending` | Trending listings |
| GET | `/home/trials` | Trial classes |
| GET | `/home/for-age/{age}` | Age-appropriate listings |
| GET | `/home/starting-soon` | Sessions starting soon |
| GET | `/home/weekend-camps` | Weekend camps |

### Bookings (`/api/bookings/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create a booking |
| GET | `/bookings/my` | Get user's bookings |
| POST | `/bookings/{id}/cancel` | Cancel booking |
| POST | `/bookings/{id}/reschedule` | Reschedule booking |
| GET | `/bookings/{id}/available-sessions` | Get reschedule options |

### Wallet & Credits (`/api/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get wallet balance |
| GET | `/credit-plans` | Get available plans |
| POST | `/subscribe-plan` | Subscribe to plan |
| GET | `/credit-ledger` | Get transaction history |

### Partner APIs (`/api/partners/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/partners/my` | Get partner profile |
| POST | `/partners` | Create partner profile |
| POST | `/partners/listings` | Create listing |
| GET | `/partners/my/listings` | Get partner's listings |
| GET | `/partner/bookings` | Get partner's bookings |
| PUT | `/partner/bookings/{id}/attendance` | Mark attendance |
| GET | `/partner/financials/summary` | Financial summary |

### Admin APIs (`/api/admin/*`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Dashboard KPIs |
| GET | `/admin/users` | Manage users |
| GET | `/admin/partners` | Manage partners |
| GET | `/admin/listings` | Manage listings |
| POST | `/admin/listings/{id}/approve` | Approve listing |
| GET | `/admin/payout-requests` | View payout requests |

---

## Database Collections

| Collection | Description |
|------------|-------------|
| `users` | Customer & partner user accounts |
| `partners` | Partner/vendor business profiles |
| `venues` | Partner venues |
| `listings` | Activity listings |
| `sessions` | Session schedules |
| `bookings` | Booking records |
| `wallets` | User credit wallets |
| `credit_ledger` | Credit transactions |
| `credit_transactions` | Detailed transaction logs |
| `invoices` | Invoice records |
| `reviews` | User reviews/ratings |
| `categories` | Activity categories |
| `config` | System configuration |
| `audit_logs` | Admin action logs |
| `otps` | OTP verification records |
| `oauth_sessions` | OAuth session tokens |
| `payout_requests` | Partner payout requests |
| `unable_to_attend` | Unable to attend records |

---

## Payment Modes

| Mode | Description |
|------|-------------|
| `mock` | No real payments, instant success (development) |
| `test` | Razorpay test mode with test credentials |
| `live` | Production payments with real credentials |

**Note:** Always use `mock` mode for local development.

---

## Testing

```bash
# Health check
curl http://localhost:8001/api/health

# Send OTP (phone)
curl -X POST http://localhost:8001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier": "9876543210"}'

# Verify OTP (use 1234 in development)
curl -X POST http://localhost:8001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier": "9876543210", "otp": "1234", "name": "Test User", "role": "customer"}'

# Get categories
curl http://localhost:8001/api/categories

# Search listings
curl "http://localhost:8001/api/search?city=Gurgaon&age=8"
```

---

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB (macOS)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod
```

### Port Already in Use
```bash
lsof -i :8001
kill -9 <PID>
```

### Check Logs
```bash
tail -f /var/log/supervisor/backend.err.log
```

---

## Version

**Current Version:** 2.2.1

---

## Support

For issues or questions, contact the development team.
