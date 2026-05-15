import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model supporting multiple roles and authentication methods.
    """
    
    class Role(models.TextChoices):
        CUSTOMER = 'customer', _('Customer')
        VENDOR = 'vendor', _('Vendor')
        STAFF = 'staff', _('Staff')
        DRIVER = 'driver', _('Driver')
        ADMIN = 'admin', _('Admin')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(
        _('full name'),
        max_length=255,
        blank=True
    )
    
    phone = PhoneNumberField(
        _('phone number'),
        unique=True,
        blank=True,
        null=True
    )
    
    email = models.EmailField(
        _('email address'),
        unique=True,
        blank=True,
        null=True
    )
    
    role = models.CharField(
        _('user role'),
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )
    
    avatar = models.ImageField(
        _('profile picture'),
        upload_to='avatars/',
        blank=True,
        null=True
    )
    
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_('Designates whether this user should be treated as active.')
    )
    
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.')
    )
    
    is_verified = models.BooleanField(
        _('verified'),
        default=False,
        help_text=_('Designates whether the user has verified their email or phone.')
    )
    
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name or self.email or str(self.phone)
    
    def get_full_name(self):
        return self.name
    
    def get_short_name(self):
        return self.name.split()[0] if self.name else ''
    
    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER
    
    @property
    def is_vendor(self):
        return self.role == self.Role.VENDOR
    
    @property
    def is_driver_user(self):
        return self.role == self.Role.DRIVER
    
    @property
    def is_staff_user(self):
        return self.role == self.Role.STAFF
    
    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN or self.is_superuser


class UserAddress(models.Model):
    """
    User's saved addresses for quick checkout.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='addresses'
    )
    
    label = models.CharField(
        _('address label'),
        max_length=50,
        help_text=_('e.g., Home, Work, Office')
    )
    
    address_line1 = models.CharField(_('address line 1'), max_length=255)
    address_line2 = models.CharField(_('address line 2'), max_length=255, blank=True)
    city = models.CharField(_('city'), max_length=100)
    state = models.CharField(_('state/province'), max_length=100)
    postal_code = models.CharField(_('postal code'), max_length=20)
    country = models.CharField(_('country'), max_length=100, default='US')
    
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )
    
    is_default = models.BooleanField(_('default address'), default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('user address')
        verbose_name_plural = _('user addresses')
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.label} - {self.user.name}"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            UserAddress.objects.filter(user=self.user).update(is_default=False)
        super().save(*args, **kwargs)


class UserDevice(models.Model):
    """
    Track user devices for push notifications and security.
    """
    
    class DeviceType(models.TextChoices):
        WEB = 'web', _('Web')
        IOS = 'ios', _('iOS')
        ANDROID = 'android', _('Android')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='devices'
    )
    
    device_type = models.CharField(
        max_length=20,
        choices=DeviceType.choices
    )
    device_token = models.CharField(max_length=255, blank=True)
    device_name = models.CharField(max_length=100, blank=True)
    
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('user device')
        verbose_name_plural = _('user devices')
        unique_together = ['user', 'device_token']
    
    def __str__(self):
        return f"{self.user.name} - {self.device_type}"
