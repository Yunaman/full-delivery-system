"use client";

import { useEffect, useRef, useCallback } from 'react';

interface VendorOrderEvent {
  type: 'VENDOR_NEW_ORDER' | 'ORDER_STATUS_CHANGED' | 'DRIVER_ASSIGNED' |
        'connection_established' | 'vendor_connection_established' | 'status_update_success' | 'driver_assignment_success' |
        'ping' | 'pong' | 'error';
  data?: {
    id: string;
    order_number: string;
    status: string;
    customer: {
      id: number;
      name: string;
      phone: string;
    };
    vendor: {
      id: number;
      shop_name: string;
    };
    driver?: {
      id: number;
      name: string;
    };
    total_price: number;
    delivery_address: string;
    created_at: string;
    items?: any[];
  };
  timestamp?: string;
  message?: string;
  vendor_id?: number;
  order_id?: string;
  driver_id?: number;
}

interface UseVendorOrderSyncOptions {
  vendorId: number;
  onNewOrder?: (order: any) => void;
  onOrderStatusChanged?: (order: any) => void;
  onDriverAssigned?: (order: any, driverId: number) => void;
}

export function useVendorOrderSync(options: UseVendorOrderSyncOptions) {
  const { vendorId, onNewOrder, onOrderStatusChanged, onDriverAssigned } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws'}/orders/vendors/`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ Connected to vendor order sync WebSocket');
        reconnectAttemptsRef.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data: VendorOrderEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'VENDOR_NEW_ORDER':
              console.log('🆕 New order received:', data.data?.order_number);
              if (data.data && data.vendor_id === vendorId) {
                onNewOrder?.(data.data);
              }
              break;
              
            case 'ORDER_STATUS_CHANGED':
              console.log('🔄 Order status changed:', data.data?.order_number);
              if (data.data && data.vendor_id === vendorId) {
                onOrderStatusChanged?.(data.data);
              }
              break;
              
            case 'DRIVER_ASSIGNED':
              console.log('🚗 Driver assigned:', data.data?.order_number);
              if (data.data && data.driver_id) {
                onDriverAssigned?.(data.data, data.driver_id);
              }
              break;
              
            case 'vendor_connection_established':
              console.log('🔗 Vendor order sync connection established');
              console.log(`🏪 Vendor ID: ${data.vendor_id}, Shop: ${data.message}`);
              break;
              
            case 'status_update_success':
              console.log('✅ Order status update successful:', data.order_id);
              break;
              
            case 'driver_assignment_success':
              console.log('✅ Driver assignment successful:', data.order_id);
              break;
              
            case 'ping':
              wsRef.current?.send(JSON.stringify({ type: 'pong' }));
              break;
              
            case 'pong':
              break;
              
            default:
              console.log('📨 Unknown vendor WebSocket message:', data);
          }
        } catch (error) {
          console.error('❌ Error parsing vendor WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 Vendor order sync WebSocket disconnected:', event.code, event.reason);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`🔄 Reconnecting vendor WebSocket in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('❌ Max vendor WebSocket reconnection attempts reached');
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Vendor WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('❌ Failed to create vendor WebSocket connection:', error);
    }
  }, [vendorId, onNewOrder, onOrderStatusChanged, onDriverAssigned]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Vendor WebSocket not connected, cannot send message:', message);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback((orderId: string, status: string, notes?: string) => {
    sendMessage({
      type: 'update_order_status',
      order_id: orderId,
      status: status,
      notes: notes || ''
    });
  }, [sendMessage]);

  // Assign driver to order
  const assignDriver = useCallback((orderId: string, driverId: number) => {
    sendMessage({
      type: 'assign_driver',
      order_id: orderId,
      driver_id: driverId
    });
  }, [sendMessage]);

  // Ping server to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [sendMessage]);

  // Auto-connect when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect,
    reconnect: connect,
    updateOrderStatus,
    assignDriver
  };
}
