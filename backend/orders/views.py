from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import (
    IsAdminUser,
    IsCustomerUser,
    IsDriverUser,
    IsVendorOwner,
    IsVendorUser,
)

from .models import Order, OrderItem, OrderStatusHistory, OrderTracking
from .serializers import (
    AssignDriverSerializer,
    OrderCancellationSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderItemSerializer,
    OrderListSerializer,
    OrderStatusUpdateSerializer,
    OrderTrackingSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for order management.
    """
    queryset = Order.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'vendor', 'driver']
    search_fields = ['order_number', 'customer__name', 'delivery_address']
    ordering_fields = ['created_at', 'total_price', 'status']
    ordering = ['-created_at']
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsCustomerUser()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin_user:
            return Order.objects.all()
        elif user.is_vendor:
            return Order.objects.filter(vendor__owner=user)
        elif user.is_driver_user:
            from drivers.models import Driver
            try:
                driver = Driver.objects.get(user=user)
                return Order.objects.filter(driver=driver)
            except Driver.DoesNotExist:
                return Order.objects.none()
        else:  # Customer
            return Order.objects.filter(customer=user)
    
    def get_object(self):
        """
        Get order object ensuring user has permission to access it.
        """
        queryset = self.get_queryset()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        
        self.check_object_permissions(self.request, obj)
        return obj
    
    @swagger_auto_schema(operation_description="List orders based on user role")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(operation_description="Create a new order (customer only)")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Create tracking record
        OrderTracking.objects.create(order=order)
        
        # Create initial status history
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes='Order placed'
        )
        
        # Send notifications
        from notifications.tasks import send_order_notification
        send_order_notification.delay(order.id, 'order_placed')
        
        return Response(
            OrderDetailSerializer(order, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @swagger_auto_schema(operation_description="Get order details")
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[IsVendorOwner | IsAdminUser])
    def update_status(self, request, pk=None):
        """
        Update order status.
        """
        order = self.get_object()
        
        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'order': order, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        
        # Update order status and timestamps
        previous_status = order.status
        order.status = new_status
        
        # Update timestamp fields based on status
        now = timezone.now()
        if new_status == Order.Status.CONFIRMED:
            order.confirmed_at = now
        elif new_status == Order.Status.READY:
            order.prepared_at = now
        elif new_status == Order.Status.PICKED_UP:
            order.picked_up_at = now
        elif new_status == Order.Status.DELIVERED:
            order.delivered_at = now
        elif new_status == Order.Status.COMPLETED:
            order.completed_at = now
        elif new_status == Order.Status.CANCELLED:
            order.cancelled_at = now
            order.cancellation_reason = notes
            order.cancelled_by = request.user
        
        order.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            previous_status=previous_status,
            notes=notes,
            changed_by=request.user
        )
        
        # Send status update notification
        from notifications.tasks import send_order_notification
        send_order_notification.delay(order.id, f'status_{new_status}')
        
        # Broadcast real-time update
        from orders.consumers import broadcast_order_update
        broadcast_order_update(order.id, {
            'status': new_status,
            'status_display': order.get_status_display(),
            'previous_status': previous_status,
            'notes': notes
        })
        
        return Response(
            OrderDetailSerializer(order, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsVendorOwner | IsAdminUser])
    def assign_driver(self, request, pk=None):
        """
        Assign a driver to an order.
        """
        order = self.get_object()
        
        if not order.can_assign_driver():
            return Response(
                {"detail": "Cannot assign driver to this order at this stage."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AssignDriverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from drivers.models import Driver
        driver = Driver.objects.get(id=serializer.validated_data['driver_id'])
        
        order.driver = driver
        order.status = Order.Status.PICKED_UP
        order.picked_up_at = timezone.now()
        order.save()
        
        # Update driver availability
        driver.is_available = False
        driver.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=Order.Status.PICKED_UP,
            previous_status=Order.Status.READY,
            notes=f'Driver assigned: {driver.user.name}',
            changed_by=request.user
        )
        
        # Send notification
        from notifications.tasks import send_order_notification
        send_order_notification.delay(order.id, 'driver_assigned')
        
        return Response(
            OrderDetailSerializer(order, context={'request': request}).data
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser | IsAdminUser])
    def cancel(self, request, pk=None):
        """
        Cancel an order.
        """
        order = self.get_object()
        
        serializer = OrderCancellationSerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)
        
        # Update order status
        order.status = Order.Status.CANCELLED
        order.cancelled_at = timezone.now()
        order.cancellation_reason = serializer.validated_data['reason']
        order.cancelled_by = request.user
        order.save()
        
        # Restore product stock
        for item in order.items.all():
            if item.product:
                item.product.stock_quantity += item.quantity
                item.product.save()
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order,
            status=Order.Status.CANCELLED,
            previous_status=order.status,
            notes=f"Cancelled: {serializer.validated_data['reason']}",
            changed_by=request.user
        )
        
        # Send notification
        from notifications.tasks import send_order_notification
        send_order_notification.delay(order.id, 'order_cancelled')
        
        return Response(
            OrderDetailSerializer(order, context={'request': request}).data
        )
    
    @action(detail=True, methods=['get'])
    def tracking(self, request, pk=None):
        """
        Get order tracking information.
        """
        order = self.get_object()
        
        try:
            tracking = order.tracking
            serializer = OrderTrackingSerializer(tracking)
            return Response(serializer.data)
        except OrderTracking.DoesNotExist:
            return Response(
                {"detail": "Tracking information not available."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsDriverUser])
    def update_location(self, request, pk=None):
        """
        Update driver location for an order (driver only).
        """
        order = self.get_object()
        
        # Verify driver is assigned to this order
        from drivers.models import Driver
        try:
            driver = Driver.objects.get(user=request.user)
            if order.driver != driver:
                return Response(
                    {"detail": "You are not assigned to this order."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response(
                {"detail": "Latitude and longitude are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update tracking
        tracking, created = OrderTracking.objects.get_or_create(order=order)
        tracking.driver_latitude = latitude
        tracking.driver_longitude = longitude
        tracking.save()
        
        # Broadcast location update
        from orders.consumers import broadcast_driver_location
        broadcast_driver_location(order.id, {
            'latitude': str(latitude),
            'longitude': str(longitude)
        })
        
        return Response({'status': 'location updated'})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get order statistics for the authenticated user.
        """
        user = request.user
        queryset = self.get_queryset()
        
        # Count by status
        status_counts = {}
        for status_code, status_name in Order.Status.choices:
            count = queryset.filter(status=status_code).count()
            status_counts[status_code] = count
        
        # Total revenue
        total_revenue = queryset.filter(
            status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED]
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Recent orders
        recent_orders = queryset.order_by('-created_at')[:5]
        
        data = {
            'status_counts': status_counts,
            'total_orders': queryset.count(),
            'total_revenue': total_revenue,
            'recent_orders': OrderListSerializer(
                recent_orders,
                many=True,
                context={'request': request}
            ).data
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active orders (not completed or cancelled).
        """
        queryset = self.get_queryset().filter(
            status__in=[
                Order.Status.PENDING,
                Order.Status.CONFIRMED,
                Order.Status.PREPARING,
                Order.Status.READY,
                Order.Status.PICKED_UP,
                Order.Status.IN_TRANSIT,
                Order.Status.DELIVERED
            ]
        ).order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = OrderListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = OrderListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class OrderItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for order item management (mainly for admin).
    """
    serializer_class = OrderItemSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return OrderItem.objects.all().select_related('order', 'product', 'variant')
