from rest_framework import serializers

from .models import Payment, Wallet, WalletTransaction


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    """
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'amount', 'method', 'method_display',
            'status', 'status_display', 'transaction_id', 'paid_at',
            'refund_amount', 'refund_reason', 'refunded_at',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'transaction_id', 'paid_at',
            'refund_amount', 'refunded_at', 'created_at', 'updated_at'
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a payment.
    """
    order_id = serializers.UUIDField()
    method = serializers.ChoiceField(choices=Payment.Method.choices)
    
    def validate_order_id(self, value):
        from orders.models import Order
        try:
            return Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found.")
    
    def create(self, validated_data):
        order = validated_data['order_id']
        
        payment = Payment.objects.create(
            order=order,
            amount=order.total_price,
            method=validated_data['method']
        )
        
        return payment


class WalletSerializer(serializers.ModelSerializer):
    """
    Serializer for Wallet model.
    """
    
    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for WalletTransaction model.
    """
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display',
        read_only=True
    )
    
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'amount', 'description', 'reference_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WalletTopUpSerializer(serializers.Serializer):
    """
    Serializer for wallet top-up.
    """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)


class RefundSerializer(serializers.Serializer):
    """
    Serializer for processing refunds.
    """
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    reason = serializers.CharField(required=True)
    
    def validate_amount(self, value):
        payment = self.context['payment']
        max_refund = payment.amount - payment.refund_amount
        if value > max_refund:
            raise serializers.ValidationError(
                f"Cannot refund more than ${max_refund}"
            )
        return value
