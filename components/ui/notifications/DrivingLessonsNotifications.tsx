"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

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
      console.log('✅ Accepting driving lesson:', notification.id);
      
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
        console.log('✅ Driving lesson accepted successfully');
        
        // Actualizar inmediatamente la lista filtrando el item aceptado
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Agregar delay más largo para asegurar que la DB se actualice completamente
        setTimeout(() => {
          console.log('🔄 Refreshing driving lesson notifications after accept...');
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
      console.log('❌ Rejecting driving lesson:', notification.id);
      
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
        console.log('✅ Driving lesson rejected successfully');
        
        // Actualizar inmediatamente la lista filtrando el item rechazado
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Agregar delay más largo para asegurar que la DB se actualice completamente
        setTimeout(() => {
          console.log('🔄 Refreshing driving lesson notifications after reject...');
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
    router.push(`/driving-test-lessons?instructorId=${notification.instructorId}&date=${dateParam}&type=driving-lesson`);
  };

  const fetchDrivingLessonsNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching driving lessons notifications...');
      
      const response = await fetch('/api/instructors');
      const instructors: Instructor[] = await response.json();
      
      console.log('📥 Instructors response:', instructors);
      
      if (Array.isArray(instructors)) {
        
        // Filtrar instructores que pueden enseñar driving lessons
        const drivingLessonInstructors = instructors.filter(instructor => 
          instructor.schedule_driving_lesson && instructor.schedule_driving_lesson.length > 0
        );
        
        console.log('🚗 Instructors with driving lessons:', drivingLessonInstructors.length);
        console.log('🔍 All instructors data:', instructors.map(i => ({
          name: i.name,
          hasSchedule: !!i.schedule_driving_lesson,
          scheduleLength: i.schedule_driving_lesson?.length || 0,
          schedule: i.schedule_driving_lesson
        })));
        
        // Crear notificaciones para cada driving lesson pendiente con paymentMethod local
        const drivingLessonNotifications: DrivingLessonNotification[] = [];
        
        drivingLessonInstructors.forEach(instructor => {
          console.log(`🔍 Processing instructor: ${instructor.name}`);
          instructor.schedule_driving_lesson.forEach(lesson => {
            console.log(`🔍 Lesson details:`, {
              status: lesson.status,
              paymentMethod: lesson.paymentMethod,
              studentName: lesson.studentName,
              classType: lesson.classType
            });
            
            if (lesson.status === 'pending' && lesson.paymentMethod === 'local') {
              console.log(`✅ Found pending local driving lesson for ${lesson.studentName}`);
              drivingLessonNotifications.push({
                id: lesson._id,
                title: 'New Driving Lesson Request',
                message: `Driving lesson request for ${lesson.studentName}`,
                timestamp: lesson.reservedAt,
                status: lesson.status,
                lessonType: lesson.classType,
                instructorId: instructor._id,
                instructorName: instructor.name,
                studentId: lesson.studentId,
                studentName: lesson.studentName,
                date: lesson.date,
                start: lesson.start,
                end: lesson.end,
                amount: lesson.amount,
                paid: lesson.paid
              });
            } else {
              console.log(`❌ Lesson filtered out: status=${lesson.status}, paymentMethod=${lesson.paymentMethod}`);
            }
          });
        });
        
        console.log('✅ Created driving lesson notifications:', drivingLessonNotifications.length);
        setNotifications(drivingLessonNotifications);
      } else {
        console.log('❌ API response is not an array:', instructors);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching driving lessons notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivingLessonsNotifications();
      
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 10000); // 10 segundos timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Global driving lessons refresh received');
      fetchDrivingLessonsNotifications();
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
                        <p className="text-gray-900 font-semibold text-sm">{new Date(notification.date).toLocaleDateString()}</p>
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

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/instructors');
      const instructors: Instructor[] = await response.json();
      
      if (Array.isArray(instructors)) {
        
        // Contar driving lessons pendientes con paymentMethod local
        let totalCount = 0;
        instructors.forEach(instructor => {
          if (instructor.schedule_driving_lesson) {
            instructor.schedule_driving_lesson.forEach(lesson => {
              if (lesson.status === 'pending' && lesson.paymentMethod === 'local') {
                totalCount++;
              }
            });
          }
        });
        
        setCount(totalCount);
      } else {
        console.log('❌ API response is not an array for count:', instructors);
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching driving lessons count:', error);
      setCount(0);
    }
  };

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Global driving lessons count refresh received');
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