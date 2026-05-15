from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from domains.orders.services import OrderService
from domains.orders.serializers import OrderSerializer


class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        data = request.data
        items = data.get("items", [])
        total_amount = data.get("total_amount", 0)
        service = OrderService()
        order = service.create_order(request.user, items, total_amount)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
