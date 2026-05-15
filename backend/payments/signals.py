import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Payment, Wallet

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Payment)
def log_payment_update(sender, instance, created, **kwargs):
    """
    Log payment status changes.
    """
    if created:
        logger.info(
            f"New payment created: #{instance.id} for Order #{instance.order.order_number}"
        )
    else:
        logger.info(
            f"Payment #{instance.id} updated. Status: {instance.status}"
        )


@receiver(post_save, sender=Wallet)
def log_wallet_creation(sender, instance, created, **kwargs):
    """
    Log wallet creation.
    """
    if created:
        logger.info(f"New wallet created for user: {instance.user.name}")
