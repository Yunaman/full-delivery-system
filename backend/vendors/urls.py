from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import VendorReviewViewSet, VendorStaffViewSet, VendorViewSet

router = DefaultRouter()
router.register(r'', VendorViewSet, basename='vendor')
router.register(r'staff', VendorStaffViewSet, basename='vendor-staff')
router.register(r'reviews', VendorReviewViewSet, basename='vendor-review')

urlpatterns = [
    path('', include(router.urls)),
]
