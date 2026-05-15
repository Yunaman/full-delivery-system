import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _


class DailyAnalytics(models.Model):
    """
    Daily aggregated analytics data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    date = models.DateField(unique=True)
    
    # Orders
    total_orders = models.PositiveIntegerField(default=0)
    completed_orders = models.PositiveIntegerField(default=0)
    cancelled_orders = models.PositiveIntegerField(default=0)
    
    # Revenue
    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    
    # Users
    new_customers = models.PositiveIntegerField(default=0)
    new_vendors = models.PositiveIntegerField(default=0)
    new_drivers = models.PositiveIntegerField(default=0)
    
    # Products
    products_sold = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('daily analytics')
        verbose_name_plural = _('daily analytics')
        ordering = ['-date']
    
    def __str__(self):
        return f"Analytics for {self.date}"


class VendorAnalytics(models.Model):
    """
    Per-vendor analytics data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    vendor = models.OneToOneField(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='analytics_data'
    )
    
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    
    total_customers = models.PositiveIntegerField(default=0)
    
    average_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    
    rating_average = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0.0
    )
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('vendor analytics')
        verbose_name_plural = _('vendor analytics')
    
    def __str__(self):
        return f"Analytics for {self.vendor.shop_name}"
