# Vendor Delivery Management Platform - Django Backend

A production-ready REST API backend for a multi-vendor delivery management system. Built with Django and Django REST Framework, designed to support web-first (Next.js) and mobile (Capacitor/React Native) frontends.

## 🚀 Features

### Core Features
- **Multi-role Authentication**: Customer, Vendor, Staff, Driver, Admin
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Real-time Updates**: WebSockets for live order tracking
- **Vendor Management**: Store profiles, working hours, delivery radius
- **Product Catalog**: Categories, variants, stock management
- **Order System**: Complete order workflow from pending to delivery
- **Driver Tracking**: Location tracking and delivery assignment
- **Payment Processing**: Cash, card, wallet, online payments
- **Push Notifications**: Real-time alerts via WebSockets
- **Analytics Dashboard**: Role-based insights and reporting

### Security & Scalability
- Role-based access control (RBAC)
- Rate limiting
- CORS configuration
- Secure password hashing
- Input validation and sanitization
- Comprehensive logging

## 📁 Project Structure

```
backend/
├── delivery_platform/          # Main Django project
│   ├── settings.py            # Django settings
│   ├── urls.py                # URL routing
│   ├── wsgi.py                # WSGI config
│   └── asgi.py                # ASGI config (WebSockets)
├── accounts/                   # User authentication
│   ├── models.py              # User, Address, Device models
│   ├── views.py               # Auth views
│   ├── serializers.py           # API serializers
│   ├── permissions.py         # Custom permissions
│   └── urls.py                # Auth endpoints
├── vendors/                    # Vendor management
├── products/                   # Product catalog
├── orders/                     # Order system
│   ├── consumers.py           # WebSocket consumers
│   └── routing.py             # WebSocket routing
├── drivers/                    # Driver management
├── payments/                   # Payment processing
├── notifications/              # Push notifications
├── analytics/                  # Reporting & insights
└── requirements.txt           # Python dependencies
```

## 🛠️ Tech Stack

- **Python 3.10+**
- **Django 4.2+**
- **Django REST Framework**
- **PostgreSQL** (Database)
- **Redis** (Caching & Celery broker)
- **Celery** (Async tasks)
- **Django Channels** (WebSockets)
- **SimpleJWT** (JWT Authentication)
- **drf-yasg** (API documentation)

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- Redis 6+
- Node.js (for optional frontend)

### Installation

1. **Clone and navigate to the backend directory**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Create `.env` file**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Set up database**:
```bash
# Create PostgreSQL database
createdb delivery_db

# Run migrations
python manage.py migrate
```

6. **Create superuser**:
```bash
python manage.py createsuperuser
```

7. **Run development server**:
```bash
# Django server
python manage.py runserver

# For WebSocket support (Daphne)
daphne -p 8000 delivery_platform.asgi:application
```

### Environment Variables

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=delivery_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/users/me/` - Get current user profile

### Vendors
- `GET /api/vendors/` - List vendors
- `POST /api/vendors/` - Create vendor (vendor role)
- `GET /api/vendors/{id}/` - Get vendor details
- `PATCH /api/vendors/{id}/` - Update vendor
- `POST /api/vendors/{id}/add_review/` - Add review

### Products
- `GET /api/products/` - List products
- `POST /api/products/` - Create product (vendor)
- `GET /api/products/{id}/` - Get product details
- `PATCH /api/products/{id}/` - Update product
- `GET /api/products/featured/` - Featured products
- `GET /api/products/search/` - Search products

### Orders
- `GET /api/orders/` - List orders
- `POST /api/orders/` - Create order (customer)
- `GET /api/orders/{id}/` - Get order details
- `POST /api/orders/{id}/update_status/` - Update status
- `POST /api/orders/{id}/assign_driver/` - Assign driver
- `POST /api/orders/{id}/cancel/` - Cancel order
- `GET /api/orders/{id}/tracking/` - Get tracking info

### Drivers
- `GET /api/drivers/` - List drivers
- `POST /api/drivers/` - Register as driver
- `GET /api/drivers/me/` - Get driver profile
- `POST /api/drivers/update_status/` - Update availability
- `POST /api/drivers/update_location/` - Update location

### Payments
- `GET /api/payments/` - List payments
- `POST /api/payments/` - Create payment
- `GET /api/payments/by_order/?order_id={id}` - Get payment by order

### Notifications
- `GET /api/notifications/` - List notifications
- `GET /api/notifications/unread/` - Get unread notifications
- `POST /api/notifications/mark_all_read/` - Mark all as read

### Analytics
- `GET /api/analytics/dashboard/` - Dashboard data
- `GET /api/analytics/revenue/` - Revenue analytics
- `GET /api/analytics/users/` - User analytics (admin)

## 📊 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/swagger/`
- **ReDoc**: `http://localhost:8000/redoc/`

## 🔌 WebSocket Connections

### Order Updates
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/orders/{order_id}/');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Order update:', data);
};
```

### Notifications
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/notifications/');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Notification:', data);
};
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific app tests
pytest accounts/tests.py
pytest vendors/tests.py
pytest orders/tests.py
```

## 🚢 Deployment

### Production Checklist

1. **Environment**:
   - Set `DEBUG=False`
   - Generate new `SECRET_KEY`
   - Configure production database
   - Set up Redis for caching

2. **Static & Media Files**:
   - Configure `STATIC_ROOT` and `MEDIA_ROOT`
   - Run `python manage.py collectstatic`
   - Set up CDN or S3 for media files

3. **Security**:
   - Enable HTTPS
   - Configure `ALLOWED_HOSTS`
   - Set up rate limiting
   - Enable security headers

4. **Celery**:
   ```bash
   # Start Celery worker
   celery -A delivery_platform worker -l info
   
   # Start Celery beat (for scheduled tasks)
   celery -A delivery_platform beat -l info
   ```

5. **WebSocket Server**:
   - Use Daphne or Uvicorn with Redis channel layer
   - Configure load balancer for WebSocket support

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "delivery_platform.asgi:application"]
```

## 📱 Frontend Integration

### Next.js (Web)
```typescript
// API client setup
const API_BASE_URL = 'http://localhost:8000/api';

async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
}
```

### Mobile (Capacitor/React Native)
```typescript
// WebSocket for real-time updates
const ws = new WebSocket(`ws://your-api-domain/ws/orders/${orderId}/`);

ws.onopen = () => {
    console.log('Connected to order updates');
};
```

## 🔐 Authentication Flow

1. **Register** → `POST /api/auth/register/`
2. **Login** → `POST /api/auth/login/` (returns access & refresh tokens)
3. **Use Access Token** → Include in `Authorization: Bearer {token}` header
4. **Refresh Token** → `POST /api/auth/refresh/` when access token expires
5. **Logout** → `POST /api/auth/users/me/logout/` (blacklists refresh token)

## 📋 Database Schema Overview

```
users (accounts.User)
├── vendors (vendors.Vendor)
│   ├── products (products.Product)
│   │   ├── variants (products.ProductVariant)
│   │   └── reviews (products.ProductReview)
│   ├── staff (vendors.VendorStaff)
│   └── reviews (vendors.VendorReview)
├── driver_profiles (drivers.Driver)
│   ├── documents (drivers.DriverDocument)
│   ├── reviews (drivers.DriverReview)
│   └── payouts (drivers.DriverPayout)
├── orders (orders.Order)
│   ├── items (orders.OrderItem)
│   ├── status_history (orders.OrderStatusHistory)
│   ├── tracking (orders.OrderTracking)
│   └── payments (payments.Payment)
├── addresses (accounts.UserAddress)
├── devices (accounts.UserDevice)
├── wallets (payments.Wallet)
└── notifications (notifications.Notification)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email support@deliveryplatform.com or create an issue in the repository.

---

**Built with ❤️ using Django & Django REST Framework**
