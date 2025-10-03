"use client";

import { useState, useEffect } from "react";
import { Bell, X, Calendar, Car, GraduationCap } from "lucide-react";
import TicketNotifications, { useTicketNotificationsCount } from "@/components/ui/notifications/TicketNotifications";
import DrivingTestNotifications, { useDrivingTestNotificationsCount } from "@/components/ui/notifications/DrivingTestNotifications";
import DrivingLessonsNotifications, { useDrivingLessonsNotificationsCount } from "@/components/ui/notifications/DrivingLessonsNotifications";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface GlobalNotificationsProps {
  className?: string;
  iconColor?: string;
}

type TabType = 'tickets' | 'driving-test' | 'driving-lessons';

export default function GlobalNotifications({ className, iconColor = "text-gray-600" }: GlobalNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tickets');
  const [ticketCount, setTicketCount] = useState(0);
  const [drivingTestCount, setDrivingTestCount] = useState(0);
  const [drivingLessonsCount, setDrivingLessonsCount] = useState(0);

  // Usar el contexto global de notificaciones
  const { isConnected, connectionError, notifications } = useNotificationContext();

  const totalNotifications = ticketCount + drivingTestCount + drivingLessonsCount;

  // Function to fetch all counts
  const fetchAllCounts = async () => {
    try {
      console.log('🔄 Fetching all notification counts...');

      // Fetch tickets count
      const ticketsRes = await fetch('/api/ticket/pending');
      const tickets = await ticketsRes.json();
      const ticketsCount = Array.isArray(tickets) ? tickets.length : 0;
      setTicketCount(ticketsCount);
      console.log(`🎫 Tickets count: ${ticketsCount}`);

      // Fetch driving test count
      const drivingTestRes = await fetch('/api/driving-test-lessons/pending');
      const drivingTests = await drivingTestRes.json();
      const drivingTestsCount = Array.isArray(drivingTests) ? drivingTests.length : 0;
      setDrivingTestCount(drivingTestsCount);
      console.log(`🚗 Driving test count: ${drivingTestsCount}`);

      // Fetch driving lessons count
      const lessonsRes = await fetch('/api/instructors/pending');
      const lessons = await lessonsRes.json();
      const lessonsCount = Array.isArray(lessons) ? lessons.length : 0;
      setDrivingLessonsCount(lessonsCount);
      console.log(`🎓 Driving lessons count: ${lessonsCount}`);

      // Trigger event for other components to refresh
      window.dispatchEvent(new CustomEvent('notificationRefresh'));
    } catch (error) {
      console.error('❌ Error fetching counts:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllCounts();
  }, []);

  // Actualizar cuando lleguen nuevas notificaciones por SSE
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      console.log('🔔 Nueva notificación recibida en GlobalNotifications:', latestNotification);
      console.log('🔔 Tipo:', latestNotification.type);

      // Immediately fetch new counts
      fetchAllCounts();
    }
  }, [notifications]);

  const tabs = [
    { id: 'tickets' as TabType, label: 'Tickets', icon: Calendar, count: ticketCount },
    { id: 'driving-test' as TabType, label: 'Driving Test', icon: Car, count: drivingTestCount },
    { id: 'driving-lessons' as TabType, label: 'Driving Lessons', icon: GraduationCap, count: drivingLessonsCount }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'tickets':
        return <TicketNotifications isOpen={isOpen} />;
      case 'driving-test':
        return <DrivingTestNotifications isOpen={isOpen} />;
      case 'driving-lessons':
        return <DrivingLessonsNotifications isOpen={isOpen} />;
      default:
        return <TicketNotifications isOpen={isOpen} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full hover:bg-gray-100/10 transition-colors ${iconColor}`}
      >
        <Bell size={20} />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {totalNotifications > 99 ? "99+" : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay para móvil */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed top-16 left-4 right-4 sm:absolute sm:right-0 sm:left-auto sm:top-auto mt-2 w-auto sm:w-96 md:w-[420px] lg:w-[580px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[85vh] sm:max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Bell size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{totalNotifications} pending</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Pestañas horizontales */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors relative ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Icon size={16} />
                      {tab.count > 0 && (
                        <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                          isActive ? 'bg-blue-100 text-blue-600' : 'bg-red-500 text-white'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] leading-tight text-center">
                      {tab.id === 'driving-lessons' ? 'Driving\nLessons' : tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Contenido */}
            <div className="max-h-[calc(100vh-200px)] sm:max-h-[60vh] overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
