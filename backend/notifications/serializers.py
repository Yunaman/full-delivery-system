from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model.
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message', 'data',
            'priority', 'priority_display', 'is_read', 'read_at',
            'action_url', 'sent_via_push', 'sent_via_email',
            'sent_via_sms', 'created_at'
        ]
        read_only_fields = [
            'id', 'read_at', 'sent_via_push', 'sent_via_email',
            'sent_via_sms', 'created_at'
        ]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for PushSubscription model.
    """
    
    class Meta:
        model = PushSubscription
        fields = [
            'id', 'endpoint', 'p256dh', 'auth',
            'device_info', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
