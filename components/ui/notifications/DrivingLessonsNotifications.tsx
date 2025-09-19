"use client";

import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
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
  const { refreshNotifications } = useNotificationContext();

  const handleAccept = async (notification: DrivingLessonNotification) => {
    try {
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
        fetchDrivingLessonsNotifications();
        window.dispatchEvent(new CustomEvent('notificationRefresh'));
      } else {
        console.error('❌ Error accepting driving lesson:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error accepting driving lesson:', error);
    }
  };

  const handleReject = async (notification: DrivingLessonNotification) => {
    try {
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
        fetchDrivingLessonsNotifications();
        window.dispatchEvent(new CustomEvent('notificationRefresh'));
      } else {
        console.error('❌ Error rejecting driving lesson:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error rejecting driving lesson:', error);
    }
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
    <div className="border-b border-gray-100">
      <div className="p-3 bg-purple-50 flex items-center gap-2">
        <GraduationCap size={16} className="text-purple-600" />
        <span className="font-medium text-purple-900">
          Driving Lessons ({notifications.length})
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto">
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
          notifications.map((notification) => (
            <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">New Request</span>
                </div>
                <span className="text-xs text-blue-600 font-medium">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
              
              <div className="space-y-1 mb-4">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{notification.studentName}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {notification.studentId} {notification.instructorName}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(notification.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {notification.start} - {notification.end}
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors">
                  DRIVING LESSON
                </button>
                <button 
                  onClick={() => handleAccept(notification)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleReject(notification)}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
                <span className="text-xs text-gray-500 ml-2">Click to view</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-3 text-center text-gray-500 text-sm">
            No pending lessons
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