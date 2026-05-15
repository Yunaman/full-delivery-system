import pytest
from django.contrib.auth import get_user_model
from domains.orders.services import OrderService
from domains.orders.repositories import OrderRepository
from orders.models import Order
from vendors.models import Vendor

@pytest.mark.django_db
def test_create_order_creates_items():
    User = get_user_model()
    # Use proper factory or create required related objects
    customer = User.objects.create_user(
        name="Customer One",
        email="customer1@example.com",
        password="password123",
        role='customer'
    )

    vendor_owner = User.objects.create_user(
        name="Vendor One",
        email="vendor1@example.com",
        password="password123",
        role='vendor'
    )

    vendor = Vendor.objects.create(
        owner=vendor_owner,
        shop_name="Test Shop",
        slug="test-shop",
        is_active=True
    )

    repo = OrderRepository()
    svc = OrderService(repo=repo)

    items = [
        {
            "name": "Pizza",
            "quantity": 2,
            "unit_price": 10.00,
            "product_id": None # In real test, would be a real product ID
        }
    ]

    order = svc.create_order(
        customer=customer,
        vendor_id=vendor.id,
        items=items,
        delivery_address="123 Street",
        payment_method="cash"
    )

    assert order.id is not None
    assert order.items.count() == 1
    assert order.items.first().quantity == 2
    assert order.subtotal == 20.00
    assert order.status == Order.Status.PENDING
