import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer


class OrderConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time order updates.
    """
    
    async def connect(self):
        self.user = self.scope['user']
        
        if not self.user.is_authenticated:
            await self.close()
            return

        self.order_id = self.scope['url_route']['kwargs'].get('order_id')

        # Verify user has access to this order
        if self.order_id:
            has_access = await self.check_order_access(self.order_id)
            if not has_access:
                await self.close()
                return
            
            self.room_group_name = f"order_{self.order_id}"
        else:
            # General order updates for the user
            self.room_group_name = f"user_{self.user.id}_orders"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to order updates'
        }))
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
            
            elif message_type == 'subscribe_order':
                order_id = data.get('order_id')
                if order_id:
                    has_access = await self.check_order_access(order_id)
                    if has_access:
                        new_group = f"order_{order_id}"
                        await self.channel_layer.group_add(
                            new_group,
                            self.channel_name
                        )
                        await self.send(text_data=json.dumps({
                            'type': 'subscribed',
                            'order_id': order_id
                        }))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    async def order_update(self, event):
        """
        Receive order update from room group.
        """
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order_id': event.get('order_id'),
            'data': event.get('data')
        }))
    
    async def driver_location_update(self, event):
        """
        Receive driver location update from room group.
        """
        await self.send(text_data=json.dumps({
            'type': 'driver_location',
            'order_id': event.get('order_id'),
            'location': event.get('location')
        }))
    
    @database_sync_to_async
    def check_order_access(self, order_id):
        """
        Check if user has access to the order.
        """
        from .models import Order
        try:
            order = Order.objects.get(id=order_id)
            
            # User is the customer
            if order.customer == self.user:
                return True
            
            # User is the vendor owner
            if order.vendor.owner == self.user:
                return True
            
            # User is the assigned driver
            from drivers.models import Driver
            try:
                driver = Driver.objects.get(user=self.user)
                if order.driver == driver:
                    return True
            except Driver.DoesNotExist:
                pass
            
            # User is admin
            if self.user.is_admin_user:
                return True
            
            return False
        except Order.DoesNotExist:
            return False


async def broadcast_order_update(order_id, data):
    """
    Broadcast order update to all connected clients.
    """
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"order_{order_id}",
        {
            'type': 'order_update',
            'order_id': str(order_id),
            'data': data
        }
    )


async def broadcast_driver_location(order_id, location):
    """
    Broadcast driver location update.
    """
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"order_{order_id}",
        {
            'type': 'driver_location_update',
            'order_id': str(order_id),
            'location': location
        }
    )
