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

export const useTicketCalendarData = (classType: string, refreshKey: number) => {
  const [calendarEvents, setCalendarEvents] = useState<TicketCalendarEvent[]>([]);
  const [instructors, setInstructors] = useState<{ _id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ _id: string; title: string }[]>([]);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load static data (instructors, locations, classes, students)
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [instructorsRes, locationsRes, classesRes, studentsRes] = await Promise.all([
          fetch('/api/instructors'),
          fetch('/api/locations'),
          fetch('/api/classes'),
          fetch('/api/customers')
        ]);

        if (instructorsRes.ok) {
          setInstructors(await instructorsRes.json());
        }

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
        console.error('Error loading static data:', error);
      }
    };

    loadStaticData();
  }, []);

  // Load calendar events
  const fetchTicketClasses = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching ticket classes from API');
      const response = await fetch("/api/ticket/calendar");

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('❌ Expected array but got:', typeof data);
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
        const instructorName = getInstructorName(tc.instructorId, instructors);
        const displayClassType = tc.type.toUpperCase();
        const status = getStatusDisplay(tc.status);
        const { bg: backgroundColor, border: borderColor } = getStatusColors(status);

        const dateStr = tc.date?.slice(0, 10) || "";
        const hour = tc.hour || "00:00";
        const endHour = calculateEndHour(hour, tc.endHour, tc.duration);

        return {
          id: tc._id,
          title: `${displayClassType}\n${instructorName}\n${status} (${studentCount}/${totalSpots})`,
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
    } catch (error) {
      console.error('❌ Error fetching ticket classes:', error);
      setCalendarEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketClasses();
  }, [refreshKey, classType, instructors]);

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
    instructors,
    classes,
    students,
    locations,
    isLoading,
    refreshCalendar: fetchTicketClasses
  };
};
