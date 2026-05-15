from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from domains.orders.services import OrderService
from domains.orders.repositories import OrderRepository
from orders.serializers import OrderSerializer, OrderDetailSerializer, OrderListSerializer


class OrderViewSet(viewsets.ViewSet):
    """
    Enterprise-grade API endpoint for Order management.
    Implements strict role-based access control (RBAC).
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.repo = OrderRepository()
        self.service = OrderService(repo=self.repo)

    def create(self, request):
        """Place a new order."""
        data = request.data
        try:
            order = self.service.create_order(
                customer=request.user,
                vendor_id=data.get("vendor_id"),
                items=data.get("items", []),
                delivery_address=data.get("delivery_address"),
                payment_method=data.get("payment_method", "cash"),
                contact_name=data.get("contact_name"),
                contact_phone=data.get("contact_phone"),
                delivery_latitude=data.get("delivery_latitude"),
                delivery_longitude=data.get("delivery_longitude"),
                notes=data.get("notes")
            )
            return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """Get detailed order information with RBAC."""
        order = self.repo.get_with_details(pk)

        # Check if user has permission to view this order
        user = request.user
        if user.role == 'customer' and order.customer_id != user.id:
            raise PermissionDenied("You do not have permission to view this order.")
        elif user.role == 'vendor' and order.vendor.owner_id != user.id:
            raise PermissionDenied("You do not have permission to view this order.")
        elif user.role == 'driver':
            if order.driver and order.driver.user_id != user.id:
                raise PermissionDenied("You do not have permission to view this order.")
            elif not order.driver:
                raise PermissionDenied("Order not assigned to you.")

        return Response(OrderDetailSerializer(order).data)

    def list(self, request):
        """List orders filtered by user role and status."""
        user = request.user
        orders = self.repo.list_active_orders()

        if user.role == 'customer':
            orders = orders.filter(customer=user)
        elif user.role == 'vendor':
            orders = orders.filter(vendor__owner=user)
        elif user.role == 'driver':
            # Drivers see orders assigned to them
            from drivers.models import Driver
            try:
                driver = Driver.objects.get(user=user)
                orders = orders.filter(driver=driver)
            except Driver.DoesNotExist:
                # If the user is a driver but has no profile, they see nothing
                orders = orders.none()
        elif not user.is_staff:
            # Any other role that isn't staff sees nothing
            orders = orders.none()

        return Response(OrderListSerializer(orders, many=True).data)
