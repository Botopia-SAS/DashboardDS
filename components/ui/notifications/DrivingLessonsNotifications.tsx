"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";

interface DrivingLessonNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  lessonType: string;
}

interface DrivingLessonsNotificationsProps {
  isOpen: boolean;
}

export default function DrivingLessonsNotifications({ isOpen }: DrivingLessonsNotificationsProps) {
  const [notifications, setNotifications] = useState<DrivingLessonNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrivingLessonsNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API para driving lessons notifications
      const exampleNotifications: DrivingLessonNotification[] = [];
      setNotifications(exampleNotifications);
    } catch (error) {
      console.error('Error fetching driving lessons notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivingLessonsNotifications();
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
    <div>
      <div className="p-3 bg-purple-50 flex items-center gap-2">
        <GraduationCap size={16} className="text-purple-600" />
        <span className="font-medium text-purple-900">
          Driving Lessons ({notifications.length})
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Cargando lecciones...
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
                    Tipo: {notification.lessonType} | Estado: {notification.status}
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
            No hay lecciones pendientes
          </div>
        )}
      </div>
    </div>
  );
}

export function useDrivingLessonsNotificationsCount() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    try {
      setCount(0);
    } catch (error) {
      console.error('Error fetching driving lessons count:', error);
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