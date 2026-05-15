import logging

from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Notification, PushSubscription

logger = logging.getLogger(__name__)


@shared_task
def send_order_notification(order_id, event_type):
    """
    Send notification for order-related events.
    """
    from orders.models import Order
    
    try:
        order = Order.objects.select_related('customer', 'vendor', 'driver').get(id=order_id)
        
        if event_type == 'order_placed':
            # Notify vendor
            create_notification.delay(
                recipient_id=str(order.vendor.owner.id),
                title='New Order Received',
                message=f'You have a new order #{order.order_number}',
                notification_type='order',
                data={'order_id': str(order_id), 'order_number': order.order_number},
                priority='high'
            )
        
        elif event_type == 'status_confirmed':
            # Notify customer
            create_notification.delay(
                recipient_id=str(order.customer.id),
                title='Order Confirmed',
                message=f'Your order #{order.order_number} has been confirmed',
                notification_type='order',
                data={'order_id': str(order_id), 'status': 'confirmed'}
            )
        
        elif event_type == 'status_ready':
            create_notification.delay(
                recipient_id=str(order.customer.id),
                title='Order Ready',
                message=f'Your order #{order.order_number} is ready for pickup',
                notification_type='delivery',
                data={'order_id': str(order_id), 'status': 'ready'}
            )
        
        elif event_type == 'driver_assigned':
            # Notify customer
            if order.driver:
                create_notification.delay(
                    recipient_id=str(order.customer.id),
                    title='Driver Assigned',
                    message=f'{order.driver.user.name} is on the way with your order',
                    notification_type='delivery',
                    data={
                        'order_id': str(order_id),
                        'driver_name': order.driver.user.name,
                        'driver_phone': str(order.driver.user.phone) if order.driver.user.phone else None
                    }
                )
        
        elif event_type == 'status_delivered':
            # Notify customer
            create_notification.delay(
                recipient_id=str(order.customer.id),
                title='Order Delivered',
                message=f'Your order #{order.order_number} has been delivered',
                notification_type='order',
                data={'order_id': str(order_id), 'status': 'delivered'}
            )
        
        elif event_type == 'order_cancelled':
            # Notify all parties
            create_notification.delay(
                recipient_id=str(order.customer.id),
                title='Order Cancelled',
                message=f'Your order #{order.order_number} has been cancelled',
                notification_type='order',
                data={'order_id': str(order_id), 'status': 'cancelled'},
                priority='high'
            )
            
            create_notification.delay(
                recipient_id=str(order.vendor.owner.id),
                title='Order Cancelled',
                message=f'Order #{order.order_number} has been cancelled',
                notification_type='order',
                data={'order_id': str(order_id), 'status': 'cancelled'}
            )
    
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for notification")


@shared_task
def create_notification(recipient_id, title, message, notification_type='system',
                        data=None, priority='medium', action_url=''):
    """
    Create a notification for a user.
    """
    from accounts.models import User
    
    try:
        recipient = User.objects.get(id=recipient_id)
        
        notification = Notification.objects.create(
            recipient=recipient,
            type=notification_type,
            title=title,
            message=message,
            data=data or {},
            priority=priority,
            action_url=action_url
        )
        
        # Send real-time notification via WebSocket
        send_realtime_notification.delay(recipient_id, {
            'id': str(notification.id),
            'type': notification_type,
            'title': title,
            'message': message,
            'data': data,
            'priority': priority,
            'created_at': notification.created_at.isoformat()
        })
        
        # Send push notification
        send_push_notification.delay(recipient_id, title, message, data)
        
        logger.info(f"Notification created for {recipient.name}: {title}")
        
    except User.DoesNotExist:
        logger.error(f"User {recipient_id} not found for notification")


@shared_task
def send_realtime_notification(user_id, data):
    """
    Send real-time notification via WebSocket.
    """
    channel_layer = get_channel_layer()
    
    try:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}_notifications",
            {
                'type': 'notification',
                'data': data
            }
        )
        logger.info(f"Real-time notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Failed to send real-time notification: {str(e)}")


@shared_task
def send_push_notification(user_id, title, message, data=None):
    """
    Send push notification to user's devices.
    """
    subscriptions = PushSubscription.objects.filter(
        user_id=user_id,
        is_active=True
    )
    
    if not subscriptions.exists():
        return
    
    # Here you would integrate with a push notification service
    # like Firebase Cloud Messaging or Web Push
    # For now, we'll just log it
    logger.info(f"Push notification would be sent to {subscriptions.count()} devices: {title}")


@shared_task
def send_bulk_notification(user_ids, title, message, notification_type='system'):
    """
    Send notification to multiple users.
    """
    for user_id in user_ids:
        create_notification.delay(
            recipient_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type
        )


@shared_task
def cleanup_old_notifications(days=30):
    """
    Delete notifications older than specified days.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=days)
    deleted_count = Notification.objects.filter(
        created_at__lt=cutoff_date,
        is_read=True
    ).delete()[0]
    
    logger.info(f"Deleted {deleted_count} old notifications")
    return deleted_count
