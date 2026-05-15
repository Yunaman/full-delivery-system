import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Vendor, VendorReview

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Vendor)
def log_vendor_creation(sender, instance, created, **kwargs):
    """
    Log when a new vendor is created.
    """
    if created:
        logger.info(f"New vendor created: {instance.shop_name} (Owner: {instance.owner})")


@receiver(post_save, sender=VendorReview)
def update_vendor_rating(sender, instance, created, **kwargs):
    """
    Update vendor rating when a new review is added.
    """
    if created:
        from django.db.models import Avg
        vendor = instance.vendor
        avg_rating = VendorReview.objects.filter(vendor=vendor).aggregate(
            Avg('rating')
        )['rating__avg']
        
        vendor.rating = avg_rating or 0
        vendor.total_reviews = VendorReview.objects.filter(vendor=vendor).count()
        vendor.save(update_fields=['rating', 'total_reviews'])
        
        logger.info(f"New review added for {vendor.shop_name}: {instance.rating} stars")
