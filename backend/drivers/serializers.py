from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Driver, DriverDocument, DriverPayout, DriverReview


class DriverListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for driver list views.
    """
    name = serializers.CharField(source='user.name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    avatar = serializers.SerializerMethodField()
    vehicle_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = Driver
        fields = [
            'id', 'name', 'phone', 'avatar', 'vehicle_type', 'vehicle_display',
            'vehicle_number', 'vehicle_model', 'vehicle_color', 'is_available',
            'is_active', 'is_verified', 'rating', 'total_deliveries',
            'current_location'
        ]
    
    def get_avatar(self, obj):
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class DriverDetailSerializer(serializers.ModelSerializer):
    """
    Full driver serializer with all details.
    """
    user = UserSerializer(read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    
    class Meta:
        model = Driver
        fields = [
            'id', 'user', 'vehicle_type', 'vehicle_type_display',
            'vehicle_number', 'vehicle_model', 'vehicle_color',
            'license_number', 'license_expiry', 'is_available',
            'is_active', 'is_verified', 'current_latitude',
            'current_longitude', 'current_location', 'location_updated_at',
            'rating', 'total_reviews', 'total_deliveries', 'balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'rating', 'total_reviews', 'total_deliveries',
            'balance', 'created_at', 'updated_at'
        ]


class DriverCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating drivers.
    """
    
    class Meta:
        model = Driver
        fields = [
            'vehicle_type', 'vehicle_number', 'vehicle_model', 'vehicle_color',
            'license_number', 'license_expiry'
        ]


class DriverDocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for driver documents.
    """
    document_type_display = serializers.CharField(
        source='get_document_type_display',
        read_only=True
    )
    
    class Meta:
        model = DriverDocument
        fields = [
            'id', 'document_type', 'document_type_display',
            'document_number', 'file', 'is_verified', 'uploaded_at'
        ]
        read_only_fields = ['id', 'is_verified', 'uploaded_at']


class DriverReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for driver reviews.
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = DriverReview
        fields = [
            'id', 'customer_name', 'customer_avatar', 'rating',
            'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_customer_avatar(self, obj):
        if obj.customer.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.customer.avatar.url)
            return obj.customer.avatar.url
        return None


class DriverPayoutSerializer(serializers.ModelSerializer):
    """
    Serializer for driver payouts.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = DriverPayout
        fields = [
            'id', 'amount', 'status', 'status_display', 'method',
            'reference', 'processed_at', 'created_at'
        ]
        read_only_fields = ['id', 'processed_at', 'created_at']


class DriverStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating driver status.
    """
    is_available = serializers.BooleanField(required=True)


class DriverLocationUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating driver location.
    """
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
