import logging

from celery import shared_task

from orders.models import Order

logger = logging.getLogger(__name__)


@shared_task(bind=True, acks_late=True)
def notify_vendor(self, order_id: int):
    """Notify vendor about a new order (placeholder implementation).

    In production this task would call vendor notification services (push, SMS,
    webhooks) and implement retries, dead-letter handling and idempotence.
    """
    try:
        order = Order.objects.select_related('vendor__owner').get(id=order_id)
    except Exception as exc:
        logger.exception("Order fetch failed for %s: %s", order_id, exc)
        raise

    # Placeholder: log the notification intent
    logger.info("notify_vendor: order=%s vendor=%s", order.id, order.vendor_id)
