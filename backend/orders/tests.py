from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order, OrderItem
from products.models import Product
from vendors.models import Vendor

User = get_user_model()


class OrderModelTests(TestCase):
    """Test the Order model."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            password='pass123',
            role='customer'
        )
        
        self.vendor_user = User.objects.create_user(
            email='vendor@example.com',
            name='Vendor',
            password='pass123',
            role='vendor'
        )
        
        self.vendor = Vendor.objects.create(
            owner=self.vendor_user,
            shop_name='Test Shop',
            address='123 Test Street',
            city='Test City',
            is_open=True
        )
    
    def test_create_order(self):
        """Test creating an order."""
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Delivery Street',
            subtotal=Decimal('50.00'),
            delivery_fee=Decimal('5.00'),
            tax_amount=Decimal('2.50'),
            total_price=Decimal('57.50'),
            status='pending'
        )
        
        self.assertIsNotNone(order.order_number)
        self.assertTrue(order.order_number.startswith('ORD-'))
        self.assertEqual(order.customer, self.customer)
        self.assertEqual(order.vendor, self.vendor)
        self.assertEqual(order.status, 'pending')
    
    def test_order_can_cancel(self):
        """Test order cancellation eligibility."""
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Delivery Street',
            status='pending'
        )
        
        self.assertTrue(order.can_cancel())
        
        order.status = 'delivered'
        order.save()
        
        self.assertFalse(order.can_cancel())


class OrderAPITests(APITestCase):
    """Test order API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            password='pass123',
            role='customer'
        )
        
        self.vendor_user = User.objects.create_user(
            email='vendor@example.com',
            name='Vendor',
            password='pass123',
            role='vendor'
        )
        
        self.vendor = Vendor.objects.create(
            owner=self.vendor_user,
            shop_name='Test Shop',
            address='123 Test Street',
            city='Test City',
            is_open=True
        )
        
        self.product = Product.objects.create(
            vendor=self.vendor,
            name='Test Product',
            price=Decimal('10.00'),
            stock_quantity=100,
            is_available=True
        )
        
        # Get customer token
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'customer@example.com',
            'password': 'pass123'
        })
        self.customer_token = response.data['access']
        
        # Get vendor token
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'vendor@example.com',
            'password': 'pass123'
        })
        self.vendor_token = response.data['access']
    
    def test_create_order(self):
        """Test creating an order."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        
        payload = {
            'vendor_id': str(self.vendor.id),
            'items': [
                {
                    'product_id': str(self.product.id),
                    'quantity': 2
                }
            ],
            'delivery_address': '456 Delivery Street',
            'delivery_latitude': 40.7128,
            'delivery_longitude': -74.0060,
            'payment_method': 'cash'
        }
        
        response = self.client.post(reverse('order-list'), payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('order_number', response.data)
        self.assertEqual(len(response.data['items']), 1)
    
    def test_update_order_status(self):
        """Test updating order status."""
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Delivery Street',
            status='pending',
            total_price=Decimal('20.00')
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.vendor_token}')
        
        response = self.client.post(
            reverse('order-update-status', kwargs={'pk': order.id}),
            {'status': 'confirmed', 'notes': 'Order confirmed'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'confirmed')
    
    def test_list_orders(self):
        """Test listing orders."""
        Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Delivery Street',
            total_price=Decimal('20.00')
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        
        response = self.client.get(reverse('order-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_cancel_order(self):
        """Test cancelling an order."""
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Delivery Street',
            status='pending',
            total_price=Decimal('20.00')
        )
        
        # Add stock to product
        initial_stock = self.product.stock_quantity
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        
        response = self.client.post(
            reverse('order-cancel', kwargs={'pk': order.id}),
            {'reason': 'Changed my mind'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')


class DataProtectionTests(TestCase):
    """Test data protection against accidental deletion of financial and historical records."""

    def setUp(self):
        """Set up test data."""
        self.customer = User.objects.create_user(
            email='customer_prot@example.com',
            name='Protected Customer',
            password='pass123',
            role='customer'
        )

        self.vendor_user = User.objects.create_user(
            email='vendor_prot@example.com',
            name='Protected Vendor Owner',
            password='pass123',
            role='vendor'
        )

        self.vendor = Vendor.objects.create(
            owner=self.vendor_user,
            shop_name='Protected Shop',
            address='123 Protected Street',
            city='Protected City',
            is_open=True
        )

        self.order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='456 Protected Street',
            subtotal=Decimal('100.00'),
            total_price=Decimal('100.00'),
            status='completed'
        )

    def test_cannot_delete_order_with_payment(self):
        """Verify an order with an associated payment record cannot be deleted."""
        from django.db.models import ProtectedError
        from payments.models import Payment

        Payment.objects.create(
            order=self.order,
            amount=Decimal('100.00'),
            method='card',
            status='completed'
        )

        with self.assertRaises(ProtectedError):
            self.order.delete()

    def test_cannot_delete_customer_or_vendor_with_orders(self):
        """Verify deleting a customer or vendor with order history raises ProtectedError."""
        from django.db.models import ProtectedError

        with self.assertRaises(ProtectedError):
            self.customer.delete()

        with self.assertRaises(ProtectedError):
            self.vendor.delete()

    def test_deactivating_customer_or_vendor_preserves_orders(self):
        """Verify soft deactivation of customer or vendor retains historical order data."""
        self.customer.is_active = False
        self.customer.save()

        self.vendor.is_active = False
        self.vendor.save()

        self.order.refresh_from_db()
        self.assertEqual(self.order.customer, self.customer)
        self.assertEqual(self.order.vendor, self.vendor)
        self.assertEqual(Order.objects.filter(pk=self.order.pk).count(), 1)


class OrderDeletionPolicyAPITests(APITestCase):
    """Test API policy preventing hard deletion of completed or paid orders."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin_del@example.com',
            name='Admin User',
            password='pass123',
            role='admin',
            is_staff=True,
            is_superuser=True
        )

        self.customer = User.objects.create_user(
            email='cust_del@example.com',
            name='Customer User',
            password='pass123',
            role='customer'
        )

        self.vendor_user = User.objects.create_user(
            email='vendor_del@example.com',
            name='Vendor Owner',
            password='pass123',
            role='vendor'
        )

        self.vendor = Vendor.objects.create(
            owner=self.vendor_user,
            shop_name='Deletion Test Shop',
            address='123 Street',
            city='City'
        )

        # Token for Admin
        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'admin_del@example.com',
            'password': 'pass123'
        })
        self.admin_token = resp.data['access']

        # Token for Customer
        resp = self.client.post(reverse('token_obtain_pair'), {
            'email': 'cust_del@example.com',
            'password': 'pass123'
        })
        self.customer_token = resp.data['access']

    def test_admin_cannot_delete_completed_order_via_api(self):
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='Address',
            status='completed',
            total_price=Decimal('50.00')
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.delete(reverse('order-detail', kwargs={'pk': order.id}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Order.objects.filter(id=order.id).exists())

    def test_admin_cannot_delete_paid_order_via_api(self):
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='Address',
            status='pending',
            payment_status='paid',
            total_price=Decimal('50.00')
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.delete(reverse('order-detail', kwargs={'pk': order.id}))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Order.objects.filter(id=order.id).exists())

    def test_customer_forbidden_from_deleting_order(self):
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='Address',
            status='pending'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        response = self.client.delete(reverse('order-detail', kwargs={'pk': order.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_unpaid_pending_order_with_audit_logging(self):
        order = Order.objects.create(
            customer=self.customer,
            vendor=self.vendor,
            delivery_address='Address',
            status='pending',
            payment_status='pending'
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.delete(
            reverse('order-detail', kwargs={'pk': order.id}),
            {'reason': 'Test admin cleanup'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Order.objects.filter(id=order.id).exists())
