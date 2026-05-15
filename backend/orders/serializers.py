from rest_framework import serializers

from accounts.serializers import UserSerializer
from products.serializers import ProductListSerializer

from .models import Order, OrderItem, OrderStatusHistory, OrderTracking


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderItem model.
    """
    product_details = ProductListSerializer(source='product', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_details', 'variant', 'variant_name',
            'product_name', 'product_image', 'quantity', 'unit_price',
            'total_price', 'special_instructions'
        ]
        read_only_fields = ['id', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    """
    Base serializer for Order model.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

class OrderItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating order items.
    """
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'product_id', 'variant_id', 'quantity', 'special_instructions'
        ]
    
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class OrderTrackingSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderTracking model.
    """
    
    class Meta:
        model = OrderTracking
        fields = [
            'driver_latitude', 'driver_longitude',
            'estimated_arrival', 'distance_remaining', 'last_updated'
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for OrderStatusHistory model.
    """
    changed_by_name = serializers.CharField(source='changed_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    previous_status_display = serializers.CharField(
        source='get_previous_status_display',
        read_only=True
    )
    
    class Meta:
        model = OrderStatusHistory
        fields = [
            'status', 'status_display', 'previous_status', 'previous_status_display',
            'notes', 'changed_by_name', 'created_at'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for order list views.
    """
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_logo = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    driver_name = serializers.CharField(source='driver.user.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(
        source='get_payment_status_display',
        read_only=True
    )
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'vendor_name', 'vendor_logo', 'customer_name',
            'driver_name', 'status', 'status_display', 'payment_status',
            'payment_status_display', 'total_price', 'item_count',
            'delivery_address', 'placed_at', 'estimated_delivery_time'
        ]
    
    def get_vendor_logo(self, obj):
        if obj.vendor.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.vendor.logo.url)
            return obj.vendor.logo.url
        return None
    
    def get_item_count(self, obj):
        return obj.total_items


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Full order serializer with all details.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    driver_name = serializers.CharField(source='driver.user.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(
        source='get_payment_status_display',
        read_only=True
    )
    payment_method_display = serializers.CharField(
        source='get_payment_method_display',
        read_only=True
    )
    tracking = OrderTrackingSerializer(read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'vendor', 'vendor_name',
            'driver', 'driver_name', 'status', 'status_display',
            'payment_status', 'payment_status_display',
            'payment_method', 'payment_method_display',
            'subtotal', 'delivery_fee', 'tax_amount', 'discount_amount',
            'total_price', 'items', 'delivery_address', 'delivery_latitude',
            'delivery_longitude', 'contact_name', 'contact_phone',
            'notes', 'preparation_notes', 'delivery_notes',
            'estimated_preparation_time', 'estimated_delivery_time',
            'placed_at', 'confirmed_at', 'prepared_at', 'picked_up_at',
            'delivered_at', 'completed_at', 'cancelled_at', 'tracking_code',
            'cancellation_reason', 'tracking', 'status_history', 'can_cancel',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'total_price', 'placed_at',
            'created_at', 'updated_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating orders.
    """
    items = OrderItemCreateSerializer(many=True)
    vendor_id = serializers.UUIDField()
    
    class Meta:
        model = Order
        fields = [
            'vendor_id', 'items', 'delivery_address', 'delivery_latitude',
            'delivery_longitude', 'contact_name', 'contact_phone',
            'payment_method', 'notes'
        ]
    
    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("Order must contain at least one item.")
        return value
    
    def validate(self, data):
        from vendors.models import Vendor
        from products.models import Product
        
        # Validate vendor exists and is active
        try:
            vendor = Vendor.objects.get(id=data['vendor_id'])
            if not vendor.is_available_for_orders:
                raise serializers.ValidationError(
                    {"vendor_id": "This vendor is not accepting orders at the moment."}
                )
        except Vendor.DoesNotExist:
            raise serializers.ValidationError({"vendor_id": "Vendor not found."})
        
        # Validate products and calculate subtotal
        subtotal = 0
        for item_data in data['items']:
            try:
                product = Product.objects.get(id=item_data['product_id'])
                
                # Check if product belongs to the vendor
                if product.vendor_id != data['vendor_id']:
                    raise serializers.ValidationError(
                        {"items": f"Product {product.name} does not belong to this vendor."}
                    )
                
                # Check if product is available
                if not product.is_available:
                    raise serializers.ValidationError(
                        {"items": f"Product {product.name} is not available."}
                    )
                
                # Check stock
                if product.stock_quantity < item_data['quantity']:
                    raise serializers.ValidationError(
                        {"items": f"Insufficient stock for {product.name}."}
                    )
                
                # Calculate price
                if item_data.get('variant_id'):
                    from products.models import ProductVariant
                    try:
                        variant = ProductVariant.objects.get(id=item_data['variant_id'])
                        price = variant.final_price
                    except ProductVariant.DoesNotExist:
                        raise serializers.ValidationError(
                            {"items": "Product variant not found."}
                        )
                else:
                    price = product.current_price
                
                subtotal += price * item_data['quantity']
                
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    {"items": f"Product with ID {item_data['product_id']} not found."}
                )
        
        data['calculated_subtotal'] = subtotal
        data['vendor'] = vendor
        
        return data
    
    def create(self, validated_data):
        from products.models import Product, ProductVariant
        
        items_data = validated_data.pop('items')
        vendor = validated_data.pop('vendor')
        validated_data.pop('vendor_id')
        calculated_subtotal = validated_data.pop('calculated_subtotal')
        
        # Calculate order totals
        delivery_fee = vendor.delivery_fee
        tax_rate = vendor.tax_rate
        tax_amount = (calculated_subtotal * tax_rate) / 100
        
        # Create order
        order = Order.objects.create(
            customer=self.context['request'].user,
            vendor=vendor,
            subtotal=calculated_subtotal,
            delivery_fee=delivery_fee,
            tax_amount=tax_amount,
            total_price=calculated_subtotal + delivery_fee + tax_amount,
            **validated_data
        )
        
        # Create order items
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            
            if item_data.get('variant_id'):
                variant = ProductVariant.objects.get(id=item_data['variant_id'])
                unit_price = variant.final_price
            else:
                variant = None
                unit_price = product.current_price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                product_name=product.name,
                product_image=product.image.url if product.image else '',
                quantity=item_data['quantity'],
                unit_price=unit_price,
                special_instructions=item_data.get('special_instructions', '')
            )
            
            # Update product stock
            product.stock_quantity -= item_data['quantity']
            product.total_sales += item_data['quantity']
            product.save()
        
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating order status.
    """
    status = serializers.ChoiceField(choices=Order.Status.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        order = self.context['order']
        
        # Define valid status transitions
        valid_transitions = {
            Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.CANCELLED],
            Order.Status.CONFIRMED: [Order.Status.PREPARING, Order.Status.CANCELLED],
            Order.Status.PREPARING: [Order.Status.READY, Order.Status.CANCELLED],
            Order.Status.READY: [Order.Status.PICKED_UP, Order.Status.CANCELLED],
            Order.Status.PICKED_UP: [Order.Status.IN_TRANSIT, Order.Status.DELIVERED],
            Order.Status.IN_TRANSIT: [Order.Status.DELIVERED],
            Order.Status.DELIVERED: [Order.Status.COMPLETED],
        }
        
        current_status = order.status
        allowed_next = valid_transitions.get(current_status, [])
        
        if value not in allowed_next and not self.context['request'].user.is_admin_user:
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}."
            )
        
        return value


class AssignDriverSerializer(serializers.Serializer):
    """
    Serializer for assigning a driver to an order.
    """
    driver_id = serializers.UUIDField()
    
    def validate_driver_id(self, value):
        from drivers.models import Driver
        try:
            driver = Driver.objects.get(id=value)
            if not driver.is_available:
                raise serializers.ValidationError("Driver is not available.")
            return value
        except Driver.DoesNotExist:
            raise serializers.ValidationError("Driver not found.")


class OrderCancellationSerializer(serializers.Serializer):
    """
    Serializer for order cancellation.
    """
    reason = serializers.CharField(required=True)
    
    def validate(self, data):
        order = self.context['order']
        if not order.can_cancel():
            raise serializers.ValidationError(
                "This order cannot be cancelled at this stage."
            )
        return data
