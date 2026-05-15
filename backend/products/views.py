from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminUser, IsCustomerUser, IsVendorOwner

from .models import Category, Product, ProductImage, ProductReview, ProductVariant
from .serializers import (
    CategorySerializer,
    ProductCreateUpdateSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductReviewSerializer,
    ProductSearchSerializer,
    ProductVariantSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product category management.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Get popular categories based on product count.
        """
        categories = self.get_queryset().annotate(
            product_count=Count('products')
        ).order_by('-product_count')[:10]
        
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for product management.
    """
    queryset = Product.objects.filter(is_available=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vendor', 'category', 'is_available', 'is_featured', 'product_type']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'rating', 'total_sales', 'name']
    ordering = ['-created_at']
    lookup_field = 'pk'
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVendorOwner()]
        elif self.action in ['add_review']:
            return [IsCustomerUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        # Filter by availability
        if self.request.query_params.get('available_only') == 'true':
            queryset = queryset.filter(is_available=True)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by dietary preferences
        dietary = self.request.query_params.getlist('dietary')
        if dietary:
            for d in dietary:
                queryset = queryset.filter(dietary_info__contains={d: True})
        
        # Filter by allergens (exclude)
        exclude_allergens = self.request.query_params.getlist('exclude_allergen')
        if exclude_allergens:
            for allergen in exclude_allergens:
                queryset = queryset.exclude(allergens__contains=[allergen])
        
        # Filter by vendor's products (for vendor users)
        if self.request.query_params.get('my_products') == 'true':
            if self.request.user.is_authenticated and self.request.user.is_vendor:
                queryset = queryset.filter(vendor__owner=self.request.user)
            else:
                queryset = queryset.none()
        
        return queryset.select_related('vendor', 'category').prefetch_related(
            'variants', 'additional_images', 'reviews'
        )
    
    @swagger_auto_schema(operation_description="List all products with optional filters")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(operation_description="Create a new product (requires vendor role)")
    def create(self, request, *args, **kwargs):
        # Ensure vendor is set from request user
        if not request.user.is_vendor:
            return Response(
                {"detail": "Only vendors can create products."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from vendors.models import Vendor
        try:
            vendor = Vendor.objects.get(owner=request.user)
        except Vendor.DoesNotExist:
            return Response(
                {"detail": "You must have a vendor profile to create products."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(vendor=vendor)
        
        return Response(
            ProductDetailSerializer(serializer.instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """
        Get all reviews for a product.
        """
        product = self.get_object()
        reviews = ProductReview.objects.filter(product=product).select_related('customer')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ProductReviewSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser])
    def add_review(self, request, pk=None):
        """
        Add a review to a product.
        """
        product = self.get_object()
        
        # Check if user already reviewed
        if ProductReview.objects.filter(product=product, customer=request.user).exists():
            return Response(
                {"detail": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ProductReviewSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Check if verified purchase
            from orders.models import OrderItem
            verified = OrderItem.objects.filter(
                order__customer=request.user,
                product=product,
                order__status__in=['delivered', 'completed']
            ).exists()
            
            review = serializer.save(
                product=product,
                customer=request.user,
                is_verified_purchase=verified
            )
            
            # Update product rating
            avg_rating = ProductReview.objects.filter(product=product).aggregate(
                Avg('rating')
            )['rating__avg']
            product.rating = avg_rating or 0
            product.total_reviews = ProductReview.objects.filter(product=product).count()
            product.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured products.
        """
        products = self.get_queryset().filter(
            is_featured=True,
            is_available=True
        )[:20]
        
        serializer = ProductListSerializer(
            products,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced product search.
        """
        serializer = ProductSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        queryset = self.get_queryset()
        
        # Text search
        query = data.get('query')
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(sku__iexact=query)
            )
        
        # Category filter
        category = data.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Price filters
        min_price = data.get('min_price')
        max_price = data.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Vendor filter
        vendor = data.get('vendor')
        if vendor:
            queryset = queryset.filter(vendor_id=vendor)
        
        # Availability filter
        if data.get('is_available'):
            queryset = queryset.filter(is_available=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsVendorOwner])
    def add_image(self, request, pk=None):
        """
        Add an additional image to a product.
        """
        product = self.get_object()
        serializer = ProductImageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsVendorOwner])
    def add_variant(self, request, pk=None):
        """
        Add a variant to a product.
        """
        product = self.get_object()
        serializer = ProductVariantSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product variants.
    """
    serializer_class = ProductVariantSerializer
    permission_classes = [IsVendorOwner]
    
    def get_queryset(self):
        return ProductVariant.objects.filter(
            product__vendor__owner=self.request.user
        ).select_related('product')


class ProductImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product images.
    """
    serializer_class = ProductImageSerializer
    permission_classes = [IsVendorOwner]
    
    def get_queryset(self):
        return ProductImage.objects.filter(
            product__vendor__owner=self.request.user
        ).select_related('product')
