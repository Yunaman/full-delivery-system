from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vendors.models import Vendor, VendorReview

User = get_user_model()


class VendorModelTests(TestCase):
    """Test the Vendor model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='vendor@example.com',
            name='Vendor Owner',
            password='pass123',
            role='vendor'
        )
    
    def test_create_vendor(self):
        """Test creating a vendor."""
        vendor = Vendor.objects.create(
            owner=self.user,
            shop_name='Test Shop',
            address='123 Test Street',
            city='Test City',
            state='Test State',
            postal_code='12345',
            phone='1234567890',
            is_open=True,
            delivery_radius=5.00
        )
        
        self.assertEqual(vendor.shop_name, 'Test Shop')
        self.assertEqual(vendor.slug, 'test-shop')
        self.assertEqual(vendor.owner, self.user)
        self.assertTrue(vendor.is_open)
    
    def test_vendor_availability(self):
        """Test vendor availability property."""
        vendor = Vendor.objects.create(
            owner=self.user,
            shop_name='Test Shop',
            address='123 Test Street',
            city='Test City',
            is_open=True,
            is_active=True
        )
        
        self.assertTrue(vendor.is_available_for_orders)
        
        vendor.is_open = False
        vendor.save()
        
        self.assertFalse(vendor.is_available_for_orders)


class VendorAPITests(APITestCase):
    """Test vendor API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.vendor_user = User.objects.create_user(
            email='vendor@example.com',
            name='Vendor Owner',
            password='pass123',
            role='vendor'
        )
        
        self.customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            password='pass123',
            role='customer'
        )
        
        self.vendor = Vendor.objects.create(
            owner=self.vendor_user,
            shop_name='Test Shop',
            address='123 Test Street',
            city='Test City',
            is_open=True,
            is_active=True
        )
        
        # Get vendor user token
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'vendor@example.com',
            'password': 'pass123'
        })
        self.vendor_token = response.data['access']
        
        # Get customer token
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'customer@example.com',
            'password': 'pass123'
        })
        self.customer_token = response.data['access']
    
    def test_list_vendors(self):
        """Test listing vendors."""
        response = self.client.get(reverse('vendor-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_vendor(self):
        """Test creating a vendor."""
        new_vendor = User.objects.create_user(
            email='newvendor@example.com',
            name='New Vendor',
            password='pass123',
            role='vendor'
        )
        
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'newvendor@example.com',
            'password': 'pass123'
        })
        token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        payload = {
            'shop_name': 'New Test Shop',
            'address': '456 New Street',
            'city': 'New City',
            'vendor_type': 'restaurant'
        }
        
        response = self.client.post(reverse('vendor-list'), payload)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['shop_name'], payload['shop_name'])
    
    def test_add_vendor_review(self):
        """Test adding a vendor review."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.customer_token}')
        
        payload = {
            'rating': 5,
            'comment': 'Great service!'
        }
        
        response = self.client.post(
            reverse('vendor-add-review', kwargs={'pk': self.vendor.id}),
            payload
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        
        # Check vendor rating was updated
        self.vendor.refresh_from_db()
        self.assertEqual(float(self.vendor.rating), 5.0)
