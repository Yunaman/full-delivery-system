"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { reconnectDelay, websocketUrl } from "@delivery/shared/websocket";

// Django Backend WebSocket Types
interface OrderUpdateEvent {
  type: "order_update";
  order_id: string;
  data: {
    status: string;
    status_display: string;
    previous_status: string;
    notes?: string;
  };
}

interface NotificationEvent {
  type: "notification";
  data: {
    id: string;
    title: string;
    message: string;
    type: string;
    priority: string;
  };
}

interface DriverLocationEvent {
  type: "driver_location";
  order_id: string;
  location: {
    latitude: string;
    longitude: string;
  };
}

type WebSocketEvent = OrderUpdateEvent | NotificationEvent | DriverLocationEvent;

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

// Legacy hook for vendor product sync (migrating to notifications)
interface UseVendorProductSyncOptions {
  vendorId: number;
  onProductCreated?: (product: any) => void;
  onProductUpdated?: (product: any) => void;
  onProductDeleted?: (productId: string) => void;
}

export function useVendorProductSync(options: UseVendorProductSyncOptions) {
  // This is now handled via the notifications WebSocket
  // Keeping for backward compatibility
  const { onProductCreated, onProductUpdated, onProductDeleted } = options;

  const handleNotification = useCallback((notification: any) => {
    if (notification.type === "product_update") {
      const data = notification.data;
      switch (data.action) {
        case "created":
          onProductCreated?.(data.product);
          break;
        case "updated":
          onProductUpdated?.(data.product);
          break;
        case "deleted":
          onProductDeleted?.(data.product_id);
          break;
      }
    }
  }, [onProductCreated, onProductUpdated, onProductDeleted]);

  // Use the main notifications hook
  const { status } = useVendorNotifications(handleNotification);

  return { status };
}

// Hook for vendor notifications
export function useVendorNotifications(onNotification?: (notification: any) => void) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastNotification, setLastNotification] = useState<any>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const wsUrl = websocketUrl("/notifications/");
    
    try {
      setStatus("connecting");
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('✅ Connected to vendor notifications WebSocket');
        setStatus("connected");
        reconnectAttempts.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          
          if (data.type === "notification") {
            console.log('� Vendor notification received:', data.data);
            setLastNotification(data.data);
            onNotification?.(data.data);
          } else if (data.type === "order_update") {
            console.log('📦 Order update:', data.data);
            setLastNotification({
              title: "Order Update",
              message: `Order status changed to ${data.data.status_display}`,
              type: "order",
              data: data.data,
            });
            onNotification?.(data.data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      ws.current.onclose = () => {
        setStatus("disconnected");
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay(reconnectAttempts.current);
          reconnectAttempts.current++;
          
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setStatus("error");
          console.error('❌ Max WebSocket reconnection attempts reached');
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setStatus("error");
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setStatus("error");
    }
  }, [onNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    reconnectAttempts.current = 0;
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, lastNotification, disconnect };
}

// Hook for order tracking
export function useOrderTracking(orderId: string, onStatusUpdate?: (status: string, data: any) => void) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const wsUrl = websocketUrl(`/orders/${orderId}/`);
    
    setStatus("connecting");
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setStatus("connected");
      console.log(`✅ Connected to order ${orderId} WebSocket`);
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "order_update") {
          setLastUpdate(data.data);
          onStatusUpdate?.(data.data.status, data.data);
        } else if (data.type === "driver_location") {
          // Handle driver location updates for this order
          console.log('🚗 Driver location update:', data.location);
        }
      } catch (error) {
        console.error('❌ Error parsing order WebSocket message:', error);
      }
    };
    
    ws.current.onclose = () => {
      setStatus("disconnected");
    };
    
    ws.current.onerror = () => {
      setStatus("error");
    };
  }, [orderId, onStatusUpdate]);

  const disconnect = useCallback(() => {
    ws.current?.close();
    ws.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, lastUpdate, disconnect };
}
