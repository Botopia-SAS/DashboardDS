"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

      setIsConnected(true);
      return;
    }

    connectionCount++;
    const currentConnection = connectionCount;


    try {
      globalEventSource = new EventSource('/api/notifications/stream');

      globalEventSource.onopen = () => {

        setIsConnected(true);
      };

      globalEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Solo disparar eventos para notificaciones reales, no para conexión o ping
          if (data.type !== 'connection' && data.type !== 'ping') {
            // Limpiar notificaciones antiguas solo cuando llegue una nueva
            setNotifications(prev => {
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
              const cleanedNotifications = prev.filter((notification: NotificationData) => {
                const notificationTime = new Date(notification.data?.timestamp || 0);
                return notificationTime > fiveMinutesAgo;
              });
              
              // Agregar la nueva notificación
              return [...cleanedNotifications, data];
            });
            
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
          
          // Reconectar después de 2 minutos para minimizar peticiones
          // Solo reconectar si realmente es necesario
          setTimeout(() => {
            if (currentConnection === connectionCount && typeof window !== 'undefined') {

              // No cambiar isConnected aquí - dejar que onopen lo maneje
            }
          }, 2 * 60 * 1000); // Cambiado a 2 minutos
        }
      };

    } catch (error) {
      console.error('❌ Error creating SSE connection:', error);
    }

    // Cleanup cuando el componente se desmonta
    return () => {

      if (currentConnection === connectionCount && globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
      }
    };
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
