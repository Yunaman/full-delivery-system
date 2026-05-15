from django.db.models import Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import (
    IsAdminUser,
    IsCustomerUser,
    IsDriverUser,
    IsVendorUser,
)

from .models import Driver, DriverDocument, DriverPayout, DriverReview
from .serializers import (
    DriverCreateUpdateSerializer,
    DriverDetailSerializer,
    DriverDocumentSerializer,
    DriverListSerializer,
    DriverLocationUpdateSerializer,
    DriverPayoutSerializer,
    DriverReviewSerializer,
    DriverStatusUpdateSerializer,
)


class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet for driver management.
    """
    queryset = Driver.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_available', 'vehicle_type', 'is_verified']
    search_fields = ['user__name', 'user__phone', 'vehicle_number']
    ordering_fields = ['rating', 'total_deliveries', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DriverCreateUpdateSerializer
        if self.action == 'retrieve':
            return DriverDetailSerializer
        return DriverListSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsDriverUser()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser() | IsDriverUser()]
        elif self.action in ['add_review']:
            return [IsCustomerUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        queryset = Driver.objects.filter(is_active=True)
        
        # Show only available drivers for assignment
        if self.request.query_params.get('available_only') == 'true':
            queryset = queryset.filter(is_available=True, is_verified=True)
        
        # Filter by location
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        if lat and lng:
            # Simplified location filter
            queryset = queryset.filter(
                current_latitude__isnull=False,
                current_longitude__isnull=False
            )
        
        return queryset.select_related('user').prefetch_related('reviews')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_object(self):
        """
        Get driver object with special handling for 'me' action.
        """
        pk = self.kwargs.get('pk')
        if pk == 'me':
            return Driver.objects.get(user=self.request.user)
        return super().get_object()
    
    @swagger_auto_schema(operation_description="List available drivers")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(operation_description="Create driver profile (driver role required)")
    def create(self, request, *args, **kwargs):
        # Check if driver profile already exists
        if Driver.objects.filter(user=request.user).exists():
            return Response(
                {"detail": "Driver profile already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], permission_classes=[IsDriverUser])
    def me(self, request):
        """
        Get current driver's profile.
        """
        try:
            driver = Driver.objects.get(user=request.user)
            serializer = DriverDetailSerializer(driver, context={'request': request})
            return Response(serializer.data)
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['patch'], permission_classes=[IsDriverUser])
    def update_status(self, request):
        """
        Update driver's availability status.
        """
        serializer = DriverStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            driver = Driver.objects.get(user=request.user)
            driver.is_available = serializer.validated_data['is_available']
            driver.save()
            
            return Response({
                'is_available': driver.is_available,
                'message': f"Driver status updated to {'available' if driver.is_available else 'unavailable'}"
            })
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsDriverUser])
    def update_location(self, request):
        """
        Update driver's current location.
        """
        serializer = DriverLocationUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            driver = Driver.objects.get(user=request.user)
            driver.update_location(
                serializer.validated_data['latitude'],
                serializer.validated_data['longitude']
            )
            
            return Response({
                'message': 'Location updated successfully',
                'current_location': driver.current_location
            })
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser])
    def add_review(self, request, pk=None):
        """
        Add a review for a driver (after delivery).
        """
        driver = self.get_object()
        
        # Check if user has a completed order with this driver
        has_completed_order = driver.orders.filter(
            customer=request.user,
            status='completed'
        ).exists()
        
        if not has_completed_order:
            return Response(
                {"detail": "You can only review drivers who have delivered your orders."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DriverReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if already reviewed
        if DriverReview.objects.filter(driver=driver, customer=request.user).exists():
            return Response(
                {"detail": "You have already reviewed this driver."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        review = serializer.save(driver=driver, customer=request.user)
        
        # Update driver rating
        from django.db.models import Avg
        avg_rating = DriverReview.objects.filter(driver=driver).aggregate(
            Avg('rating')
        )['rating__avg']
        driver.rating = avg_rating or 0
        driver.total_reviews = DriverReview.objects.filter(driver=driver).count()
        driver.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """
        Get all reviews for a driver.
        """
        driver = self.get_object()
        reviews = DriverReview.objects.filter(driver=driver).select_related('customer')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = DriverReviewSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = DriverReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsDriverUser])
    def earnings(self, request):
        """
        Get driver's earnings summary.
        """
        try:
            driver = Driver.objects.get(user=request.user)
            
            from django.db.models import Sum
            from orders.models import Order
            
            # Calculate earnings from completed orders
            completed_orders = Order.objects.filter(
                driver=driver,
                status='completed'
            )
            
            total_earnings = completed_orders.count() * 5.00  # $5 per delivery example
            
            # Get recent payouts
            recent_payouts = DriverPayout.objects.filter(
                driver=driver
            ).order_by('-created_at')[:10]
            
            data = {
                'balance': driver.balance,
                'total_earnings': total_earnings,
                'total_deliveries': driver.total_deliveries,
                'recent_payouts': DriverPayoutSerializer(
                    recent_payouts,
                    many=True
                ).data
            }
            
            return Response(data)
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsDriverUser])
    def request_payout(self, request):
        """
        Request a payout.
        """
        try:
            driver = Driver.objects.get(user=request.user)
            
            amount = request.data.get('amount')
            if not amount:
                return Response(
                    {"detail": "Amount is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            amount = float(amount)
            if amount > driver.balance:
                return Response(
                    {"detail": "Insufficient balance."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            payout = DriverPayout.objects.create(
                driver=driver,
                amount=amount,
                method=request.data.get('method', 'bank_transfer')
            )
            
            # Deduct from balance
            driver.balance -= amount
            driver.save()
            
            return Response(
                DriverPayoutSerializer(payout).data,
                status=status.HTTP_201_CREATED
            )
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class DriverDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for driver document management.
    """
    serializer_class = DriverDocumentSerializer
    permission_classes = [IsDriverUser | IsAdminUser]
    
    def get_queryset(self):
        if self.request.user.is_admin_user:
            return DriverDocument.objects.all()
        try:
            driver = Driver.objects.get(user=self.request.user)
            return DriverDocument.objects.filter(driver=driver)
        except Driver.DoesNotExist:
            return DriverDocument.objects.none()
    
    def perform_create(self, serializer):
        driver = Driver.objects.get(user=self.request.user)
        serializer.save(driver=driver)


class DriverPayoutViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reading driver payouts.
    """
    serializer_class = DriverPayoutSerializer
    permission_classes = [IsAdminUser]
    queryset = DriverPayout.objects.all().select_related('driver', 'driver__user')
