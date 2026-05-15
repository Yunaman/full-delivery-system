from typing import List, Dict, Any

from django.db import transaction
from core.events import publish_event
from orders.models import Order, OrderItem, OrderStatusHistory
from .repositories import OrderRepository


class OrderService:
    """Thin service layer that contains business orchestration for orders.

    Controllers should call methods here. Keep side-effects (events, tasks)
    emitted after transactional persistence to avoid inconsistencies.
    """

    def __init__(self, repo: OrderRepository = None):
        self.repo = repo or OrderRepository()

    @transaction.atomic
    def create_order(self, customer: Any, vendor_id: Any, items: List[Dict], delivery_address: str, **kwargs) -> Order:
        """Orchestrate order creation."""
        if not items:
            raise ValueError("Order must contain at least one item")

        # Create Order instance
        order = Order(
            customer=customer,
            vendor_id=vendor_id,
            delivery_address=delivery_address,
            status=Order.Status.PENDING,
            **kwargs
        )

        # Initial calculation of subtotal from items
        subtotal = 0
        order_items = []

        for item_data in items:
            unit_price = item_data.get("unit_price", 0)
            quantity = item_data.get("quantity", 1)
            item_total = float(unit_price) * int(quantity)
            subtotal += item_total

            order_items.append(OrderItem(
                order=order,
                product_id=item_data.get("product_id"),
                variant_id=item_data.get("variant_id"),
                product_name=item_data.get("name", "Unknown Product"),
                quantity=quantity,
                unit_price=unit_price,
                total_price=item_total
            ))

        order.subtotal = subtotal
        self.repo.save(order)

        # Bulk create items for performance
        OrderItem.objects.bulk_create(order_items)

        # Emit domain event
        publish_event("order.created", {
            "order_id": str(order.id),
            "customer_id": str(customer.id),
            "vendor_id": str(vendor_id)
        })

        # Enqueue async work
        try:
            from workers.tasks.orders import notify_vendor
            notify_vendor.delay(str(order.id))
        except (ImportError, Exception):
            pass

        return order

    @transaction.atomic
    def update_status(self, order_id: Any, new_status: str, changed_by: Any, notes: str = "") -> Order:
        """Handle order status transitions with history logging."""
        order = self.repo.get_by_id(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found")

        old_status = order.status
        order.status = new_status

        # Log status history
        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            previous_status=old_status,
            changed_by=changed_by,
            notes=notes
        )

        order.save()

        # Trigger real-time updates and events
        publish_event("order.status_updated", {
            "order_id": str(order.id),
            "old_status": old_status,
            "new_status": new_status
        })

        return order
