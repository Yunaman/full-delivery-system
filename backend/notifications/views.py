from django.db.models import Count, Q
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer, PushSubscriptionSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification management.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('recipient')
    
    @swagger_auto_schema(operation_description="List all notifications for current user")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get unread notifications.
        """
        notifications = self.get_queryset().filter(is_read=False)
        
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read.
        """
        from django.utils import timezone
        count = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{count} notifications marked as read'
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a specific notification as read.
        """
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read',
            'notification': self.get_serializer(notification).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get notification statistics.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'read': queryset.filter(is_read=True).count(),
            'by_type': dict(
                queryset.values('type').annotate(
                    count=Count('id')
                ).values_list('type', 'count')
            )
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Clear all notifications.
        """
        count = self.get_queryset().delete()[0]
        
        return Response({
            'message': f'{count} notifications cleared'
        })


class PushSubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for push notification subscription management.
    """
    serializer_class = PushSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PushSubscription.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """
        Subscribe to push notifications.
        """
        # Check if subscription already exists
        endpoint = request.data.get('endpoint')
        if endpoint:
            existing = PushSubscription.objects.filter(
                user=request.user,
                endpoint=endpoint
            ).first()
            
            if existing:
                # Update existing subscription
                existing.p256dh = request.data.get('p256dh', existing.p256dh)
                existing.auth = request.data.get('auth', existing.auth)
                existing.device_info = request.data.get('device_info', existing.device_info)
                existing.is_active = True
                existing.save()
                
                return Response({
                    'message': 'Subscription updated',
                    'subscription': self.get_serializer(existing).data
                })
        
        # Create new subscription
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'message': 'Subscribed successfully',
            'subscription': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def unsubscribe(self, request):
        """
        Unsubscribe from push notifications.
        """
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response(
                {'detail': 'endpoint is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription = PushSubscription.objects.filter(
            user=request.user,
            endpoint=endpoint
        ).first()
        
        if subscription:
            subscription.is_active = False
            subscription.save()
            return Response({'message': 'Unsubscribed successfully'})
        
        return Response(
            {'detail': 'Subscription not found'},
            status=status.HTTP_404_NOT_FOUND
        )
