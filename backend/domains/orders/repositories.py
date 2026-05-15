from typing import Any, Optional

from django.db import transaction
from django.shortcuts import get_object_or_404

from orders.models import Order


class OrderRepository:
    """Repository responsible for Order persistence and optimized queries."""

    def save(self, order: Order) -> Order:
        """Persist order to database."""
        with transaction.atomic():
            order.save()
            return order

    def get_by_id(self, order_id: Any) -> Optional[Order]:
        """Fetch order by ID."""
        try:
            return Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return None

    def get_with_details(self, order_id: Any) -> Order:
        """Fetch order with related customer, vendor, and items preloaded."""
        return get_object_or_404(
            Order.objects.select_related("customer", "vendor", "driver")
            .prefetch_related("items", "status_history"),
            pk=order_id
        )

    def list_active_orders(self) -> Any:
        """List all currently active orders."""
        return Order.objects.filter(
            status__in=[
                Order.Status.PENDING,
                Order.Status.CONFIRMED,
                Order.Status.PREPARING,
                Order.Status.READY,
                Order.Status.PICKED_UP,
                Order.Status.IN_TRANSIT,
            ]
        ).select_related("customer", "vendor")
