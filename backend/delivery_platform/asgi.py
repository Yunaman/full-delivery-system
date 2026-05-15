"""
ASGI config for delivery_platform project.
It exposes the ASGI callable as a module-level variable named ``application``.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_platform.settings')

django_asgi_app = get_asgi_application()

from notifications import routing as notifications_routing
from orders import routing as orders_routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                notifications_routing.websocket_urlpatterns +
                orders_routing.websocket_urlpatterns
            )
        )
    ),
})
