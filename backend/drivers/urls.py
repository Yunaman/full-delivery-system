from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DriverDocumentViewSet,
    DriverPayoutViewSet,
    DriverViewSet,
)

router = DefaultRouter()
router.register(r'', DriverViewSet, basename='driver')
router.register(r'documents', DriverDocumentViewSet, basename='driver-document')
router.register(r'payouts', DriverPayoutViewSet, basename='driver-payout')

urlpatterns = [
    path('', include(router.urls)),
]
