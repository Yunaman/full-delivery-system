from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminUser, IsVendorUser

from orders.models import Order


class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for analytics and reporting.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get dashboard analytics based on user role.
        """
        user = request.user
        
        if user.is_admin_user:
            return self._get_admin_dashboard()
        elif user.is_vendor:
            return self._get_vendor_dashboard(user)
        elif user.is_driver_user:
            return self._get_driver_dashboard(user)
        else:
            return self._get_customer_dashboard(user)
    
    def _get_admin_dashboard(self):
        """Get admin dashboard analytics."""
        today = timezone.now().date()
        
        # Overall statistics
        total_orders = Order.objects.count()
        today_orders = Order.objects.filter(created_at__date=today).count()
        
        total_revenue = Order.objects.filter(
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        today_revenue = Order.objects.filter(
            created_at__date=today,
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Order status breakdown
        status_breakdown = dict(
            Order.objects.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        # User counts
        from accounts.models import User
        total_users = User.objects.count()
        total_customers = User.objects.filter(role='customer').count()
        total_vendors = User.objects.filter(role='vendor').count()
        total_drivers = User.objects.filter(role='driver').count()
        
        # Recent activity
        recent_orders = Order.objects.select_related('customer', 'vendor').order_by('-created_at')[:10]
        
        data = {
            'summary': {
                'total_orders': total_orders,
                'today_orders': today_orders,
                'total_revenue': total_revenue,
                'today_revenue': today_revenue,
                'total_users': total_users,
                'total_customers': total_customers,
                'total_vendors': total_vendors,
                'total_drivers': total_drivers,
            },
            'order_status_breakdown': status_breakdown,
            'recent_orders': [
                {
                    'id': str(o.id),
                    'order_number': o.order_number,
                    'customer': o.customer.name,
                    'vendor': o.vendor.shop_name,
                    'total': o.total_price,
                    'status': o.status,
                    'created_at': o.created_at.isoformat()
                }
                for o in recent_orders
            ]
        }
        
        return Response(data)
    
    def _get_vendor_dashboard(self, user):
        """Get vendor dashboard analytics."""
        from vendors.models import Vendor
        
        try:
            vendor = Vendor.objects.get(owner=user)
        except Vendor.DoesNotExist:
            return Response(
                {"detail": "Vendor profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        # Order statistics
        total_orders = Order.objects.filter(vendor=vendor).count()
        today_orders = Order.objects.filter(
            vendor=vendor,
            created_at__date=today
        ).count()
        
        # Revenue
        total_revenue = Order.objects.filter(
            vendor=vendor,
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        today_revenue = Order.objects.filter(
            vendor=vendor,
            created_at__date=today,
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Customer count
        total_customers = Order.objects.filter(vendor=vendor).values(
            'customer'
        ).distinct().count()
        
        # Average order value
        avg_order = Order.objects.filter(vendor=vendor).aggregate(
            avg=Avg('total_price')
        )['avg'] or 0
        
        # Status breakdown
        status_breakdown = dict(
            Order.objects.filter(vendor=vendor).values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        # Popular products
        from orders.models import OrderItem
        popular_products = OrderItem.objects.filter(
            order__vendor=vendor
        ).values('product__name').annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:5]
        
        # Recent orders
        recent_orders = Order.objects.filter(vendor=vendor).select_related(
            'customer'
        ).order_by('-created_at')[:5]
        
        data = {
            'summary': {
                'total_orders': total_orders,
                'today_orders': today_orders,
                'total_revenue': total_revenue,
                'today_revenue': today_revenue,
                'total_customers': total_customers,
                'average_order_value': avg_order,
                'rating': vendor.rating,
            },
            'order_status_breakdown': status_breakdown,
            'popular_products': list(popular_products),
            'recent_orders': [
                {
                    'id': str(o.id),
                    'order_number': o.order_number,
                    'customer': o.customer.name,
                    'total': o.total_price,
                    'status': o.status,
                    'created_at': o.created_at.isoformat()
                }
                for o in recent_orders
            ]
        }
        
        return Response(data)
    
    def _get_driver_dashboard(self, user):
        """Get driver dashboard analytics."""
        from drivers.models import Driver
        
        try:
            driver = Driver.objects.get(user=user)
        except Driver.DoesNotExist:
            return Response(
                {"detail": "Driver profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        # Delivery statistics
        total_deliveries = driver.total_deliveries
        today_deliveries = Order.objects.filter(
            driver=driver,
            delivered_at__date=today
        ).count()
        
        # Earnings (assuming $5 per delivery)
        total_earnings = total_deliveries * 5
        today_earnings = today_deliveries * 5
        
        # Rating
        rating = driver.rating
        
        # Recent deliveries
        recent_deliveries = Order.objects.filter(
            driver=driver
        ).select_related('customer', 'vendor').order_by('-delivered_at')[:10]
        
        data = {
            'summary': {
                'total_deliveries': total_deliveries,
                'today_deliveries': today_deliveries,
                'total_earnings': total_earnings,
                'today_earnings': today_earnings,
                'rating': rating,
                'balance': driver.balance,
            },
            'recent_deliveries': [
                {
                    'id': str(d.id),
                    'order_number': d.order_number,
                    'customer': d.customer.name,
                    'vendor': d.vendor.shop_name,
                    'status': d.status,
                    'delivered_at': d.delivered_at.isoformat() if d.delivered_at else None
                }
                for d in recent_deliveries
            ]
        }
        
        return Response(data)
    
    def _get_customer_dashboard(self, user):
        """Get customer dashboard analytics."""
        today = timezone.now().date()
        
        # Order statistics
        total_orders = Order.objects.filter(customer=user).count()
        active_orders = Order.objects.filter(
            customer=user,
            status__in=['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit']
        ).count()
        
        # Total spent
        total_spent = Order.objects.filter(
            customer=user,
            status__in=['delivered', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Favorite vendor
        from vendors.models import Vendor
        favorite_vendor = Order.objects.filter(
            customer=user
        ).values('vendor').annotate(
            order_count=Count('id')
        ).order_by('-order_count').first()
        
        favorite_vendor_data = None
        if favorite_vendor:
            try:
                vendor = Vendor.objects.get(id=favorite_vendor['vendor'])
                favorite_vendor_data = {
                    'id': str(vendor.id),
                    'name': vendor.shop_name,
                    'orders': favorite_vendor['order_count']
                }
            except Vendor.DoesNotExist:
                pass
        
        # Recent orders
        recent_orders = Order.objects.filter(customer=user).select_related(
            'vendor'
        ).order_by('-created_at')[:5]
        
        data = {
            'summary': {
                'total_orders': total_orders,
                'active_orders': active_orders,
                'total_spent': total_spent,
                'favorite_vendor': favorite_vendor_data,
            },
            'recent_orders': [
                {
                    'id': str(o.id),
                    'order_number': o.order_number,
                    'vendor': o.vendor.shop_name,
                    'total': o.total_price,
                    'status': o.status,
                    'created_at': o.created_at.isoformat()
                }
                for o in recent_orders
            ]
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """
        Get revenue analytics.
        """
        # Parse date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            start_date = parse_date(start_date)
        if end_date:
            end_date = parse_date(end_date)
        
        if not start_date:
            from datetime import timedelta
            start_date = timezone.now().date() - timedelta(days=30)
        if not end_date:
            end_date = timezone.now().date()
        
        user = request.user
        orders_queryset = Order.objects.filter(created_at__date__range=[start_date, end_date])
        
        if user.is_vendor:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(owner=user)
                orders_queryset = orders_queryset.filter(vendor=vendor)
            except Vendor.DoesNotExist:
                return Response(
                    {"detail": "Vendor profile not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif not user.is_admin_user:
            orders_queryset = orders_queryset.filter(customer=user)
        
        # Daily revenue breakdown
        daily_revenue = list(
            orders_queryset.filter(
                status__in=['delivered', 'completed']
            ).extra(
                select={'date': 'DATE(created_at)'}
            ).values('date').annotate(
                revenue=Sum('total_price'),
                orders=Count('id')
            ).order_by('date')
        )
        
        # Summary
        summary = orders_queryset.filter(
            status__in=['delivered', 'completed']
        ).aggregate(
            total_revenue=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price')
        )
        
        data = {
            'date_range': {
                'start': str(start_date),
                'end': str(end_date)
            },
            'summary': summary,
            'daily_breakdown': daily_revenue
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def users(self, request):
        """
        Get user analytics (admin only).
        """
        from accounts.models import User
        
        # User growth over time
        user_growth = list(
            User.objects.extra(
                select={'date': 'DATE(date_joined)'}
            ).values('date').annotate(
                new_users=Count('id')
            ).order_by('date')[:30]
        )
        
        # User role distribution
        role_distribution = dict(
            User.objects.values('role').annotate(
                count=Count('id')
            ).values_list('role', 'count')
        )
        
        data = {
            'total_users': User.objects.count(),
            'role_distribution': role_distribution,
            'user_growth': user_growth
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsVendorUser])
    def products(self, request):
        """
        Get product analytics for vendor.
        """
        from vendors.models import Vendor
        from orders.models import OrderItem
        from products.models import Product
        
        try:
            vendor = Vendor.objects.get(owner=request.user)
        except Vendor.DoesNotExist:
            return Response(
                {"detail": "Vendor profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Top selling products
        top_products = list(
            OrderItem.objects.filter(
                order__vendor=vendor,
                order__status__in=['delivered', 'completed']
            ).values('product__name').annotate(
                total_sold=Sum('quantity'),
                total_revenue=Sum('total_price')
            ).order_by('-total_sold')[:10]
        )
        
        # Low stock products
        low_stock = Product.objects.filter(
            vendor=vendor,
            stock_quantity__lte=10
        ).values('name', 'stock_quantity')[:10]
        
        data = {
            'top_selling_products': top_products,
            'low_stock_products': list(low_stock)
        }
        
        return Response(data)
