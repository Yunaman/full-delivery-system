"""delivery_platform URL Configuration"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Vendor Delivery Management API",
        default_version='v1',
        description="""
        A comprehensive REST API for a Vendor Delivery Management Platform.
        
        ## Features
        - Multi-role authentication (Customer, Vendor, Staff, Driver, Admin)
        - Real-time order tracking via WebSockets
        - Vendor and product management
        - Driver assignment and location tracking
        - Payment processing
        - Analytics and reporting
        
        ## Authentication
        All endpoints require JWT authentication. Use the `/api/auth/login/` endpoint 
        to obtain access and refresh tokens.
        """,
        terms_of_service="https://example.com/terms/",
        contact=openapi.Contact(email="api@deliveryplatform.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # API Endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/vendors/', include('vendors.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/drivers/', include('drivers.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/analytics/', include('analytics.urls')),
    # Modular API v1 (new DDD-based endpoints)
    path('api/v1/', include('api.v1.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
