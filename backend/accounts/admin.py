from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserAddress, UserDevice


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User Admin with role-based display.
    """
    list_display = [
        'email', 'name', 'phone', 'role', 'is_active', 
        'is_verified', 'date_joined'
    ]
    list_filter = ['role', 'is_active', 'is_verified', 'date_joined']
    search_fields = ['email', 'name', 'phone']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('name', 'phone', 'avatar')}),
        (_('Permissions'), {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'phone', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    """
    Admin for User Address model.
    """
    list_display = ['user', 'label', 'city', 'state', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['user__name', 'user__email', 'label', 'city']
    raw_id_fields = ['user']


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    """
    Admin for User Device model.
    """
    list_display = ['user', 'device_type', 'device_name', 'is_active', 'last_used_at']
    list_filter = ['device_type', 'is_active', 'created_at']
    search_fields = ['user__name', 'user__email', 'device_name']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'last_used_at']
