"use client";

import { useState, useEffect } from "react";
import { Car } from "lucide-react";
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
  const { refreshNotifications } = useNotificationContext();

  const handleAccept = async (notification: DrivingTestNotification) => {
    try {
      console.log('✅ Accepting driving test:', notification.id);
      
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
        console.log('✅ Driving test accepted successfully');
        // Refrescar las notificaciones
        fetchDrivingTestNotifications();
        // Disparar evento global de actualización
        window.dispatchEvent(new CustomEvent('notificationRefresh'));
      } else {
        console.error('❌ Error accepting driving test:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error accepting driving test:', error);
    }
  };

  const handleReject = async (notification: DrivingTestNotification) => {
    try {
      console.log('❌ Rejecting driving test:', notification.id);
      
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
        console.log('✅ Driving test rejected successfully');
        // Refrescar las notificaciones
        fetchDrivingTestNotifications();
        // Disparar evento global de actualización
        window.dispatchEvent(new CustomEvent('notificationRefresh'));
      } else {
        console.error('❌ Error rejecting driving test:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error rejecting driving test:', error);
    }
  };

  const fetchDrivingTestNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching driving test notifications...');
      
      const response = await fetch('/api/instructors');
      const instructors: Instructor[] = await response.json();
      
      console.log('📥 Instructors response:', instructors);
      
      if (Array.isArray(instructors)) {
        
        // Filtrar instructores que pueden enseñar driving tests
        const drivingTestInstructors = instructors.filter(instructor => 
          instructor.schedule_driving_test && instructor.schedule_driving_test.length > 0
        );
        
        console.log('🚗 Instructors with driving tests:', drivingTestInstructors.length);
        console.log('🔍 All instructors data:', instructors.map(i => ({
          name: i.name,
          hasSchedule: !!i.schedule_driving_test,
          scheduleLength: i.schedule_driving_test?.length || 0,
          schedule: i.schedule_driving_test
        })));
        
        // Crear notificaciones para cada driving test pendiente con paymentMethod local
        const drivingTestNotifications: DrivingTestNotification[] = [];
        
        drivingTestInstructors.forEach(instructor => {
          console.log(`🔍 Processing instructor: ${instructor.name}`);
          instructor.schedule_driving_test.forEach(test => {
            console.log(`🔍 Test details:`, {
              status: test.status,
              paymentMethod: test.paymentMethod,
              studentName: test.studentName,
              classType: test.classType
            });
            
            if (test.status === 'pending' && test.paymentMethod === 'local') {
              console.log(`✅ Found pending local driving test for ${test.studentName}`);
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
              console.log(`❌ Test filtered out: status=${test.status}, paymentMethod=${test.paymentMethod}`);
            }
          });
        });
        
        console.log('✅ Created driving test notifications:', drivingTestNotifications.length);
        setNotifications(drivingTestNotifications);
      } else {
        console.log('❌ API response is not an array:', instructors);
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
      console.log('🔄 Global driving test refresh received');
      fetchDrivingTestNotifications();
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
      <div className="p-3 bg-green-50 flex items-center gap-2">
        <Car size={16} className="text-green-600" />
        <span className="font-medium text-green-900">
          Driving Test ({notifications.length})
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto">
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
                  DRIVING TEST
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
            No pending tests
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
        console.log('❌ API response is not an array for count:', instructors);
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching driving test count:', error);
      setCount(0);
    }
  };

  // Escuchar eventos de actualización global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 Global driving test count refresh received');
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