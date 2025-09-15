"use client";

import { useState, useEffect, useCallback } from 'react';

interface NotificationData {
  type: 'new_request' | 'request_accepted' | 'request_declined' | 'new_ticket_class';
  data: any;
  timestamp: string;
}

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

export const useNotifications = () => {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      // Fetch all types of pending requests
      const [ticketRequests, drivingTestRequests, lessonRequests] = await Promise.all([
        fetch('/api/ticket/pending').then(res => res.json()).catch(() => []),
        fetch('/api/driving-test-lessons/pending').then(res => res.json()).catch(() => []),
        fetch('/api/instructors/pending').then(res => res.json()).catch(() => [])
      ]);

      // Combine and normalize all requests
      const allRequests: PendingRequest[] = [
        ...ticketRequests.map((req: any) => ({
          ...req,
          type: 'ticket' as const,
          ticketClassId: req.ticketClassId || req.classId
        })),
        ...drivingTestRequests.map((req: any) => ({
          ...req,
          type: 'driving-test' as const,
          drivingTestId: req.drivingTestId || req.id
        })),
        ...lessonRequests.map((req: any) => ({
          ...req,
          type: 'lesson' as const,
          lessonId: req.lessonId || req.id
        }))
      ];

      setPendingRequests(allRequests);

      // Fetch student names
      const studentIds = [...new Set(allRequests.map(req => req.studentId))];
      if (studentIds.length > 0) {
        const usersRes = await fetch(`/api/users?ids=${studentIds.join(",")}`);
        if (usersRes.ok) {
          const users = await usersRes.json();
          const names: Record<string, string> = {};
          users.forEach((u: any) => {
            names[u._id] = `${u.firstName} ${u.lastName}`;
          });
          setStudentNames(names);
        }
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPending();

    // Set up Server-Sent Events connection
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const notification: NotificationData = JSON.parse(event.data);
        console.log('Received SSE notification:', notification);
        
        // Refresh pending requests when any notification is received
        fetchPending();
      } catch (error) {
        console.error('Error parsing SSE notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setConnected(false);
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect SSE...');
          // The useEffect will create a new connection
        }
      }, 3000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [fetchPending]);

  const emitNotification = useCallback(async (type: string, data: any) => {
    try {
      await fetch('/api/notifications/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
    } catch (error) {
      console.error('Failed to emit notification:', error);
    }
  }, []);

  return {
    pendingRequests,
    studentNames,
    connected,
    fetchPending,
    emitNotification
  };
};
