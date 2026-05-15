from rest_framework import serializers


class DashboardSerializer(serializers.Serializer):
    """
    Serializer for dashboard analytics data.
    """
    summary = serializers.DictField()
    order_status_breakdown = serializers.DictField()
    recent_orders = serializers.ListField()


class RevenueSerializer(serializers.Serializer):
    """
    Serializer for revenue analytics.
    """
    date_range = serializers.DictField()
    summary = serializers.DictField()
    daily_breakdown = serializers.ListField()


class UserAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for user analytics.
    """
    total_users = serializers.IntegerField()
    role_distribution = serializers.DictField()
    user_growth = serializers.ListField()
