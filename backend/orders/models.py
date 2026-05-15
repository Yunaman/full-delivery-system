import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Order(models.Model):
    """
    Order model for customer purchases.
    """
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        PREPARING = 'preparing', _('Preparing')
        READY = 'ready', _('Ready for Pickup')
        PICKED_UP = 'picked_up', _('Picked Up')
        IN_TRANSIT = 'in_transit', _('In Transit')
        DELIVERED = 'delivered', _('Delivered')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PAID = 'paid', _('Paid')
        FAILED = 'failed', _('Failed')
        REFUNDED = 'refunded', _('Refunded')
    
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('Cash on Delivery')
        CARD = 'card', _('Credit/Debit Card')
        WALLET = 'wallet', _('Digital Wallet')
        ONLINE = 'online', _('Online Payment')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(_('order number'), max_length=20, unique=True, blank=True)
    
    customer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='orders',
        limit_choices_to={'role': 'customer'},
        verbose_name=_('customer')
    )
    
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name=_('vendor')
    )
    
    driver = models.ForeignKey(
        'drivers.Driver',
        on_delete=models.SET_NULL,
        related_name='orders',
        null=True,
        blank=True,
        verbose_name=_('driver')
    )
    
    status = models.CharField(
        _('order status'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    payment_status = models.CharField(
        _('payment status'),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )
    
    payment_method = models.CharField(
        _('payment method'),
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH
    )
    
    # Pricing
    subtotal = models.DecimalField(
        _('subtotal'),
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    
    delivery_fee = models.DecimalField(
        _('delivery fee'),
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    
    tax_amount = models.DecimalField(
        _('tax amount'),
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    
    discount_amount = models.DecimalField(
        _('discount amount'),
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    
    total_price = models.DecimalField(
        _('total price'),
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    
    # Delivery Details
    delivery_address = models.TextField(_('delivery address'))
    delivery_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    delivery_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    # Contact Information
    contact_name = models.CharField(_('contact name'), max_length=255, blank=True)
    contact_phone = models.CharField(_('contact phone'), max_length=20, blank=True)
    
    # Order Details
    notes = models.TextField(_('order notes'), blank=True)
    preparation_notes = models.TextField(_('preparation notes'), blank=True)
    delivery_notes = models.TextField(_('delivery notes'), blank=True)
    
    # Timing
    estimated_preparation_time = models.PositiveIntegerField(
        _('estimated preparation time (minutes)'),
        default=30
    )
    
    estimated_delivery_time = models.PositiveIntegerField(
        _('estimated delivery time (minutes)'),
        blank=True,
        null=True
    )
    
    placed_at = models.DateTimeField(_('placed at'), auto_now_add=True)
    confirmed_at = models.DateTimeField(_('confirmed at'), blank=True, null=True)
    prepared_at = models.DateTimeField(_('prepared at'), blank=True, null=True)
    picked_up_at = models.DateTimeField(_('picked up at'), blank=True, null=True)
    delivered_at = models.DateTimeField(_('delivered at'), blank=True, null=True)
    completed_at = models.DateTimeField(_('completed at'), blank=True, null=True)
    cancelled_at = models.DateTimeField(_('cancelled at'), blank=True, null=True)
    
    # Tracking
    tracking_code = models.CharField(_('tracking code'), max_length=50, blank=True)
    
    # Cancellation
    cancellation_reason = models.TextField(_('cancellation reason'), blank=True)
    cancelled_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='cancelled_orders',
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('order')
        verbose_name_plural = _('orders')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['driver', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['order_number']),
            models.Index(fields=['vendor', 'created_at']),
            models.Index(fields=['customer', 'created_at']),
        ]
    
    def __str__(self):
        return f"Order #{self.order_number} - {self.customer.name}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        
        # Calculate total price
        self.total_price = (
            self.subtotal +
            self.delivery_fee +
            self.tax_amount -
            self.discount_amount
        )
        
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate a unique order number."""
        import random
        import string
        from datetime import datetime
        
        date_str = datetime.now().strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD-{date_str}-{random_str}"
    
    def can_cancel(self):
        """Check if order can be cancelled."""
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED]
    
    def can_assign_driver(self):
        """Check if driver can be assigned."""
        return self.status in [self.Status.CONFIRMED, self.Status.PREPARING, self.Status.READY]
    
    @property
    def is_active_order(self):
        """Check if order is still active (not completed/cancelled)."""
        return self.status not in [self.Status.COMPLETED, self.Status.CANCELLED, self.Status.REFUNDED]
    
    @property
    def total_items(self):
        """Get total number of items in order."""
        return self.items.aggregate(
            total=models.Sum('quantity')
        )['total'] or 0


class OrderItem(models.Model):
    """
    Individual items within an order.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('order')
    )
    
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        related_name='order_items',
        null=True,
        verbose_name=_('product')
    )
    
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        related_name='order_items',
        null=True,
        blank=True,
        verbose_name=_('variant')
    )
    
    product_name = models.CharField(_('product name'), max_length=255)
    product_image = models.URLField(_('product image'), blank=True)
    
    quantity = models.PositiveIntegerField(
        _('quantity'),
        default=1,
        validators=[MinValueValidator(1)]
    )
    
    unit_price = models.DecimalField(
        _('unit price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    total_price = models.DecimalField(
        _('total price'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    special_instructions = models.TextField(_('special instructions'), blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('order item')
        verbose_name_plural = _('order items')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product_name} x{self.quantity} (Order #{self.order.order_number})"
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """
    History log for order status changes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name=_('order')
    )
    
    status = models.CharField(_('status'), max_length=20, choices=Order.Status.choices)
    previous_status = models.CharField(
        _('previous status'),
        max_length=20,
        choices=Order.Status.choices,
        blank=True
    )
    
    notes = models.TextField(_('notes'), blank=True)
    
    changed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_status_changes'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('order status history')
        verbose_name_plural = _('order status histories')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order #{self.order.order_number}: {self.previous_status} -> {self.status}"


class OrderTracking(models.Model):
    """
    Real-time order tracking information.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='tracking',
        verbose_name=_('order')
    )
    
    driver_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    driver_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    estimated_arrival = models.DateTimeField(blank=True, null=True)
    
    distance_remaining = models.DecimalField(
        _('distance remaining (km)'),
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True
    )
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('order tracking')
        verbose_name_plural = _('order tracking')
    
    def __str__(self):
        return f"Tracking for Order #{self.order.order_number}"
