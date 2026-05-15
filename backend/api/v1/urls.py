from django.urls import include, path
from .routers import router

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('accounts.urls')),
    path('vendors/', include('vendors.urls')),
    path('products/', include('products.urls')),
    path('drivers/', include('drivers.urls')),
    path('payments/', include('payments.urls')),
    path('notifications/', include('notifications.urls')),
    path('analytics/', include('analytics.urls')),
]
