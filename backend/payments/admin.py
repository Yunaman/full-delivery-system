from django.contrib import admin

from .models import Payment, Wallet, WalletTransaction


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'order', 'amount', 'method', 'status',
        'transaction_id', 'paid_at', 'created_at'
    ]
    list_filter = ['status', 'method', 'created_at', 'paid_at']
    search_fields = [
        'order__order_number', 'transaction_id',
        'order__customer__name', 'order__customer__email'
    ]
    raw_id_fields = ['order']
    readonly_fields = ['created_at', 'updated_at', 'paid_at', 'refunded_at']
    date_hierarchy = 'created_at'


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'is_active', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__name', 'user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'wallet', 'transaction_type', 'amount',
        'description', 'created_at'
    ]
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['wallet__user__name', 'description', 'reference_id']
    raw_id_fields = ['wallet']
    readonly_fields = ['created_at']
