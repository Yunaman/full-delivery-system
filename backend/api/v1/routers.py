from rest_framework.routers import DefaultRouter
from orders.views import OrderViewSet
from vendors.views import VendorViewSet
from products.views import ProductViewSet

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="orders")
router.register(r"vendors", VendorViewSet, basename="vendors")
router.register(r"products", ProductViewSet, basename="products")
