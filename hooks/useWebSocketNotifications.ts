import { useEffect, useRef, useState } from 'react';

interface NotificationData {
  type: 'ticket' | 'driving-test' | 'driving-lessons';
  action: 'new_request' | 'request_accepted' | 'request_rejected' | 'request_updated';
  data: any;
}

interface UseWebSocketNotificationsProps {
  onNotification?: (notification: NotificationData) => void;
  onTicketUpdate?: () => void;
  onCountUpdate?: () => void;
}

export const useWebSocketNotifications = ({
  onNotification,
  onTicketUpdate,
  onCountUpdate
}: UseWebSocketNotificationsProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      // Usar Server-Sent Events (SSE) que ya está implementado
      const sseUrl = '/api/notifications/stream';

      eventSourceRef.current = new EventSource(sseUrl);

      eventSourceRef.current.onopen = () => {

        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Manejar diferentes tipos de notificaciones
          if (data.type === 'notification') {
            onNotification?.(data);
            onCountUpdate?.();
          } else if (data.type === 'ticket_update' || data.type === 'new_ticket_class') {
            onTicketUpdate?.();
            onCountUpdate?.();
            // También disparar actualización del calendario
            window.dispatchEvent(new CustomEvent('calendarRefresh'));
            localStorage.setItem('calendarNeedsRefresh', 'true');
          } else if (data.type === 'calendar_refresh') {
            // Disparar actualización del calendario
            window.dispatchEvent(new CustomEvent('calendarRefresh'));
            localStorage.setItem('calendarNeedsRefresh', 'true');
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('❌ SSE error:', error);
        setIsConnected(false);
        
        // Solo mostrar error después de varios intentos fallidos
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Unable to connect to server. Please refresh the page.');
        } else {
          setConnectionError(null);
        }
        
        // Intentar reconectar con delay más largo para reducir carga del servidor
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(5000 * Math.pow(2, reconnectAttempts.current), 60000); // Mínimo 5s, máximo 60s

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('❌ Error creating SSE connection:', error);
      setConnectionError('Failed to create connection');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = async (message: any) => {
    try {
      const response = await fetch('/api/notifications/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Failed to send message via SSE:', error);
      return false;
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect: connect
  };
};
