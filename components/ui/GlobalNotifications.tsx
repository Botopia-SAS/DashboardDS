"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";

interface PendingRequest {
  requestId: string;
  ticketClassId?: string;
  drivingTestId?: string;
  lessonId?: string;
  studentId: string;
  date: string;
  hour: string;
  endHour?: string;
  classType: string;
  type: 'ticket' | 'driving-test' | 'lesson';
}

interface GlobalNotificationsProps {
  className?: string;
}

export default function GlobalNotifications({ className }: GlobalNotificationsProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const { pendingRequests, studentNames, connected, emitNotification } = useNotifications();


  const handleAccept = async (request: PendingRequest) => {
    try {
      let endpoint = '';
      let body = {};

      switch (request.type) {
        case 'ticket':
          endpoint = `/api/ticket/classes/${request.ticketClassId}`;
          body = { action: "acceptRequest", studentId: request.studentId, requestId: request.requestId };
          break;
        case 'driving-test':
          endpoint = `/api/driving-test-lessons/${request.drivingTestId}`;
          body = { action: "acceptRequest", studentId: request.studentId, requestId: request.requestId };
          break;
        case 'lesson':
          endpoint = `/api/instructors/${request.lessonId}`;
          body = { action: "acceptRequest", studentId: request.studentId, requestId: request.requestId };
          break;
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Emit SSE notification to notify all clients
        await emitNotification('request_accepted', { 
          requestType: request.type, 
          requestId: request.requestId 
        });
        
        // Navigate to the appropriate page and slot
        navigateToSlot(request);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const navigateToSlot = (request: PendingRequest) => {
    let route = '';
    
    switch (request.type) {
      case 'ticket':
        route = '/ticket';
        break;
      case 'driving-test':
        route = '/driving-test-lessons';
        break;
      case 'lesson':
        route = '/instructors';
        break;
    }

    // Navigate to the page
    router.push(route);
    
    // After navigation, scroll to the specific slot
    setTimeout(() => {
      const slotId = `slot-${request.date}-${request.hour.replace(':', '')}`;
      const slotElement = document.getElementById(slotId);
      if (slotElement) {
        slotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a highlight effect
        slotElement.style.backgroundColor = '#fef3c7';
        setTimeout(() => {
          slotElement.style.backgroundColor = '';
        }, 3000);
      }
    }, 500);
  };

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setNotifOpen(!notifOpen)} 
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {pendingRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full border-2 border-white">
            {pendingRequests.length}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white text-gray-900 rounded-lg shadow-lg z-50 p-4 border">
          <h3 className="font-bold mb-3 text-lg">Pending Requests</h3>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingRequests.map((req) => {
                const dateStr = req.date ? req.date.split("T")[0] : "";
                const hourStr = req.hour || "";
                const endHourStr = req.endHour || "";
                const studentName = studentNames[req.studentId] || req.studentId;
                const typeLabel = req.type === 'ticket' ? 'TICKET' : 
                                 req.type === 'driving-test' ? 'DRIVING TEST' : 'LESSON';

                return (
                  <div key={req.requestId} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {typeLabel}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {req.classType.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {dateStr} {hourStr}{endHourStr ? ` - ${endHourStr}` : ""}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Student: <span className="font-medium">{studentName}</span>
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAccept(req)}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 pt-3 border-t">
            <button 
              onClick={() => setNotifOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
