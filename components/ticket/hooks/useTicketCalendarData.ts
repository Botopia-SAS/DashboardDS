/**
 * Custom hook for managing ticket calendar data
 */

import { useState, useEffect } from "react";
import type { TicketClassResponse, TicketCalendarEvent } from "../utils/calendarHelpers";
import {
  normalizeClassType,
  getStatusDisplay,
  getStatusColors,
  calculateEndHour,
  getInstructorName
} from "../utils/calendarHelpers";

// Simple cache to avoid duplicate requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const useTicketCalendarData = (classType: string, refreshKey: number) => {
  const [calendarEvents, setCalendarEvents] = useState<TicketCalendarEvent[]>([]);
  const [classes, setClasses] = useState<{ _id: string; title: string }[]>([]);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load static data (locations, classes, students)
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [locationsRes, classesRes, studentsRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/classes'),
          fetch('/api/customers')
        ]);

        if (locationsRes.ok) {
          setLocations(await locationsRes.json());
        }

        if (classesRes.ok) {
          setClasses(await classesRes.json());
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const transformedStudents = studentsData.map((student: any) => ({
            _id: student.id,
            name: student.name
          }));
          setStudents(transformedStudents);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    loadStaticData();
  }, []);

  // Load calendar events
  const fetchTicketClasses = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Check cache first (only if not forcing refresh)
      const cacheKey = `calendar-${classType}`;
      const cachedData = forceRefresh ? null : getCachedData(cacheKey);
      
      if (cachedData) {
        setCalendarEvents(cachedData);
        setIsLoading(false);
        return;
      }

      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/ticket/calendar?t=${timestamp}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        setCalendarEvents([]);
        return;
      }

      const normalizedClassType = normalizeClassType(classType);
      const filteredData = data.filter((tc: TicketClassResponse) => {
        const normalizedTicketType = normalizeClassType(tc.type);
        return normalizedTicketType === normalizedClassType;
      });

      const events = filteredData.map((tc: TicketClassResponse) => {
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        const displayClassType = tc.type.toUpperCase();
        const status = getStatusDisplay(tc.status);
        const { bg: backgroundColor, border: borderColor } = getStatusColors(status);

        const dateStr = tc.date?.slice(0, 10) || "";
        const hour = tc.hour || "00:00";
        const endHour = calculateEndHour(hour, tc.endHour, tc.duration);

        return {
          id: tc._id,
          title: `${displayClassType}\n${status} (${studentCount}/${totalSpots})`,
          start: `${dateStr}T${hour}`,
          end: `${dateStr}T${endHour}`,
          backgroundColor,
          borderColor,
          textColor: "#ffffff",
          extendedProps: {
            ticketClass: tc,
            classType: displayClassType,
            status,
            studentCount,
            totalSpots
          }
        } as TicketCalendarEvent;
      });

      setCalendarEvents(events);
      setCachedData(cacheKey, events);
    } catch (error) {
      setCalendarEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketClasses();
  }, [refreshKey, classType]);

  // Listen for real-time updates
  useEffect(() => {
    const handleCalendarRefresh = () => {
      console.log('🔄 Calendar refresh triggered from external event');
      fetchTicketClasses();
    };

    window.addEventListener('calendarRefresh', handleCalendarRefresh);
    window.addEventListener('studentRequestUpdate', handleCalendarRefresh);
    window.addEventListener('ticketClassUpdate', handleCalendarRefresh);

    return () => {
      window.removeEventListener('calendarRefresh', handleCalendarRefresh);
      window.removeEventListener('studentRequestUpdate', handleCalendarRefresh);
      window.removeEventListener('ticketClassUpdate', handleCalendarRefresh);
    };
  }, []);

  return {
    calendarEvents,
    classes,
    students,
    locations,
    isLoading,
    refreshCalendar: () => fetchTicketClasses(true) // Force refresh when called manually
  };
};
