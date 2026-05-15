from rest_framework.routers import DefaultRouter

from .endpoints.orders import OrderViewSet

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="orders")
