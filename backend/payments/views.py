from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminUser, IsCustomerUser

from .models import Payment, Wallet, WalletTransaction
from .serializers import (
    PaymentCreateSerializer,
    PaymentSerializer,
    RefundSerializer,
    WalletSerializer,
    WalletTopUpSerializer,
    WalletTransactionSerializer,
)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for payment management.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'method']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'refund']:
            return [IsCustomerUser() | IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_admin_user:
            return Payment.objects.all()
        
        # Return payments for user's orders
        return Payment.objects.filter(
            Q(order__customer=user) | Q(order__vendor__owner=user)
        )
    
    def create(self, request, *args, **kwargs):
        """
        Create a new payment for an order.
        """
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        
        # Process payment based on method
        if payment.method == Payment.Method.CASH:
            # Cash on delivery - no immediate processing
            pass
        elif payment.method in [Payment.Method.CARD, Payment.Method.ONLINE]:
            # Here you would integrate with a payment gateway
            # For now, we'll simulate successful payment
            payment.status = Payment.Status.COMPLETED
            payment.transaction_id = f"SIM_{payment.id}"
            from django.utils import timezone
            payment.paid_at = timezone.now()
            payment.save()
            
            # Update order payment status
            payment.order.payment_status = 'paid'
            payment.order.save()
        
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def refund(self, request, pk=None):
        """
        Process a refund for a payment.
        """
        payment = self.get_object()
        
        serializer = RefundSerializer(
            data=request.data,
            context={'payment': payment}
        )
        serializer.is_valid(raise_exception=True)
        
        # Process refund
        from django.utils import timezone
        payment.refund_amount += serializer.validated_data['amount']
        payment.refund_reason = serializer.validated_data['reason']
        
        if payment.refund_amount >= payment.amount:
            payment.status = Payment.Status.REFUNDED
        
        payment.refunded_at = timezone.now()
        payment.save()
        
        # Update order status
        payment.order.payment_status = 'refunded'
        payment.order.save()
        
        return Response(PaymentSerializer(payment).data)
    
    @action(detail=False, methods=['get'])
    def by_order(self, request):
        """
        Get payment by order ID.
        """
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response(
                {"detail": "order_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment = Payment.objects.get(order_id=order_id)
            serializer = self.get_serializer(payment)
            return Response(serializer.data)
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found for this order."},
                status=status.HTTP_404_NOT_FOUND
            )


class WalletViewSet(viewsets.ModelViewSet):
    """
    ViewSet for wallet management.
    """
    serializer_class = WalletSerializer
    permission_classes = [IsCustomerUser]
    
    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)
    
    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet
    
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """
        Get current wallet balance.
        """
        wallet = self.get_object()
        return Response({
            'balance': wallet.balance,
            'is_active': wallet.is_active
        })
    
    @action(detail=False, methods=['post'])
    def topup(self, request):
        """
        Add funds to wallet.
        """
        serializer = WalletTopUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        wallet = self.get_object()
        amount = serializer.validated_data['amount']
        
        # Here you would integrate with a payment gateway
        # For now, we'll simulate successful top-up
        wallet.balance += amount
        wallet.save()
        
        # Create transaction record
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=WalletTransaction.TransactionType.CREDIT,
            amount=amount,
            description='Wallet top-up',
            reference_id=f'TOPUP_{wallet.id}'
        )
        
        return Response({
            'message': f'Successfully added ${amount} to wallet',
            'new_balance': wallet.balance
        })
    
    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """
        Get wallet transaction history.
        """
        wallet = self.get_object()
        transactions = WalletTransaction.objects.filter(wallet=wallet)
        
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = WalletTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
