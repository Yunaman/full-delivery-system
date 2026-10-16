import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, acks_late=True)
def notify_vendor(self, order_id):
    """Notify vendor about a new order.

    In production this task would call vendor notification services (push, SMS,
    webhooks) and implement retries, dead-letter handling and idempotence.
    """
    from orders.models import Order

    try:
        order = Order.objects.select_related("customer", "vendor").prefetch_related("items").get(pk=order_id)
    except Exception as exc:
        logger.exception("Order fetch failed for %s: %s", order_id, exc)
        raise

    logger.info("notify_vendor: order=%s vendor=%s items=%d", order.id, getattr(order, "vendor_id", None), order.items.count())
