from typing import Any

from django.db import transaction

from .models import Order


class OrderRepository:
    """Repository responsible for Order persistence and optimized queries."""

    def save(self, order: Order) -> None:
        with transaction.atomic():
            order.save()

    def get_with_lines(self, order_id: int) -> Order:
        return Order.objects.select_related("customer").prefetch_related("lines").get(pk=order_id)
