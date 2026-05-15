import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Payment(models.Model):
    """
    Payment model for order transactions.
    """
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
        REFUNDED = 'refunded', _('Refunded')
        CANCELLED = 'cancelled', _('Cancelled')
    
    class Method(models.TextChoices):
        CASH = 'cash', _('Cash on Delivery')
        CARD = 'card', _('Credit/Debit Card')
        WALLET = 'wallet', _('Digital Wallet')
        ONLINE = 'online', _('Online Payment')
        BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('order')
    )
    
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    method = models.CharField(
        _('payment method'),
        max_length=20,
        choices=Method.choices,
        default=Method.CASH
    )
    
    status = models.CharField(
        _('payment status'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    transaction_id = models.CharField(
        _('transaction ID'),
        max_length=255,
        blank=True,
        help_text=_('External payment gateway transaction ID')
    )
    
    gateway_response = models.JSONField(
        _('gateway response'),
        default=dict,
        blank=True
    )
    
    paid_at = models.DateTimeField(_('paid at'), blank=True, null=True)
    
    refund_amount = models.DecimalField(
        _('refund amount'),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    refund_reason = models.TextField(_('refund reason'), blank=True)
    
    refunded_at = models.DateTimeField(_('refunded at'), blank=True, null=True)
    
    notes = models.TextField(_('notes'), blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('payment')
        verbose_name_plural = _('payments')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"Payment #{self.id} - Order #{self.order.order_number} - {self.status}"


class Wallet(models.Model):
    """
    User wallet for storing balance.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    
    balance = models.DecimalField(
        _('balance'),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    is_active = models.BooleanField(_('is active'), default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('wallet')
        verbose_name_plural = _('wallets')
    
    def __str__(self):
        return f"Wallet of {self.user.name} - ${self.balance}"


class WalletTransaction(models.Model):
    """
    Wallet transaction history.
    """
    
    class TransactionType(models.TextChoices):
        CREDIT = 'credit', _('Credit')
        DEBIT = 'debit', _('Debit')
        REFUND = 'refund', _('Refund')
        PAYOUT = 'payout', _('Payout')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    description = models.CharField(max_length=255)
    
    reference_id = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('wallet transaction')
        verbose_name_plural = _('wallet transactions')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.wallet.user.name} - {self.transaction_type} ${self.amount}"
