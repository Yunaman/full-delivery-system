import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Notification)
def log_notification_created(sender, instance, created, **kwargs):
    """
    Log when a notification is created.
    """
    if created:
        logger.info(
            f"Notification created for {instance.recipient.name}: {instance.title}"
        )
