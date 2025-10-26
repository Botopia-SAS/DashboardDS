"use client";

import { useState, useEffect } from "react";
import { Car } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface DrivingTestNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  testType: string;
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
  schedule_driving_test: Array<{
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

interface DrivingTestNotificationsProps {
  isOpen: boolean;
}

export default function DrivingTestNotifications({ isOpen }: DrivingTestNotificationsProps) {
  const [notifications, setNotifications] = useState<DrivingTestNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async (notification: DrivingTestNotification) => {
    if (processingId) return; // Prevenir múltiples clicks
    
    try {
      setProcessingId(notification.id);

      const response = await fetch(`/api/instructors/${notification.instructorId}/schedule/driving-test/${notification.id}/accept`, {
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

          fetchDrivingTestNotifications();
          // Disparar evento global de actualización
          window.dispatchEvent(new CustomEvent('notificationRefresh'));
        }, 2000);
      } else {
        console.error('❌ Error accepting driving test:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error accepting driving test:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (notification: DrivingTestNotification) => {
    if (processingId) return; // Prevenir múltiples clicks
    
    try {
      setProcessingId(notification.id);

      const response = await fetch(`/api/instructors/${notification.instructorId}/schedule/driving-test/${notification.id}/reject`, {
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

          fetchDrivingTestNotifications();
          // Disparar evento global de actualización
          window.dispatchEvent(new CustomEvent('notificationRefresh'));
        }, 2000);
      } else {
        console.error('❌ Error rejecting driving test:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error rejecting driving test:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCardClick = (notification: DrivingTestNotification) => {
    // Navigate to driving-test-lessons page and focus on the specific instructor and date
    const date = new Date(notification.date);
    const dateParam = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    router.push(`/driving-test-lessons?instructorId=${notification.instructorId}&date=${dateParam}&type=driving-test&eventId=${notification.id}`);
  };

  const fetchDrivingTestNotifications = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/instructors');
      const instructors: Instructor[] = await response.json();
      

      if (Array.isArray(instructors)) {
        
        // Filtrar instructores que pueden enseñar driving tests
        const drivingTestInstructors = instructors.filter(instructor => 
          instructor.schedule_driving_test && instructor.schedule_driving_test.length > 0
        );
        

        // Log detallado de cada instructor y sus tests
        drivingTestInstructors.forEach(instructor => {

          instructor.schedule_driving_test?.forEach((test, index) => {

          });
        });
        
        // Crear notificaciones para cada driving test pendiente con paymentMethod local
        const drivingTestNotifications: DrivingTestNotification[] = [];
        
        drivingTestInstructors.forEach(instructor => {
          instructor.schedule_driving_test.forEach(test => {
            if (test.status === 'pending' && test.paymentMethod === 'local') {

              drivingTestNotifications.push({
                id: test._id,
                title: 'New Driving Test Request',
                message: `Driving test request for ${test.studentName}`,
                timestamp: test.reservedAt,
                status: test.status,
                testType: test.classType,
                instructorId: instructor._id,
                instructorName: instructor.name,
                studentId: test.studentId,
                studentName: test.studentName,
                date: test.date,
                start: test.start,
                end: test.end,
                amount: test.amount,
                paid: test.paid
              });
            } else {

            }
          });
        });
        

        setNotifications(drivingTestNotifications);
      } else {

        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching driving test notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivingTestNotifications();
      
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 10000); // 10 segundos timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {

      fetchDrivingTestNotifications();
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
              Loading tests...
            </div>
            <button 
              onClick={() => fetchDrivingTestNotifications()}
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
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-1.5 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-green-900 font-medium text-xs">New Request</span>
                    </div>
                    <span className="text-green-600 text-xs">
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
                      <span>{notification.testType}</span>
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
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                          ${notification.amount || '0'}
                        </span>
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
            <Car size={32} className="text-green-300 mx-auto mb-3" />
            <h4 className="text-green-600 font-medium mb-1">No pending tests</h4>
            <p className="text-green-500 text-sm">New driving test requests will appear here</p>
          </div>
        )}
    </div>
  );
}

export function useDrivingTestNotificationsCount() {
  const [count, setCount] = useState(0);
  const { notifications } = useNotificationContext();

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/instructors');
      const instructors: Instructor[] = await response.json();
      
      if (Array.isArray(instructors)) {
        
        // Contar driving tests pendientes con paymentMethod local
        let totalCount = 0;
        instructors.forEach(instructor => {
          if (instructor.schedule_driving_test) {
            instructor.schedule_driving_test.forEach(test => {
              if (test.status === 'pending' && test.paymentMethod === 'local') {
                totalCount++;
              }
            });
          }
        });
        
        setCount(totalCount);
      } else {

        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching driving test count:', error);
      setCount(0);
    }
  };

  // Actualizar automáticamente cuando lleguen notificaciones SSE
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.type === 'driving-test') {

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

  useEffect(() => {
    fetchCount();
  }, []);

  return count;
}