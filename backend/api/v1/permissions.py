from rest_framework import permissions

class IsOrderParticipant(permissions.BasePermission):
    """
    Permission to allow only the customer, vendor owner, or assigned driver
    to access an order.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff:
            return True

        # Check roles
        if user.role == 'customer' and obj.customer == user:
            return True
        if user.role == 'vendor' and obj.vendor.owner == user:
            return True
        if user.role == 'driver' and obj.driver and obj.driver.user == user:
            return True

        return False

class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'

class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'vendor'

class IsDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'driver'
