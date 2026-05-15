from decimal import Decimal

from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import (
    IsAdminUser,
    IsCustomerUser,
    IsVendorOwner,
    IsVendorUser,
)

from .models import Vendor, VendorReview, VendorStaff
from .serializers import (
    VendorAnalyticsSerializer,
    VendorCreateUpdateSerializer,
    VendorDetailSerializer,
    VendorListSerializer,
    VendorReviewSerializer,
    VendorStaffSerializer,
)


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for vendor management.
    """
    queryset = Vendor.objects.filter(is_active=True)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shop_name', 'description', 'city', 'address']
    ordering_fields = ['rating', 'created_at', 'shop_name', 'delivery_fee']
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return VendorCreateUpdateSerializer
        if self.action == 'retrieve':
            return VendorDetailSerializer
        return VendorListSerializer
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsVendorUser()]
        elif self.action in ['update', 'partial_update', 'destroy', 'staff', 'analytics']:
            return [IsVendorOwner()]
        elif self.action in ['add_review']:
            return [IsCustomerUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        queryset = Vendor.objects.filter(is_active=True)
        
        # Filter by vendor type
        vendor_type = self.request.query_params.get('type')
        if vendor_type:
            queryset = queryset.filter(vendor_type=vendor_type)
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by open status
        is_open = self.request.query_params.get('is_open')
        if is_open is not None:
            queryset = queryset.filter(is_open=is_open.lower() == 'true')
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter by delivery radius and location
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        if lat and lng:
            # This is a simplified distance filter
            # In production, use PostGIS for proper geospatial queries
            lat = Decimal(lat)
            lng = Decimal(lng)
            queryset = queryset.filter(
                latitude__isnull=False,
                longitude__isnull=False
            )
        
        # Filter by user's own vendors
        if self.request.query_params.get('my_vendors') == 'true':
            if self.request.user.is_authenticated and self.request.user.is_vendor:
                queryset = queryset.filter(owner=self.request.user)
            else:
                queryset = queryset.none()
        
        return queryset.select_related('owner').prefetch_related('staff_members')
    
    @swagger_auto_schema(operation_description="List all active vendors with optional filters")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(operation_description="Create a new vendor (requires vendor role)")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser])
    def add_review(self, request, pk=None):
        """
        Add a review to a vendor.
        """
        vendor = self.get_object()
        serializer = VendorReviewSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Check if user already reviewed
            if VendorReview.objects.filter(vendor=vendor, customer=request.user).exists():
                return Response(
                    {"detail": "You have already reviewed this vendor."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = serializer.save(vendor=vendor)
            
            # Update vendor rating
            avg_rating = VendorReview.objects.filter(vendor=vendor).aggregate(
                Avg('rating')
            )['rating__avg']
            vendor.rating = avg_rating or 0
            vendor.total_reviews = VendorReview.objects.filter(vendor=vendor).count()
            vendor.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """
        Get all reviews for a vendor.
        """
        vendor = self.get_object()
        reviews = VendorReview.objects.filter(vendor=vendor).select_related('customer')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = VendorReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = VendorReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[IsVendorOwner])
    def staff(self, request, pk=None):
        """
        Manage vendor staff members.
        """
        vendor = self.get_object()
        
        if request.method == 'GET':
            staff = VendorStaff.objects.filter(vendor=vendor).select_related('user')
            serializer = VendorStaffSerializer(staff, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = VendorStaffSerializer(
                data=request.data,
                context={'request': request}
            )
            if serializer.is_valid():
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=serializer.validated_data['user_id'])
                staff = serializer.save(vendor=vendor, user=user)
                return Response(
                    VendorStaffSerializer(staff).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[IsVendorOwner])
    def analytics(self, request, pk=None):
        """
        Get vendor analytics data.
        """
        vendor = self.get_object()
        today = timezone.now().date()
        
        # Get order statistics
        from orders.models import Order
        
        total_orders = Order.objects.filter(vendor=vendor).count()
        total_revenue = Order.objects.filter(
            vendor=vendor,
            status__in=['delivered', 'completed']
        ).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        total_customers = Order.objects.filter(vendor=vendor).values(
            'customer'
        ).distinct().count()
        
        avg_order_value = Order.objects.filter(
            vendor=vendor
        ).aggregate(
            avg=Avg('total_price')
        )['avg'] or 0
        
        orders_today = Order.objects.filter(
            vendor=vendor,
            created_at__date=today
        ).count()
        
        revenue_today = Order.objects.filter(
            vendor=vendor,
            created_at__date=today,
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Get popular products
        from orders.models import OrderItem
        popular_products = OrderItem.objects.filter(
            order__vendor=vendor
        ).values(
            'product__name'
        ).annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:5]
        
        data = {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_customers': total_customers,
            'average_order_value': avg_order_value,
            'orders_today': orders_today,
            'revenue_today': revenue_today,
            'rating': vendor.rating,
            'popular_products': list(popular_products)
        }
        
        serializer = VendorAnalyticsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """
        Get list of vendor types.
        """
        types = [
            {'value': value, 'label': label}
            for value, label in Vendor.VendorType.choices
        ]
        return Response(types)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """
        Find vendors near a given location.
        """
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 5)  # km
        
        if not lat or not lng:
            return Response(
                {"detail": "lat and lng parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simplified nearby query
        # In production, use PostGIS for accurate distance calculation
        vendors = self.get_queryset().filter(
            is_open=True,
            latitude__isnull=False,
            longitude__isnull=False
        )[:20]
        
        serializer = VendorListSerializer(
            vendors,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class VendorStaffViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vendor staff.
    """
    serializer_class = VendorStaffSerializer
    permission_classes = [IsVendorOwner]
    
    def get_queryset(self):
        return VendorStaff.objects.filter(
            vendor__owner=self.request.user
        ).select_related('user', 'vendor')
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Toggle staff member's active status.
        """
        staff = self.get_object()
        staff.is_active = not staff.is_active
        staff.save()
        return Response({'is_active': staff.is_active})


class VendorReviewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reading vendor reviews.
    """
    serializer_class = VendorReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return VendorReview.objects.all().select_related('customer', 'vendor')
