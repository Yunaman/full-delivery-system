import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Driver(models.Model):
    """
    Driver/Delivery rider model.
    """
    
    class VehicleType(models.TextChoices):
        BICYCLE = 'bicycle', _('Bicycle')
        MOTORCYCLE = 'motorcycle', _('Motorcycle')
        CAR = 'car', _('Car')
        VAN = 'van', _('Van')
        TRUCK = 'truck', _('Truck')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='driver_profile',
        limit_choices_to={'role': 'driver'},
        verbose_name=_('user')
    )
    
    vehicle_type = models.CharField(
        _('vehicle type'),
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.MOTORCYCLE
    )
    
    vehicle_number = models.CharField(_('vehicle number'), max_length=50, blank=True)
    vehicle_model = models.CharField(_('vehicle model'), max_length=100, blank=True)
    vehicle_color = models.CharField(_('vehicle color'), max_length=50, blank=True)
    
    license_number = models.CharField(_('license number'), max_length=50, blank=True)
    license_expiry = models.DateField(_('license expiry'), blank=True, null=True)
    
    is_available = models.BooleanField(_('is available'), default=True)
    is_active = models.BooleanField(_('is active'), default=True)
    is_verified = models.BooleanField(_('is verified'), default=False)
    
    current_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    current_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    location_updated_at = models.DateTimeField(blank=True, null=True)
    
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0
    )
    
    total_reviews = models.PositiveIntegerField(default=0)
    total_deliveries = models.PositiveIntegerField(default=0)
    
    balance = models.DecimalField(
        _('balance'),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('driver')
        verbose_name_plural = _('drivers')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_available', 'is_active']),
            models.Index(fields=['rating']),
        ]
    
    def __str__(self):
        return f"{self.user.name} - {self.vehicle_type}"
    
    @property
    def current_location(self):
        """Return current location as a dict."""
        if self.current_latitude and self.current_longitude:
            return {
                'latitude': str(self.current_latitude),
                'longitude': str(self.current_longitude),
                'updated_at': self.location_updated_at.isoformat() if self.location_updated_at else None
            }
        return None
    
    def update_location(self, latitude, longitude):
        """Update driver's current location."""
        from django.utils import timezone
        self.current_latitude = latitude
        self.current_longitude = longitude
        self.location_updated_at = timezone.now()
        self.save(update_fields=['current_latitude', 'current_longitude', 'location_updated_at'])


class DriverDocument(models.Model):
    """
    Driver documents (license, insurance, etc.)
    """
    
    class DocumentType(models.TextChoices):
        LICENSE = 'license', _('Driver License')
        INSURANCE = 'insurance', _('Vehicle Insurance')
        REGISTRATION = 'registration', _('Vehicle Registration')
        IDENTITY = 'identity', _('Identity Document')
        OTHER = 'other', _('Other')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices
    )
    
    document_number = models.CharField(max_length=100, blank=True)
    
    file = models.FileField(upload_to='driver_documents/')
    
    is_verified = models.BooleanField(default=False)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('driver document')
        verbose_name_plural = _('driver documents')
    
    def __str__(self):
        return f"{self.driver.user.name} - {self.document_type}"


class DriverReview(models.Model):
    """
    Customer reviews for drivers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    
    customer = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='driver_reviews'
    )
    
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='driver_reviews'
    )
    
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )
    
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('driver review')
        verbose_name_plural = _('driver reviews')
        ordering = ['-created_at']
        unique_together = ['driver', 'order']
    
    def __str__(self):
        return f"{self.customer.name} rated {self.driver.user.name}: {self.rating}"


class DriverPayout(models.Model):
    """
    Driver payout records.
    """
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        COMPLETED = 'completed', _('Completed')
        FAILED = 'failed', _('Failed')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    driver = models.ForeignKey(
        Driver,
        on_delete=models.CASCADE,
        related_name='payouts'
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    method = models.CharField(_('payout method'), max_length=50)
    
    reference = models.CharField(_('reference'), max_length=100, blank=True)
    
    processed_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('driver payout')
        verbose_name_plural = _('driver payouts')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.driver.user.name} - ${self.amount} ({self.status})"
