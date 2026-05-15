from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductReview, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    """
    icon_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'icon_url',
            'image', 'image_url', 'is_active', 'display_order',
            'product_count', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']
    
    def get_icon_url(self, obj):
        if obj.icon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.icon.url)
            return obj.icon.url
        return None
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_product_count(self, obj):
        return obj.products.filter(is_available=True).count()


class ProductVariantSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductVariant model.
    """
    final_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'price_adjustment', 'final_price',
            'stock_quantity', 'is_available', 'sku'
        ]
        read_only_fields = ['id']


class ProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductImage model.
    """
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'alt_text', 'display_order']
        read_only_fields = ['id']
    
    def get_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductReview model.
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'customer_name', 'customer_avatar', 'rating',
            'comment', 'is_verified_purchase', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_customer_avatar(self, obj):
        if obj.customer.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.customer.avatar.url)
            return obj.customer.avatar.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for product list views.
    """
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    discount_percentage = serializers.FloatField(read_only=True)
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'image_url',
            'category', 'category_name', 'vendor', 'vendor_name',
            'price', 'discount_price', 'current_price', 'discount_percentage',
            'is_available', 'is_featured', 'in_stock', 'rating', 'preparation_time'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Full product serializer with all details.
    """
    image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    current_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    discount_percentage = serializers.FloatField(read_only=True)
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'image', 'image_url',
            'category', 'category_id', 'vendor', 'vendor_name',
            'product_type', 'price', 'discount_price', 'current_price',
            'discount_percentage', 'stock_quantity', 'is_available',
            'is_featured', 'in_stock', 'preparation_time', 'calories',
            'allergens', 'dietary_info', 'sku', 'barcode', 'weight',
            'rating', 'total_reviews', 'total_sales', 'variants',
            'additional_images', 'reviews', 'meta_title', 'meta_description',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'rating', 'total_reviews', 'total_sales',
            'created_at', 'updated_at'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating products.
    """
    category_id = serializers.UUIDField(required=False, allow_null=True)
    variants = ProductVariantSerializer(many=True, required=False)
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'image', 'category_id',
            'product_type', 'price', 'discount_price',
            'stock_quantity', 'is_available', 'is_featured',
            'preparation_time', 'calories', 'allergens',
            'dietary_info', 'sku', 'barcode', 'weight',
            'meta_title', 'meta_description', 'variants'
        ]
    
    def validate_category_id(self, value):
        if value is None:
            return value
        try:
            Category.objects.get(id=value)
            return value
        except Category.DoesNotExist:
            raise serializers.ValidationError("Category not found.")
    
    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        category_id = validated_data.pop('category_id', None)
        
        if category_id:
            validated_data['category'] = Category.objects.get(id=category_id)
        
        product = Product.objects.create(**validated_data)
        
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        
        return product
    
    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        category_id = validated_data.pop('category_id', None)
        
        if category_id is not None:
            if category_id:
                instance.category = Category.objects.get(id=category_id)
            else:
                instance.category = None
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle variants if provided
        if variants_data is not None:
            instance.variants.all().delete()
            for variant_data in variants_data:
                ProductVariant.objects.create(product=instance, **variant_data)
        
        return instance


class ProductSearchSerializer(serializers.Serializer):
    """
    Serializer for product search results.
    """
    query = serializers.CharField()
    category = serializers.UUIDField(required=False, allow_null=True)
    min_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )
    max_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )
    vendor = serializers.UUIDField(required=False, allow_null=True)
    is_available = serializers.BooleanField(required=False)
