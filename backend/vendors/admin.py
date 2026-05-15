from django.contrib import admin

from .models import Vendor, VendorReview, VendorStaff


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = [
        'shop_name', 'owner', 'vendor_type', 'city', 'is_open',
        'is_active', 'is_verified', 'rating', 'created_at'
    ]
    list_filter = [
        'vendor_type', 'is_active', 'is_open', 'is_verified',
        'city', 'created_at'
    ]
    search_fields = ['shop_name', 'owner__name', 'owner__email', 'city']
    raw_id_fields = ['owner']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (None, {
            'fields': ('owner', 'shop_name', 'slug', 'vendor_type')
        }),
        ('Media', {
            'fields': ('logo', 'cover_image')
        }),
        ('Contact Info', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country',
                      'phone', 'email', 'website')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('is_open', 'is_active', 'is_verified')
        }),
        ('Business Details', {
            'fields': ('working_hours', 'delivery_radius', 'minimum_order_amount',
                      'delivery_fee', 'tax_rate', 'preparation_time')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Ratings', {
            'fields': ('rating', 'total_reviews'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['slug', 'rating', 'total_reviews']


@admin.register(VendorStaff)
class VendorStaffAdmin(admin.ModelAdmin):
    list_display = ['user', 'vendor', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'joined_at']
    search_fields = ['user__name', 'vendor__shop_name']
    raw_id_fields = ['user', 'vendor']


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'customer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['vendor__shop_name', 'customer__name', 'comment']
    raw_id_fields = ['vendor', 'customer']
