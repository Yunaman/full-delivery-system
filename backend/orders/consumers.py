import json
import logging
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

class OrderConsumer(AsyncWebsocketConsumer):
    """
    Production-grade WebSocket consumer for real-time order updates.
    Includes robust error handling and authentication checks.
    """
    
    async def connect(self):
        self.user = self.scope.get('user')

        # 1. Authentication Check
        if not self.user or not self.user.is_authenticated:
            logger.warning("Unauthenticated WebSocket connection attempt.")
            await self.close(code=4003) # Forbidden
            return

        self.order_id = self.scope['url_route']['kwargs'].get('order_id')
        
        if self.order_id:
            # 2. Specific Order Access Check
            has_access = await self.check_order_access(self.order_id)
            if not has_access:
                logger.warning(f"User {self.user.id} denied access to order {self.order_id}")
                await self.close(code=4003)
                return
            
            self.room_group_name = f"order_{self.order_id}"
        else:
            # 3. General User Group for all their order updates
            self.room_group_name = f"user_{self.user.id}_orders"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {self.user.id} connected to {self.room_group_name}")
        
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'status': 'connected',
            'room': self.room_group_name
        }))
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.id} disconnected from {self.room_group_name} (Code: {close_code})")
    
    async def receive(self, text_data):
        """
        Handle incoming messages with heartbeat (ping/pong) and subscription logic.
        """
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')
            
            # Heartbeat mechanism
            if msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
                return

            if msg_type == 'subscribe_order':
                order_id = data.get('order_id')
                if order_id and await self.check_order_access(order_id):
                    new_group = f"order_{order_id}"
                    await self.channel_layer.group_add(new_group, self.channel_name)
                    await self.send(text_data=json.dumps({
                        'type': 'subscribed',
                        'order_id': order_id
                    }))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Malformed JSON'
            }))
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def order_update(self, event):
        """Broadcast order updates to the client."""
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order_id': event.get('order_id'),
            'data': event.get('data')
        }))
    
    async def driver_location_update(self, event):
        """Broadcast driver location updates to the client."""
        await self.send(text_data=json.dumps({
            'type': 'driver_location',
            'order_id': event.get('order_id'),
            'location': event.get('location')
        }))
    
    @database_sync_to_async
    def check_order_access(self, order_id):
        from orders.models import Order
        try:
            order = Order.objects.get(id=order_id)
            if order.customer == self.user: return True
            if order.vendor.owner == self.user: return True
            if order.driver and order.driver.user == self.user: return True
            if self.user.is_staff: return True
            return False
        except Order.DoesNotExist:
            return False

async def broadcast_order_update(order_id, data):
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"order_{order_id}",
        {
            'type': 'order_update',
            'order_id': str(order_id),
            'data': data
        }
    )
