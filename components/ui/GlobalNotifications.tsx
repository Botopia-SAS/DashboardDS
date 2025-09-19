"use client";

import { useState } from "react";
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
  
  const ticketCount = useTicketNotificationsCount();
  const drivingTestCount = useDrivingTestNotificationsCount();
  const drivingLessonsCount = useDrivingLessonsNotificationsCount();
  
  const totalNotifications = ticketCount + drivingTestCount + drivingLessonsCount;
  
  // Usar el contexto global de notificaciones
  const { isConnected, connectionError } = useNotificationContext();

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
        <div className="absolute right-0 mt-2 w-[520px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">{totalNotifications} pending</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-md"
            >
              <X size={20} />
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
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Contenido */}
          <div className="max-h-[60vh] overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
