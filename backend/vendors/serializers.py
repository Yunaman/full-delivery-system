from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Vendor, VendorReview, VendorStaff


class VendorListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for vendor list views.
    """
    logo_url = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True, required=False)
    is_open_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'shop_name', 'slug', 'vendor_type', 'logo_url',
            'address', 'city', 'latitude', 'longitude', 'is_open',
            'is_open_now', 'rating', 'total_reviews', 'delivery_radius',
            'minimum_order_amount', 'delivery_fee', 'distance', 'preparation_time'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_is_open_now(self, obj):
        return obj.is_available_for_orders


class VendorDetailSerializer(serializers.ModelSerializer):
    """
    Full vendor serializer with all details.
    """
    logo_url = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    owner = UserSerializer(read_only=True)
    staff_count = serializers.SerializerMethodField()
    is_open_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'shop_name', 'slug', 'vendor_type', 'description',
            'logo', 'logo_url', 'cover_image', 'cover_image_url',
            'address', 'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'is_open', 'is_active', 'is_verified', 'is_open_now',
            'working_hours', 'delivery_radius', 'minimum_order_amount',
            'delivery_fee', 'tax_rate', 'preparation_time',
            'rating', 'total_reviews', 'owner', 'staff_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'rating', 'total_reviews', 'owner', 
            'created_at', 'updated_at'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def get_staff_count(self, obj):
        return obj.staff_members.filter(is_active=True).count()
    
    def get_is_open_now(self, obj):
        return obj.is_available_for_orders


class VendorCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating vendors.
    """
    
    class Meta:
        model = Vendor
        fields = [
            'shop_name', 'vendor_type', 'description', 'logo', 'cover_image',
            'address', 'city', 'state', 'postal_code', 'country',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'is_open', 'working_hours', 'delivery_radius',
            'minimum_order_amount', 'delivery_fee', 'tax_rate',
            'preparation_time'
        ]
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class VendorStaffSerializer(serializers.ModelSerializer):
    """
    Serializer for vendor staff management.
    """
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = VendorStaff
        fields = [
            'id', 'user', 'user_id', 'role', 'is_active',
            'can_manage_orders', 'can_manage_products', 'can_view_analytics',
            'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']
    
    def validate_user_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            user = User.objects.get(id=value)
            if user.role != 'staff':
                raise serializers.ValidationError("User must have 'staff' role.")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")


class VendorReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for vendor reviews.
    """
    customer = UserSerializer(read_only=True)
    
    class Meta:
        model = VendorReview
        fields = ['id', 'customer', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'customer', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class VendorAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for vendor analytics data.
    """
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_customers = serializers.IntegerField()
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    orders_today = serializers.IntegerField()
    revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    rating = serializers.DecimalField(max_digits=2, decimal_places=1)
    popular_products = serializers.ListField()
