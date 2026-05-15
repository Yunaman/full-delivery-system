from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class UserModelTests(TestCase):
    """Test the User model."""
    
    def test_create_user_with_email(self):
        """Test creating a user with email is successful."""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            role='customer'
        )
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test User')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_user_with_phone(self):
        """Test creating a user with phone number."""
        user = User.objects.create_user(
            phone='+1234567890',
            name='Test User',
            password='testpass123'
        )
        
        self.assertEqual(str(user.phone), '+1234567890')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin',
            password='admin123'
        )
        
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.role, 'admin')
    
    def test_user_role_properties(self):
        """Test user role helper properties."""
        customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            password='pass123',
            role='customer'
        )
        vendor = User.objects.create_user(
            email='vendor@example.com',
            name='Vendor',
            password='pass123',
            role='vendor'
        )
        driver = User.objects.create_user(
            email='driver@example.com',
            name='Driver',
            password='pass123',
            role='driver'
        )
        
        self.assertTrue(customer.is_customer)
        self.assertFalse(customer.is_vendor)
        
        self.assertTrue(vendor.is_vendor)
        self.assertFalse(vendor.is_customer)
        
        self.assertTrue(driver.is_driver_user)
        self.assertFalse(driver.is_vendor)


class AuthenticationAPITests(APITestCase):
    """Test authentication API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            role='customer'
        )
    
    def test_user_registration(self):
        """Test user registration endpoint."""
        payload = {
            'email': 'newuser@example.com',
            'name': 'New User',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'role': 'customer'
        }
        
        response = self.client.post(reverse('register'), payload)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], payload['email'])
    
    def test_user_login(self):
        """Test user login endpoint."""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(reverse('token_obtain_pair'), payload)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        payload = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(reverse('token_obtain_pair'), payload)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserAddressTests(APITestCase):
    """Test user address management."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123',
            role='customer'
        )
        
        # Get access token
        response = self.client.post(reverse('token_obtain_pair'), {
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        self.access_token = response.data['access']
    
    def test_create_address(self):
        """Test creating a user address."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        payload = {
            'label': 'Home',
            'address_line1': '123 Test Street',
            'city': 'Test City',
            'state': 'Test State',
            'postal_code': '12345',
            'country': 'US',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'is_default': True
        }
        
        response = self.client.post(reverse('address-list'), payload)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['label'], payload['label'])
        self.assertEqual(response.data['city'], payload['city'])


class PermissionTests(APITestCase):
    """Test custom permission classes."""
    
    def test_is_admin_permission(self):
        """Test admin permission."""
        from accounts.permissions import IsAdminUser
        
        admin = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin',
            password='admin123'
        )
        
        customer = User.objects.create_user(
            email='customer@example.com',
            name='Customer',
            password='pass123',
            role='customer'
        )
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        permission = IsAdminUser()
        
        self.assertTrue(permission.has_permission(MockRequest(admin), None))
        self.assertFalse(permission.has_permission(MockRequest(customer), None))
