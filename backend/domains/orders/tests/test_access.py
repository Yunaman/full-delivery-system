import pytest
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from api.v1.endpoints.orders import OrderViewSet
from orders.models import Order
from vendors.models import Vendor
from drivers.models import Driver

@pytest.mark.django_db
class TestOrderAccessControl:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.User = get_user_model()

        # Create Users
        self.customer1 = self.User.objects.create_user(name="C1", email="c1@ex.com", role='customer')
        self.customer2 = self.User.objects.create_user(name="C2", email="c2@ex.com", role='customer')
        self.vendor_owner = self.User.objects.create_user(name="V1", email="v1@ex.com", role='vendor')
        self.driver_user = self.User.objects.create_user(name="D1", email="d1@ex.com", role='driver')

        # Create Vendor
        self.vendor = Vendor.objects.create(owner=self.vendor_owner, shop_name="VShop", slug="vshop")

        # Create Driver
        self.driver = Driver.objects.create(user=self.driver_user)

        # Create Order
        self.order = Order.objects.create(
            customer=self.customer1,
            vendor=self.vendor,
            delivery_address="Addr 1",
            status=Order.Status.PENDING
        )

    def test_customer_can_view_own_order(self):
        view = OrderViewSet.as_view({'get': 'retrieve'})
        request = self.factory.get(f'/api/v1/orders/{self.order.id}/')
        force_authenticate(request, user=self.customer1)
        response = view(request, pk=self.order.id)
        assert response.status_code == status.HTTP_200_OK

    def test_customer_cannot_view_others_order(self):
        view = OrderViewSet.as_view({'get': 'retrieve'})
        request = self.factory.get(f'/api/v1/orders/{self.order.id}/')
        force_authenticate(request, user=self.customer2)
        response = view(request, pk=self.order.id)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_vendor_can_view_own_shop_order(self):
        view = OrderViewSet.as_view({'get': 'retrieve'})
        request = self.factory.get(f'/api/v1/orders/{self.order.id}/')
        force_authenticate(request, user=self.vendor_owner)
        response = view(request, pk=self.order.id)
        assert response.status_code == status.HTTP_200_OK

    def test_driver_can_view_assigned_order(self):
        self.order.driver = self.driver
        self.order.save()

        view = OrderViewSet.as_view({'get': 'retrieve'})
        request = self.factory.get(f'/api/v1/orders/{self.order.id}/')
        force_authenticate(request, user=self.driver_user)
        response = view(request, pk=self.order.id)
        assert response.status_code == status.HTTP_200_OK

    def test_driver_cannot_view_unassigned_order(self):
        view = OrderViewSet.as_view({'get': 'retrieve'})
        request = self.factory.get(f'/api/v1/orders/{self.order.id}/')
        force_authenticate(request, user=self.driver_user)
        response = view(request, pk=self.order.id)
        assert response.status_code == status.HTTP_403_FORBIDDEN
