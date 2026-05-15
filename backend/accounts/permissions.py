from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin_user


class IsVendorUser(permissions.BasePermission):
    """
    Permission to only allow vendor users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_vendor


class IsDriverUser(permissions.BasePermission):
    """
    Permission to only allow driver users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_driver_user


class IsStaffUser(permissions.BasePermission):
    """
    Permission to only allow staff users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff_user


class IsCustomerUser(permissions.BasePermission):
    """
    Permission to only allow customer users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_customer


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admin users.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user:
            return True
        return hasattr(obj, 'user') and obj.user == request.user


class IsVendorOwner(permissions.BasePermission):
    """
    Permission to only allow vendor owners to access their own vendor data.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_vendor or request.user.is_admin_user
        )
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin_user:
            return True
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'vendor'):
            return obj.vendor.owner == request.user
        return False


class ReadOnly(permissions.BasePermission):
    """
    Permission to only allow read-only access.
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permission to only allow users to access their own data or admin.
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_admin_user or obj == request.user


class HasRolePermission(permissions.BasePermission):
    """
    Permission that checks if user has any of the required roles.
    """
    required_roles = []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = request.user.role
        return user_role in self.required_roles or request.user.is_admin_user


class IsVendorOrDriverOrAdmin(HasRolePermission):
    """
    Permission for vendor, driver, or admin access.
    """
    required_roles = ['vendor', 'driver']


class IsVendorStaffOrAdmin(HasRolePermission):
    """
    Permission for vendor, staff, or admin access.
    """
    required_roles = ['vendor', 'staff']
