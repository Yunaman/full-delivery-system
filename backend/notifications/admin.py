from django.contrib import admin

from .models import Notification, PushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'recipient', 'type', 'title', 'priority',
        'is_read', 'created_at'
    ]
    list_filter = ['type', 'priority', 'is_read', 'created_at']
    search_fields = ['recipient__name', 'title', 'message']
    raw_id_fields = ['recipient']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_info', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__name', 'device_info']
    raw_id_fields = ['user']
