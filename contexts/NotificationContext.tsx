"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';

interface NotificationData {
  type: 'ticket' | 'driving-test' | 'driving-lessons';
  action: 'new_request' | 'request_accepted' | 'request_rejected' | 'request_updated';
  data: any;
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

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const refreshNotifications = () => {
    // Disparar evento para que los componentes se actualicen
    window.dispatchEvent(new CustomEvent('notificationRefresh'));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // WebSocket para notificaciones globales
  const { isConnected: wsConnected, connectionError: wsError } = useWebSocketNotifications({
    onNotification: (notification) => {
      console.log('🔔 Global notification received:', notification);
      setNotifications(prev => [...prev, notification]);
      refreshNotifications();
    },
    onTicketUpdate: () => {
      console.log('🎫 Global ticket update received');
      refreshNotifications();
    },
    onCountUpdate: () => {
      console.log('📊 Global count update received');
      refreshNotifications();
    }
  });

  // Actualizar estado de conexión
  useEffect(() => {
    setIsConnected(wsConnected);
    setConnectionError(wsError);
  }, [wsConnected, wsError]);

  // Limpiar notificaciones antiguas cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return prev.filter(notification => {
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
    connectionError,
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
