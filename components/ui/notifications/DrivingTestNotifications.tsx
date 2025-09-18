"use client";

import { useState, useEffect } from "react";
import { Car } from "lucide-react";

interface DrivingTestNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  testType: string;
}

interface DrivingTestNotificationsProps {
  isOpen: boolean;
}

export default function DrivingTestNotifications({ isOpen }: DrivingTestNotificationsProps) {
  const [notifications, setNotifications] = useState<DrivingTestNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivingTestNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API para driving test notifications
      const exampleNotifications: DrivingTestNotification[] = [];
      setNotifications(exampleNotifications);
    } catch (error) {
      console.error('Error fetching driving test notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivingTestNotifications();
    }
  }, [isOpen]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-b border-gray-100">
      <div className="p-3 bg-green-50 flex items-center gap-2">
        <Car size={16} className="text-green-600" />
        <span className="font-medium text-green-900">
          Driving Test ({notifications.length})
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Cargando exámenes...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {notification.title}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {notification.message}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Tipo: {notification.testType} | Estado: {notification.status}
                  </p>
                </div>
                <span className="text-xs text-gray-400 ml-2">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-3 text-center text-gray-500 text-sm">
            No hay exámenes pendientes
          </div>
        )}
      </div>
    </div>
  );
}

export function useDrivingTestNotificationsCount() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    try {
      setCount(0);
    } catch (error) {
      console.error('Error fetching driving test count:', error);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return count;
}