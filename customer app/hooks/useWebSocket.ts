"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { reconnectDelay, websocketUrl } from "@delivery/shared/websocket";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

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

interface DriverLocationEvent {
  type: "driver_location";
  order_id: string;
  location: {
    latitude: string;
    longitude: string;
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
    created_at: string;
  };
}

type WebSocketEvent = OrderUpdateEvent | DriverLocationEvent | NotificationEvent;

interface UseWebSocketOptions {
  onOrderUpdate?: (orderId: string, data: OrderUpdateEvent["data"]) => void;
  onDriverLocation?: (orderId: string, lat: number, lng: number) => void;
  onNotification?: (notification: NotificationEvent["data"]) => void;
  reconnect?: boolean;
}

export function useOrderTracking(orderId: string, options: UseWebSocketOptions = {}) {
  const { onOrderUpdate, onDriverLocation, reconnect = true } = options;
  
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastUpdate, setLastUpdate] = useState<OrderUpdateEvent["data"] | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const wsUrl = websocketUrl(`/orders/${orderId}/`);
    
    setStatus("connecting");
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setStatus("connected");
      reconnectAttempts.current = 0;
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        
        if (data.type === "order_update") {
          setLastUpdate(data.data);
          onOrderUpdate?.(data.order_id, data.data);
        } else if (data.type === "driver_location") {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);
          onDriverLocation?.(data.order_id, lat, lng);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };
    
    ws.current.onclose = () => {
      setStatus("disconnected");
      
      if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = reconnectDelay(reconnectAttempts.current);
        reconnectAttempts.current++;
        
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
    
    ws.current.onerror = () => {
      setStatus("error");
    };
  }, [orderId, onOrderUpdate, onDriverLocation, reconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    ws.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, lastUpdate, disconnect };
}

export function useCustomerNotifications(options: { onNotification?: (notification: NotificationEvent["data"]) => void } = {}) {
  const { onNotification } = options;
  
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastNotification, setLastNotification] = useState<NotificationEvent["data"] | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const wsUrl = websocketUrl("/notifications/");
    
    setStatus("connecting");
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setStatus("connected");
      reconnectAttempts.current = 0;
    };
    
    ws.current.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        
        if (data.type === "notification") {
          setLastNotification(data.data);
          onNotification?.(data.data);
        } else if (data.type === "order_update") {
          // Also handle order updates as notifications
          const notification = {
            id: `order-${data.order_id}`,
            title: "Order Update",
            message: `Your order status is now: ${data.data.status_display}`,
            type: "order",
            priority: "medium",
            created_at: new Date().toISOString(),
          };
          setLastNotification(notification);
          onNotification?.(notification);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };
    
    ws.current.onclose = () => {
      setStatus("disconnected");
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = reconnectDelay(reconnectAttempts.current);
        reconnectAttempts.current++;
        
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
    
    ws.current.onerror = () => {
      setStatus("error");
    };
  }, [onNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    ws.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { status, lastNotification, disconnect };
}
