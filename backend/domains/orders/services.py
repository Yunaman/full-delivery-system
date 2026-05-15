from typing import List, Dict

from .repositories import OrderRepository
from .models import Order, OrderLine
from core.events import publish_event


class OrderService:
    """Thin service layer that contains business orchestration for orders.

    Controllers should call methods here. Keep side-effects (events, tasks)
    emitted after transactional persistence to avoid inconsistencies.
    """

    def __init__(self, repo: OrderRepository = None):
        self.repo = repo or OrderRepository()

    def create_order(self, customer, items: List[Dict], total_amount) -> Order:
        # Domain validation (example)
        if not items:
            raise ValueError("Order must contain at least one item")

        order = Order(customer=customer, total_amount=total_amount)
        self.repo.save(order)

        # create order lines (simple example; repository could batch create)
        for it in items:
            OrderLine.objects.create(
                order=order,
                product_name=it.get("name", "unknown"),
                quantity=int(it.get("quantity", 1)),
                unit_price=it.get("unit_price", 0),
            )

        # emit domain event (non-blocking, logged or pushed to event bus)
        publish_event("order.created", {"order_id": order.id, "customer_id": customer.id})

        # enqueue domain async work (e.g. notify vendor)
        try:
            from workers.tasks.orders import notify_vendor

            notify_vendor.delay(order.id)
        except Exception:
            # tasks import may fail in lightweight environments; swallow here but log in real code
            pass

        return order
