from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, WalletViewSet

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')
router.register(r'wallet', WalletViewSet, basename='wallet')

urlpatterns = [
    path('', include(router.urls)),
]
