"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface DrivingLessonNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  lessonType: string;
  instructorId: string;
  instructorName: string;
  studentId: string;
  studentName: string;
  date: string;
  start: string;
  end: string;
  amount: number;
  paid: boolean;
}

interface Instructor {
  _id: string;
  name: string;
  schedule_driving_lesson: Array<{
    _id: string;
    paymentMethod: string;
    reservedAt: string;
    date: string;
    start: string;
    end: string;
    status: string;
    classType: string;
    amount: number;
    studentId: string;
    studentName: string;
    paid: boolean;
  }>;
}

interface DrivingLessonsNotificationsProps {
  isOpen: boolean;
}

export default function DrivingLessonsNotifications({ isOpen }: DrivingLessonsNotificationsProps) {
  const [notifications, setNotifications] = useState<DrivingLessonNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async (notification: DrivingLessonNotification) => {
    if (processingId) return; // Prevenir múltiples clicks
    
    try {
      setProcessingId(notification.id);

      const response = await fetch(`/api/instructors/${notification.instructorId}/schedule/driving-lesson/${notification.id}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'booked',
          paid: true
        })
      });

      if (response.ok) {

        // Actualizar inmediatamente la lista filtrando el item aceptado
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Agregar delay más largo para asegurar que la DB se actualice completamente
        setTimeout(() => {

          fetchDrivingLessonsNotifications();
          window.dispatchEvent(new CustomEvent('notificationRefresh'));
        }, 2000);
      } else {
        console.error('❌ Error accepting driving lesson:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error accepting driving lesson:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (notification: DrivingLessonNotification) => {
    if (processingId) return; // Prevenir múltiples clicks
    
    try {
      setProcessingId(notification.id);

      const response = await fetch(`/api/instructors/${notification.instructorId}/schedule/driving-lesson/${notification.id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'available',
          studentId: null,
          studentName: null,
          paymentMethod: null
        })
      });

      if (response.ok) {

        // Actualizar inmediatamente la lista filtrando el item rechazado
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Agregar delay más largo para asegurar que la DB se actualice completamente
        setTimeout(() => {

          fetchDrivingLessonsNotifications();
          window.dispatchEvent(new CustomEvent('notificationRefresh'));
        }, 2000);
      } else {
        console.error('❌ Error rejecting driving lesson:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error rejecting driving lesson:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCardClick = (notification: DrivingLessonNotification) => {
    // Navigate to driving-test-lessons page and focus on the specific instructor and date
    const date = new Date(notification.date);
    const dateParam = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    router.push(`/driving-test-lessons?instructorId=${notification.instructorId}&date=${dateParam}&type=driving-lesson&eventId=${notification.id}`);
  };

  const fetchDrivingLessonsNotifications = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/instructors/pending');
      const pendingLessons = await response.json();


      if (Array.isArray(pendingLessons)) {
        // Get unique instructor IDs
        const instructorIds = [...new Set(pendingLessons.map(lesson => lesson.instructorId))];

        // Fetch instructor names
        const instructorsResponse = await fetch('/api/instructors');
        const instructors: Instructor[] = await instructorsResponse.json();
        const instructorMap = new Map(instructors.map(i => [i._id, i.name]));

        // Create notifications from pending lessons
        const drivingLessonNotifications: DrivingLessonNotification[] = pendingLessons.map(lesson => ({
          id: lesson.lessonId,
          title: 'New Driving Lesson Request',
          message: `Driving lesson request`,
          timestamp: lesson.requestDate,
          status: lesson.status,
          lessonType: lesson.classType,
          instructorId: lesson.instructorId,
          instructorName: instructorMap.get(lesson.instructorId) || 'Unknown',
          studentId: lesson.studentId,
          studentName: '',
          date: lesson.date,
          start: lesson.hour,
          end: lesson.endHour,
          amount: 0,
          paid: false
        }));


        setNotifications(drivingLessonNotifications);
      } else {

        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching driving lessons notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/instructors/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'driving-lessons' && data.lessons) {
          // Fetch instructor names
          fetch('/api/instructors')
            .then(res => res.json())
            .then((instructors: Instructor[]) => {
              const instructorMap = new Map(instructors.map(i => [i._id, i.name]));

              const drivingLessonNotifications: DrivingLessonNotification[] = data.lessons.map((lesson: any) => ({
                id: lesson.lessonId,
                title: 'New Driving Lesson Request',
                message: `Driving lesson request`,
                timestamp: lesson.requestDate,
                status: lesson.status,
                lessonType: lesson.classType,
                instructorId: lesson.instructorId,
                instructorName: instructorMap.get(lesson.instructorId) || 'Unknown',
                studentId: lesson.studentId,
                studentName: '',
                date: lesson.date,
                start: lesson.hour,
                end: lesson.endHour,
                amount: 0,
                paid: false
              }));

              setNotifications(drivingLessonNotifications);

            });
        }
      } catch (error) {
        console.error('❌ Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      setTimeout(() => {

      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDrivingLessonsNotifications();
    }
  }, [isOpen]);

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {

      fetchDrivingLessonsNotifications();
    };

    window.addEventListener('notificationRefresh', handleGlobalRefresh);

    return () => {
      window.removeEventListener('notificationRefresh', handleGlobalRefresh);
    };
  }, []);

  const formatTime = (timestamp: string) => {
    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      return '';
    }
    return new Date(timestamp).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Loading lessons...
            </div>
            <button 
              onClick={() => fetchDrivingLessonsNotifications()}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                   onClick={() => handleCardClick(notification)}>
                {/* Header compacto */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-1.5 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-900 font-medium text-xs">New Request</span>
                    </div>
                    <span className="text-purple-600 text-xs">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-3">
                  {/* Student Info */}
                  <div className="mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {notification.studentName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                      <span>{notification.lessonType}</span>
                      <span>{notification.instructorName}</span>
                    </div>
                  </div>

                  {/* Class Info */}
                  <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">
                          {notification.date && !isNaN(new Date(notification.date).getTime()) 
                            ? new Date(notification.date).toLocaleDateString() 
                            : ''}
                        </p>
                        <p className="text-gray-600 text-xs">{notification.start} - {notification.end}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(notification);
                            }}
                            disabled={processingId === notification.id}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-0.5 rounded text-xs font-medium transition-colors">
                            {processingId === notification.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(notification);
                            }}
                            disabled={processingId === notification.id}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-2 py-0.5 rounded text-xs font-medium transition-colors">
                            {processingId === notification.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs">
                      Click to view
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap size={32} className="text-purple-300 mx-auto mb-3" />
            <h4 className="text-purple-600 font-medium mb-1">No pending lessons</h4>
            <p className="text-purple-500 text-sm">New driving lesson requests will appear here</p>
          </div>
        )}
    </div>
  );
}

export function useDrivingLessonsNotificationsCount() {
  const [count, setCount] = useState(0);
  const { notifications } = useNotificationContext();

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/instructors/pending');
      const pendingLessons = await response.json();

      if (Array.isArray(pendingLessons)) {
        setCount(pendingLessons.length);

      } else {

        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching driving lessons count:', error);
      setCount(0);
    }
  };

  // Actualizar automáticamente cuando lleguen notificaciones SSE
  useEffect(() => {

    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];

      if (latestNotification.type === 'driving-lessons') {

        fetchCount();
      }
    }
  }, [notifications]);

  // Escuchar eventos de actualización global (mantener compatibilidad)
  useEffect(() => {
    const handleGlobalRefresh = () => {

      fetchCount();
    };

    window.addEventListener('notificationRefresh', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('notificationRefresh', handleGlobalRefresh);
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchCount();
  }, []);

  return count;
}