"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function websocketUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function reconnectDelay(attempt: number) {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export type WebSocketMessage = {
  type: string;
  data?: unknown;
  order_id?: string;
  location?: {
    latitude: string;
    longitude: string;
  };
};

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
  orderId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    orderId,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    maxReconnectAttempts = 5,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    return orderId ? websocketUrl(`/orders/${orderId}/`) : websocketUrl("/orders/");
  }, [orderId]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setStatus("connecting");
      const url = getWebSocketUrl();
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setStatus("connected");
        reconnectAttempts.current = 0;
        onConnect?.();
        
        // Subscribe to specific order if provided
        if (orderId) {
          socket.send(JSON.stringify({
            type: "subscribe_order",
            order_id: orderId
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      socket.onclose = () => {
        setStatus("disconnected");
        onDisconnect?.();

        // Attempt reconnection
        if (reconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttempts.current}`);
            connect();
          }, reconnectDelay(reconnectAttempts.current));
        }
      };

      socket.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };

      ws.current = socket;
    } catch (error) {
      setStatus("error");
      console.error("WebSocket connection error:", error);
    }
  }, [getWebSocketUrl, onConnect, onDisconnect, onError, onMessage, orderId, reconnect, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const ping = useCallback(() => {
    return sendMessage({ type: "ping" });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (status !== "connected") return;

    const heartbeat = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(heartbeat);
  }, [status, ping]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    ping,
    isConnected: status === "connected",
  };
}

// Hook specifically for order tracking
export function useOrderTracking(orderId: string, onStatusUpdate?: (status: string, data: unknown) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "order_update" && onStatusUpdate) {
      const data = message.data as { status: string; [key: string]: unknown };
      onStatusUpdate(data.status, data);
    }
  }, [onStatusUpdate]);

  return useWebSocket({
    orderId,
    onMessage: handleMessage,
  });
}

// Hook for driver location updates
export function useDriverLocation(orderId: string, onLocationUpdate?: (lat: number, lng: number) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "driver_location" && onLocationUpdate && message.location) {
      const lat = parseFloat(message.location.latitude);
      const lng = parseFloat(message.location.longitude);
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);

  return useWebSocket({
    orderId,
    onMessage: handleMessage,
  });
}

// Hook for notifications
export function useNotifications(onNotification?: (notification: unknown) => void) {
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === "notification" && onNotification) {
      onNotification(message.data);
    }
  }, [onNotification]);

  return useWebSocket({
    onMessage: handleMessage,
  });
}
