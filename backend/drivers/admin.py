from django.contrib import admin

from .models import Driver, DriverDocument, DriverPayout, DriverReview


class DriverDocumentInline(admin.TabularInline):
    model = DriverDocument
    extra = 0


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'vehicle_type', 'vehicle_number', 'is_available',
        'is_active', 'is_verified', 'rating', 'total_deliveries', 'balance'
    ]
    list_filter = [
        'is_available', 'is_active', 'is_verified',
        'vehicle_type', 'created_at'
    ]
    search_fields = ['user__name', 'user__email', 'vehicle_number']
    raw_id_fields = ['user']
    inlines = [DriverDocumentInline]
    
    fieldsets = (
        (None, {
            'fields': ('user', 'vehicle_type', 'vehicle_number', 'vehicle_model', 'vehicle_color')
        }),
        ('License', {
            'fields': ('license_number', 'license_expiry')
        }),
        ('Status', {
            'fields': ('is_available', 'is_active', 'is_verified')
        }),
        ('Location', {
            'fields': ('current_latitude', 'current_longitude', 'location_updated_at'),
            'classes': ('collapse',)
        }),
        ('Statistics', {
            'fields': ('rating', 'total_reviews', 'total_deliveries', 'balance'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'location_updated_at', 'rating', 'total_reviews',
        'total_deliveries', 'balance'
    ]


@admin.register(DriverDocument)
class DriverDocumentAdmin(admin.ModelAdmin):
    list_display = ['driver', 'document_type', 'document_number', 'is_verified', 'uploaded_at']
    list_filter = ['document_type', 'is_verified', 'uploaded_at']
    search_fields = ['driver__user__name', 'document_number']
    raw_id_fields = ['driver']


@admin.register(DriverReview)
class DriverReviewAdmin(admin.ModelAdmin):
    list_display = ['driver', 'customer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['driver__user__name', 'customer__name', 'comment']
    raw_id_fields = ['driver', 'customer', 'order']


@admin.register(DriverPayout)
class DriverPayoutAdmin(admin.ModelAdmin):
    list_display = ['driver', 'amount', 'status', 'method', 'created_at', 'processed_at']
    list_filter = ['status', 'method', 'created_at']
    search_fields = ['driver__user__name', 'reference']
    raw_id_fields = ['driver']
    readonly_fields = ['processed_at']
