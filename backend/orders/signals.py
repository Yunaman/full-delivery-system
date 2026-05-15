import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def log_order_creation(sender, instance, created, **kwargs):
    """
    Log when a new order is created.
    """
    if created:
        logger.info(
            f"New order created: #{instance.order_number} "
            f"(Customer: {instance.customer}, Vendor: {instance.vendor})"
        )
    else:
        # Log status changes
        logger.info(
            f"Order #{instance.order_number} updated. "
            f"Current status: {instance.status}"
        )
