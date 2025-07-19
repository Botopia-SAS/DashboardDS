"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ScheduleModal from "./ScheduleModal";

interface CalendarProps {
  selectedInstructor?: any;
}

const Calendar: React.FC<CalendarProps> = ({ selectedInstructor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<any>(null);

  const fetchEvents = async () => {
    if (!selectedInstructor) {
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching events for instructor:", selectedInstructor._id);
      
      const response = await fetch(`/api/driving-test-lessons/events?instructorId=${selectedInstructor._id}`);
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Events data:", data);
        setEvents(data || []);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch events:", errorData);
        setError("Failed to load calendar events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Error loading calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Calendar component mounted/updated for instructor:", selectedInstructor?._id);
    fetchEvents();
  }, [selectedInstructor?._id]);

  const handleDateSelect = (selectInfo: any) => {
    try {
      console.log("Date select triggered:", selectInfo);
      
      if (!selectInfo || !selectInfo.start) {
        console.error("Invalid select info");
        return;
      }

      const start = selectInfo.start;
      
      // Format date as YYYY-MM-DD
      const dateStr = start.toISOString().split('T')[0];
      
      // Format time as HH:mm
      const timeStr = start.toTimeString().slice(0, 5);
      
      console.log("Selected date:", dateStr, "time:", timeStr);
      
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error handling date select:", error);
      setError("Error selecting date");
    }
  };

  const handleEventClick = (clickInfo: any) => {
    try {
      console.log("Event clicked:", clickInfo.event);
    } catch (error) {
      console.error("Error handling event click:", error);
    }
  };

  const handleScheduleCreated = () => {
    try {
      console.log("Schedule created, refreshing events");
      fetchEvents();
    } catch (error) {
      console.error("Error refreshing events:", error);
    }
  };

  const handleModalClose = () => {
    console.log("Closing modal");
    setIsModalOpen(false);
    setSelectedDate("");
    setSelectedTime("");
  };

  if (!selectedInstructor) {
    return (
      <div className="text-center text-gray-500 py-8">
        No instructor selected
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchEvents}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-gray-600">Loading calendar...</div>
        </div>
      )}
      
      <div className="border rounded-lg p-4">
  <FullCalendar
          ref={calendarRef}
    plugins={[timeGridPlugin, interactionPlugin]}
    initialView="timeGridWeek"
          selectable={true}
          editable={false}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
    slotMinTime="06:00:00"
    slotMaxTime="20:00:00"
    slotDuration="00:30:00"
    height="auto"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek"
          }}
        />
      </div>
      
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onScheduleCreated={handleScheduleCreated}
        selectedInstructor={selectedInstructor}
  />
    </div>
);
};

export default Calendar; 