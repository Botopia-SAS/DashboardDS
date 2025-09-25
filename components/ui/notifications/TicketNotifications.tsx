"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCalendarRefresh } from "@/hooks/useCalendarRefresh";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { triggerStudentRequestUpdate, refreshTicketCalendar } from "@/lib/calendarEvents";

interface StudentRequest {
  _id: string;
  studentId: string;
  requestDate: string;
  status: string;
  paymentMethod: string;
}

interface Student {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface TicketClass {
  _id: string;
  studentRequests: StudentRequest[];
  students: string[];
  date: string;
  hour: string;
  endHour: string;
  type: string;
  status: string;
}

interface TicketNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  classId: string;
  studentId: string;
  classType: string;
  classDate: string;
  classHour: string;
  classEndHour: string;
  student?: Student;
  requestId: string;
}

interface TicketNotificationsProps {
  isOpen: boolean;
}

export default function TicketNotifications({ isOpen }: TicketNotificationsProps) {
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshCalendar } = useCalendarRefresh();
  
  // Usar el contexto global de notificaciones
  const { refreshNotifications } = useNotificationContext();

  const handleAccept = async (notification: TicketNotification) => {
    try {
      const response = await fetch(`/api/ticket/classes/${notification.classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acceptRequest',
          studentId: notification.studentId,
          requestId: notification.requestId
        })
      });

      if (response.ok) {
        // Refresh notifications
        fetchTicketNotifications();

        // Trigger calendar refresh
        refreshCalendar();

        // Trigger global calendar refresh events
        refreshTicketCalendar();
        triggerStudentRequestUpdate();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (notification: TicketNotification) => {
    try {
      const response = await fetch(`/api/ticket/classes/${notification.classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rejectRequest',
          requestId: notification.requestId
        })
      });

      if (response.ok) {
        // Refresh notifications
        fetchTicketNotifications();

        // Trigger calendar refresh
        refreshCalendar();

        // Trigger global calendar refresh events
        refreshTicketCalendar();
        triggerStudentRequestUpdate();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleCardClick = (notification: TicketNotification) => {
    // Navigate to ticket calendar and focus on the specific week/date
    const date = new Date(notification.classDate);
    const week = getWeekOfYear(date);
    router.push(`/ticket?week=${week}&year=${date.getFullYear()}&classId=${notification.classId}&eventId=${notification.classId}`);
  };

  const getWeekOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  };

  const fetchTicketNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching ticket notifications...');
      
      const response = await fetch('/api/ticketclasses');
      const data = await response.json();
      
      console.log('📥 Ticket classes response:', data);
      
      if (data.success) {
        // Filter classes that have studentRequests
        const classesWithRequests = data.data.filter((ticketClass: TicketClass) => 
          ticketClass.studentRequests && ticketClass.studentRequests.length > 0
        );
        
        console.log('🎫 Classes with requests:', classesWithRequests.length);
        
        // Create notifications for each studentRequest and fetch student data
        // Only show notifications for requests with paymentMethod "local"
        const ticketNotifications = await Promise.all(
          classesWithRequests.flatMap((ticketClass: TicketClass) =>
            ticketClass.studentRequests
              .filter((request: StudentRequest) => request.paymentMethod === "local")
              .map(async (request: StudentRequest) => {
                // Fetch student information
                let student: Student | undefined;
                try {
                  const studentResponse = await fetch(`/api/users/${request.studentId}`);
                  if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    student = studentData.user;
                  }
                } catch (error) {
                  console.error('Error fetching student data:', error);
                }

                return {
                  id: `${ticketClass._id}-${request._id}`,
                  type: 'ticket',
                  title: 'New Student Request',
                  message: `Request for class on ${ticketClass.date} at ${ticketClass.hour}`,
                  timestamp: request.requestDate,
                  status: request.status,
                  classId: ticketClass._id,
                  studentId: request.studentId,
                  classType: ticketClass.type,
                  classDate: ticketClass.date,
                  classHour: ticketClass.hour,
                  classEndHour: ticketClass.endHour,
                  requestId: request._id,
                  student: student
                };
              })
          )
        );
        
        console.log('✅ Created notifications:', ticketNotifications.length);
        setNotifications(ticketNotifications);
      } else {
        console.log('❌ API response not successful:', data);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching ticket notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTicketNotifications();
      
      // Timeout de seguridad para evitar loading infinito
      const timeout = setTimeout(() => {
        if (loading) {
          console.log('⏰ Loading timeout reached, stopping loading state');
          setLoading(false);
        }
      }, 10000); // 10 segundos timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Global notification refresh received');
      fetchTicketNotifications();
    };

    window.addEventListener('notificationRefresh', handleGlobalRefresh);
    
    return () => {
      window.removeEventListener('notificationRefresh', handleGlobalRefresh);
    };
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatClassDateTime = (date: string, hour: string, endHour: string) => {
    // Extract date parts from ISO string (2025-09-14T00:00:00.000Z)
    // Parse the date string correctly to avoid timezone issues
    const dateParts = date.split('T')[0]; // Get just the date part: "2025-09-14"
    const [year, month, day] = dateParts.split('-');
    const classDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Month is 0-based
    
    const formattedDate = classDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format time range
    const timeRange = endHour ? `${hour} - ${endHour}` : hour;
    
    return { formattedDate, timeRange };
  };

  return (
    <div className="p-3">
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Loading requests...
          </div>
          <button 
            onClick={() => fetchTicketNotifications()}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const { formattedDate, timeRange } = formatClassDateTime(
              notification.classDate, 
              notification.classHour, 
              notification.classEndHour
            );
            
            return (
              <div key={notification.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                   onClick={() => handleCardClick(notification)}>
                {/* Header compacto */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-1.5 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-900 font-medium text-xs">New Request</span>
                    </div>
                    <span className="text-blue-600 text-xs">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-3">
                  {/* Student Info */}
                  {notification.student && (
                    <div className="mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {notification.student.firstName} {notification.student.lastName}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                        <span>{notification.student.email}</span>
                        <span>{notification.student.phoneNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Class Info */}
                  <div className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">{formattedDate}</p>
                        <p className="text-gray-600 text-xs">{timeRange}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          {notification.classType.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(notification);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-xs font-medium transition-colors">
                            Accept
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(notification);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs font-medium transition-colors">
                            Reject
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar size={32} className="text-blue-300 mx-auto mb-3" />
          <h4 className="text-blue-600 font-medium mb-1">No pending requests</h4>
          <p className="text-blue-500 text-sm">New ticket requests will appear here</p>
        </div>
      )}
    </div>
  );
}

// Hook personalizado para obtener el contador de notificaciones
export function useTicketNotificationsCount() {
  const [count, setCount] = useState(0);
  const { notifications } = useNotificationContext();

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/ticketclasses');
      const data = await response.json();

      if (data.success) {
        const classesWithRequests = data.data.filter((ticketClass: TicketClass) =>
          ticketClass.studentRequests && ticketClass.studentRequests.length > 0
        );

        const totalRequests = classesWithRequests.reduce((total: number, ticketClass: TicketClass) =>
          total + ticketClass.studentRequests.filter((request: StudentRequest) => request.paymentMethod === "local").length, 0
        );

        setCount(totalRequests);
      }
    } catch (error) {
      console.error('Error fetching ticket count:', error);
      setCount(0);
    }
  };

  // Actualizar automáticamente cuando lleguen notificaciones SSE
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.type === 'ticket') {
        console.log('🎫 Ticket notification received, updating count');
        fetchCount();
      }
    }
  }, [notifications]);

  // Escuchar eventos de actualización global (mantener compatibilidad)
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Global count refresh received');
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