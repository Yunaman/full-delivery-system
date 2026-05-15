from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """
    Custom user manager for the User model with email/phone support.
    """
    
    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        """
        Create and save a regular User with the given email/phone and password.
        """
        if not email and not phone:
            raise ValueError(_('Either email or phone must be set'))
        
        extra_fields.setdefault('is_active', True)
        
        user = self.model(
            email=self.normalize_email(email) if email else None,
            phone=phone,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email=None, phone=None, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email/phone and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email=email, phone=phone, password=password, **extra_fields)
    
    def get_by_natural_key(self, email):
        """
        Get user by email (used by Django's authentication).
        """
        return self.get(email=email)
