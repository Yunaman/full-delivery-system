import pytest


@pytest.mark.django_db
def test_create_order_creates_lines(db):
    # Import inside the test to avoid touching Django settings at import-time
    from django.contrib.auth import get_user_model
    from domains.orders.services import OrderService

    User = get_user_model()
    user = User.objects.create_user(username="u1", email="u1@example.com", password="pass")
    svc = OrderService()
    items = [{"name": "Pizza", "quantity": 1, "unit_price": "9.99"}]
    order = svc.create_order(user, items, total_amount="9.99")
    assert order.id is not None
    assert order.lines.count() == 1
