import logging

from celery import shared_task

from domains.orders.repositories import OrderRepository

logger = logging.getLogger(__name__)


@shared_task(bind=True, acks_late=True)
def notify_vendor(self, order_id: int):
    """Notify vendor about a new order (placeholder implementation).

    In production this task would call vendor notification services (push, SMS,
    webhooks) and implement retries, dead-letter handling and idempotence.
    """
    repo = OrderRepository()
    try:
        order = repo.get_with_lines(order_id)
    except Exception as exc:
        logger.exception("Order fetch failed for %s: %s", order_id, exc)
        raise

    # Placeholder: log the notification intent
    logger.info("notify_vendor: order=%s vendor=%s lines=%d", order.id, getattr(order, "vendor_id", None), order.lines.count())
