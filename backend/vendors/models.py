import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.permissions import IsVendorUser


class Vendor(models.Model):
    """
    Vendor/Store model for restaurants, shops, pharmacies, etc.
    """
    
    class VendorType(models.TextChoices):
        RESTAURANT = 'restaurant', _('Restaurant')
        GROCERY = 'grocery', _('Grocery')
        PHARMACY = 'pharmacy', _('Pharmacy')
        RETAIL = 'retail', _('Retail')
        BAKERY = 'bakery', _('Bakery')
        CAFE = 'cafe', _('Cafe')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    owner = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='owned_vendors',
        limit_choices_to={'role': 'vendor'},
        verbose_name=_('owner')
    )
    
    shop_name = models.CharField(_('shop name'), max_length=255)
    slug = models.SlugField(_('slug'), max_length=255, unique=True, blank=True)
    
    vendor_type = models.CharField(
        _('vendor type'),
        max_length=20,
        choices=VendorType.choices,
        default=VendorType.RESTAURANT
    )
    
    logo = models.ImageField(
        _('logo'),
        upload_to='vendor_logos/',
        blank=True,
        null=True
    )
    
    cover_image = models.ImageField(
        _('cover image'),
        upload_to='vendor_covers/',
        blank=True,
        null=True
    )
    
    description = models.TextField(_('description'), blank=True)
    
    address = models.TextField(_('address'))
    city = models.CharField(_('city'), max_length=100)
    state = models.CharField(_('state/province'), max_length=100)
    postal_code = models.CharField(_('postal code'), max_length=20)
    country = models.CharField(_('country'), max_length=100, default='US')
    
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    email = models.EmailField(_('email address'), blank=True)
    website = models.URLField(_('website'), blank=True)
    
    is_open = models.BooleanField(_('is open'), default=True)
    is_active = models.BooleanField(_('is active'), default=True)
    is_verified = models.BooleanField(_('is verified'), default=False)
    
    working_hours = models.JSONField(
        _('working hours'),
        default=dict,
        help_text=_('Format: {"monday": {"open": "09:00", "close": "22:00"}, ...}')
    )
    
    delivery_radius = models.DecimalField(
        _('delivery radius (km)'),
        max_digits=5,
        decimal_places=2,
        default=5.00,
        validators=[MinValueValidator(0)]
    )
    
    minimum_order_amount = models.DecimalField(
        _('minimum order amount'),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    delivery_fee = models.DecimalField(
        _('delivery fee'),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    tax_rate = models.DecimalField(
        _('tax rate (%)'),
        max_digits=5,
        decimal_places=2,
        default=0.00
    )
    
    preparation_time = models.PositiveIntegerField(
        _('average preparation time (minutes)'),
        default=30
    )
    
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0
    )
    
    total_reviews = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('vendor')
        verbose_name_plural = _('vendors')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'is_open']),
            models.Index(fields=['vendor_type']),
            models.Index(fields=['city']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return self.shop_name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.shop_name)
        super().save(*args, **kwargs)
    
    @property
    def is_available_for_orders(self):
        """Check if vendor is currently accepting orders."""
        return self.is_active and self.is_open


class VendorStaff(models.Model):
    """
    Staff members associated with a vendor.
    """
    
    class StaffRole(models.TextChoices):
        MANAGER = 'manager', _('Manager')
        CASHIER = 'cashier', _('Cashier')
        CHEF = 'chef', _('Chef')
        DELIVERY_COORDINATOR = 'delivery_coordinator', _('Delivery Coordinator')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='staff_members'
    )
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='staff_positions',
        limit_choices_to={'role': 'staff'}
    )
    
    role = models.CharField(
        max_length=20,
        choices=StaffRole.choices,
        default=StaffRole.OTHER
    )
    
    is_active = models.BooleanField(default=True)
    can_manage_orders = models.BooleanField(default=False)
    can_manage_products = models.BooleanField(default=False)
    can_view_analytics = models.BooleanField(default=False)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('vendor staff')
        verbose_name_plural = _('vendor staff')
        unique_together = ['vendor', 'user']
    
    def __str__(self):
        return f"{self.user.name} - {self.vendor.shop_name} ({self.role})"


class VendorReview(models.Model):
    """
    Customer reviews for vendors.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    
    customer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='vendor_reviews'
    )
    
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )
    
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('vendor review')
        verbose_name_plural = _('vendor reviews')
        ordering = ['-created_at']
        unique_together = ['vendor', 'customer']
    
    def __str__(self):
        return f"{self.customer.name} rated {self.vendor.shop_name}: {self.rating}"
