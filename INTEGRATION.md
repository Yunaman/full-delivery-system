# Delivery Platform - Django Backend Integration Guide

## 🎯 Overview

The Django backend has been integrated with all three Next.js frontend applications:
- **Delivery App** - Driver mobile app
- **Vendor App** - Vendor management panel
- **Customer App** - Customer ordering interface

## 📁 Backend Structure

```
backend/
├── accounts/        # JWT auth, User model
├── vendors/         # Vendor management
├── products/        # Product catalog
├── orders/          # Order workflow + WebSockets
├── drivers/         # Driver profiles, tracking
├── payments/        # Payments, wallet
├── notifications/   # Push notifications
└── analytics/       # Dashboard analytics
```

## 🔌 API Integration

### Base URLs
```
Development:  http://localhost:8000/api
WebSocket:    ws://localhost:8000/ws
Production:   https://api.deliveryplatform.com/api
WebSocket:    wss://api.deliveryplatform.com/ws
```

### Authentication Flow

1. **Login** - `POST /api/auth/login/`
   ```json
   { "email": "user@example.com", "password": "password" }
   ```

2. **Response** - JWT tokens + user data
   ```json
   {
     "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "user": { "id": "...", "name": "...", "role": "driver" }
   }
   ```

3. **Use Access Token** - Include in headers:
   ```
   Authorization: Bearer {access_token}
   ```

4. **Refresh Token** - `POST /api/auth/refresh/`
   ```json
   { "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." }
   ```

## 🚚 Delivery App Integration

### Updated Services

| Service | Endpoints | Status |
|---------|-----------|--------|
| `auth.ts` | Login, Register, Profile, Logout | ✅ |
| `orders.ts` | Active orders, Available orders, Accept, Status updates | ✅ |
| `driver.ts` | Profile, Status, Location tracking | ✅ |
| `earnings.ts` | Earnings, Payouts | ✅ |
| `http.ts` | Base URL, Error handling | ✅ |

### WebSocket Integration

```typescript
import { useOrderTracking, useDriverLocation } from "@/hooks/useWebSocket";

// Track order updates
const { status, lastMessage } = useOrderTracking(orderId, (status, data) => {
  console.log("Order status:", status);
});

// Track driver location
const { sendMessage } = useDriverLocation(orderId, (lat, lng) => {
  // Update map marker
});
```

## 🏪 Vendor App Integration ✅

### Created Files
- `lib/django-api.ts` - Full Django API client
- `lib/websocket.ts` - Real-time notifications and order tracking

### Services
| Service | Endpoints | Status |
|---------|-----------|--------|
| `django-api.ts` | Auth, Vendor Profile, Products, Orders, Analytics | ✅ |
| `websocket.ts` | Notifications, Order tracking | ✅ |

### Key Features
- **Authentication**: JWT login, token refresh, auto-retry
- **Vendor Profile**: Get/update vendor, toggle open/closed status
- **Products**: CRUD, inventory, variants, categories
- **Orders**: List, status updates, assign drivers
- **Analytics**: Dashboard stats, revenue reports
- **Reviews**: View and reply to reviews
- **WebSocket**: Real-time order notifications

## 🛒 Customer App Integration ✅

### Created Files
- `lib/api.ts` - Full API client for customers
- `hooks/useWebSocket.ts` - Order tracking and notifications
- `.env.example` - Environment configuration

### API Client Features

| Feature | Methods | Status |
|---------|---------|--------|
| **Authentication** | `login()`, `register()`, `logout()`, `getProfile()` | ✅ |
| **Vendors** | `getVendors()`, `getVendor()`, `getVendorReviews()` | ✅ |
| **Products** | `getProducts()`, `searchProducts()`, `getFeaturedProducts()`, `getCategories()` | ✅ |
| **Orders** | `createOrder()`, `getOrders()`, `getActiveOrders()`, `cancelOrder()`, `addOrderReview()` | ✅ |
| **Addresses** | `getAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()` | ✅ |
| **Payments** | `createPayment()`, `getPaymentByOrder()` | ✅ |
| **Analytics** | `getDashboardStats()` | ✅ |
| **Notifications** | `getNotifications()`, `markNotificationRead()` | ✅ |

### WebSocket Hooks

```typescript
// Track order in real-time
const { status, lastUpdate } = useOrderTracking(orderId, {
  onOrderUpdate: (orderId, data) => {
    console.log("Status:", data.status_display);
  },
  onDriverLocation: (orderId, lat, lng) => {
    // Update map with driver position
  }
});

// Receive notifications
const { lastNotification } = useCustomerNotifications({
  onNotification: (notification) => {
    toast.info(notification.title, { 
      description: notification.message 
    });
  }
});
```

## 🔧 Environment Configuration

### Delivery App (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Vendor App (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Customer App (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 🐳 Docker Deployment

### Start All Services
```bash
cd full-delivery-system

# Copy environment
cp .env .env.local
# Edit .env.local with your settings

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

### Services
- **nginx** - Reverse proxy (port 80)
- **backend** - Django API (port 8000)
- **db** - PostgreSQL (port 5432)
- **redis** - Cache & message broker (port 6379)
- **celery_worker** - Background tasks
- **celery_beat** - Scheduled tasks

## 🔑 Key API Endpoints

### Authentication
```
POST   /api/auth/register/          # Register user
POST   /api/auth/login/             # Login (get JWT)
POST   /api/auth/refresh/           # Refresh token
GET    /api/auth/users/me/          # Current user profile
```

### Orders (Drivers)
```
GET    /api/orders/active/          # Driver's active orders
GET    /api/orders/?status=ready    # Available orders to accept
POST   /api/orders/{id}/assign_driver/  # Accept order
POST   /api/orders/{id}/update_status/  # Update status
POST   /api/orders/{id}/update_location/ # Update location
```

### Drivers
```
GET    /api/drivers/me/             # Driver profile
PATCH  /api/drivers/me/             # Update profile
PATCH  /api/drivers/update_status/  # Set availability
POST   /api/drivers/update_location/ # Update GPS location
GET    /api/drivers/earnings/       # Earnings summary
POST   /api/drivers/request_payout/  # Request payout
```

### WebSockets
```
ws://localhost:8000/ws/orders/           # General order updates
ws://localhost:8000/ws/orders/{id}/     # Specific order updates
ws://localhost:8000/ws/notifications/   # User notifications
```

## 📱 Testing Integration

### 1. Start Backend
```bash
cd backend
python manage.py runserver
```

### 2. Test API
```bash
# Register a driver
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Driver One","email":"driver@example.com","phone":"+1234567890","password":"password123","password_confirm":"password123","role":"driver"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@example.com","password":"password123"}'
```

### 3. Test WebSocket
Open browser console on a page using WebSocket hooks.

## 🔒 Security Checklist

- [ ] Change default `SECRET_KEY` in production
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up proper database credentials
- [ ] Configure Redis authentication
- [ ] Use environment variables for sensitive data

## 🚀 Production Deployment

1. **Setup SSL certificates** in `nginx/ssl/`
2. **Update `.env`** with production values
3. **Build and deploy**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```
4. **Monitor logs**:
   ```bash
   docker-compose logs -f backend
   ```

## 📞 Support

For issues with the integration:
1. Check browser console for API errors
2. Verify backend is running: `curl http://localhost:8000/api/auth/login/`
3. Check WebSocket connection in Network tab
4. Review Django logs: `docker-compose logs backend`

---

**Integration Status**: Delivery App ✅ | Vendor App ✅ | Customer App ✅

## 🎉 Integration Complete!

All three frontend applications are now fully integrated with the Django backend:

| Component | Files Created | Status |
|-----------|---------------|--------|
| **Django Backend** | 8 apps, 50+ files | ✅ Production Ready |
| **Docker Setup** | `docker-compose.yml`, `Dockerfile`, `nginx.conf` | ✅ Ready |
| **Delivery App** | `services/auth.ts`, `orders.ts`, `driver.ts`, `earnings.ts`, `http.ts`, `hooks/useWebSocket.ts` | ✅ Complete |
| **Vendor App** | `lib/django-api.ts`, `lib/websocket.ts` | ✅ Complete |
| **Customer App** | `lib/api.ts`, `hooks/useWebSocket.ts`, `.env.example` | ✅ Complete |

### Quick Start

```bash
# 1. Start all services
docker-compose up -d

# 2. Run migrations
docker-compose exec backend python manage.py migrate

# 3. Create superuser
docker-compose exec backend python manage.py createsuperuser

# 4. Access API docs at http://localhost:8000/swagger/
```

### API Documentation
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`

---

**Built with ❤️ using Django + Django REST Framework + Next.js**
