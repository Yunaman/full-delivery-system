import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Driver, DriverReview

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Driver)
def log_driver_creation(sender, instance, created, **kwargs):
    """
    Log when a new driver is created.
    """
    if created:
        logger.info(f"New driver registered: {instance.user.name} ({instance.vehicle_type})")


@receiver(post_save, sender=DriverReview)
def update_driver_rating(sender, instance, created, **kwargs):
    """
    Update driver rating when a new review is added.
    """
    if created:
        from django.db.models import Avg
        driver = instance.driver
        avg_rating = DriverReview.objects.filter(driver=driver).aggregate(
            Avg('rating')
        )['rating__avg']
        
        driver.rating = avg_rating or 0
        driver.total_reviews = DriverReview.objects.filter(driver=driver).count()
        driver.save(update_fields=['rating', 'total_reviews'])
        
        logger.info(f"New review added for driver {driver.user.name}: {instance.rating} stars")
