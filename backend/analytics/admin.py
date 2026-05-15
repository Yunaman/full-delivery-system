from django.contrib import admin

from .models import DailyAnalytics, VendorAnalytics


@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_orders', 'total_revenue',
        'new_customers', 'new_vendors', 'new_drivers'
    ]
    list_filter = ['date']
    date_hierarchy = 'date'


@admin.register(VendorAnalytics)
class VendorAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'vendor', 'total_orders', 'total_revenue',
        'total_customers', 'average_order_value', 'last_updated'
    ]
    list_filter = ['last_updated']
    raw_id_fields = ['vendor']
    readonly_fields = ['last_updated']
