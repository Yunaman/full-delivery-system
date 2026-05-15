from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory, OrderTracking


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']
    raw_id_fields = ['product', 'variant']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['created_at']
    raw_id_fields = ['changed_by']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'customer', 'vendor', 'driver',
        'status', 'payment_status', 'total_price', 'placed_at'
    ]
    list_filter = [
        'status', 'payment_status', 'payment_method',
        'created_at', 'placed_at'
    ]
    search_fields = [
        'order_number', 'customer__name', 'customer__email',
        'vendor__shop_name', 'delivery_address'
    ]
    raw_id_fields = ['customer', 'vendor', 'driver', 'cancelled_by']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    
    fieldsets = (
        ('Order Info', {
            'fields': ('order_number', 'customer', 'vendor', 'driver')
        }),
        ('Status', {
            'fields': ('status', 'payment_status', 'payment_method')
        }),
        ('Pricing', {
            'fields': ('subtotal', 'delivery_fee', 'tax_amount', 'discount_amount', 'total_price')
        }),
        ('Delivery', {
            'fields': ('delivery_address', 'delivery_latitude', 'delivery_longitude')
        }),
        ('Contact', {
            'fields': ('contact_name', 'contact_phone')
        }),
        ('Notes', {
            'fields': ('notes', 'preparation_notes', 'delivery_notes')
        }),
        ('Timing', {
            'fields': (
                'estimated_preparation_time', 'estimated_delivery_time',
                'placed_at', 'confirmed_at', 'prepared_at', 'picked_up_at',
                'delivered_at', 'completed_at', 'cancelled_at'
            ),
            'classes': ('collapse',)
        }),
        ('Cancellation', {
            'fields': ('cancellation_reason', 'cancelled_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = [
        'order_number', 'total_price', 'placed_at',
        'confirmed_at', 'prepared_at', 'picked_up_at',
        'delivered_at', 'completed_at', 'cancelled_at'
    ]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'quantity', 'unit_price', 'total_price']
    list_filter = ['created_at']
    search_fields = ['order__order_number', 'product_name']
    raw_id_fields = ['order', 'product', 'variant']
    readonly_fields = ['total_price']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'previous_status', 'changed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number', 'notes']
    raw_id_fields = ['order', 'changed_by']
    readonly_fields = ['created_at']


@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = ['order', 'driver_latitude', 'driver_longitude', 'last_updated']
    search_fields = ['order__order_number']
    readonly_fields = ['last_updated']
