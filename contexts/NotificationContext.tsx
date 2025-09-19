"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationData {
  type: 'ticket' | 'driving-test' | 'driving-lessons';
  action: 'new_request' | 'request_accepted' | 'request_rejected' | 'request_updated';
  data: {
    timestamp?: string | number;
    [key: string]: unknown;
  };
}

interface NotificationContextType {
  notifications: NotificationData[];
  isConnected: boolean;
  connectionError: string | null;
  refreshNotifications: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Variable global para evitar múltiples conexiones
let globalEventSource: EventSource | null = null;
let connectionCount = 0;

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const refreshNotifications = () => {
    console.log('🔄 Triggering global notification refresh...');
    // Disparar evento para que los componentes se actualicen
    window.dispatchEvent(new CustomEvent('notificationRefresh'));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Conectar SSE solo en el cliente - UNA SOLA CONEXIÓN
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    // Si ya hay una conexión global activa, no crear otra
    if (globalEventSource && globalEventSource.readyState === EventSource.OPEN) {
      console.log('🔗 Using existing SSE connection');
      setIsConnected(true);
      return;
    }

    connectionCount++;
    const currentConnection = connectionCount;

    console.log(`� Creating SSE connection #${currentConnection}`);

    try {
      globalEventSource = new EventSource('/api/notifications/stream');

      globalEventSource.onopen = () => {
        console.log(`✅ SSE connected #${currentConnection}`);
        setIsConnected(true);
      };

      globalEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE message received:', data);
          
          // Solo disparar eventos para notificaciones reales, no para conexión o ping
          if (data.type !== 'connection' && data.type !== 'ping') {
            window.dispatchEvent(new CustomEvent('notificationRefresh', { detail: data }));
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      globalEventSource.onerror = (error) => {
        console.error(`❌ SSE error #${currentConnection}:`, error);
        setIsConnected(false);
        
        // Solo reconectar si esta es la conexión actual
        if (currentConnection === connectionCount) {
          globalEventSource?.close();
          globalEventSource = null;
          
          // Reconectar después de 5 segundos (no 1 segundo para evitar spam)
          setTimeout(() => {
            if (currentConnection === connectionCount) {
              console.log(`🔄 Reconnecting SSE #${currentConnection}`);
              setIsConnected(false);
            }
          }, 5000);
        }
      };

    } catch (error) {
      console.error('❌ Error creating SSE connection:', error);
    }

    // Cleanup cuando el componente se desmonta
    return () => {
      console.log(`🧹 Cleaning up SSE connection #${currentConnection}`);
      if (currentConnection === connectionCount && globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
      }
    };
  }, []);

  // Limpiar notificaciones antiguas cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return prev.filter((notification: NotificationData) => {
          const notificationTime = new Date(notification.data?.timestamp || 0);
          return notificationTime > fiveMinutesAgo;
        });
      });
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    isConnected,
    connectionError: null,
    refreshNotifications,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
