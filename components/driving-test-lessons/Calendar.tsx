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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Clipboard para copiar/pegar eventos
  const clipboardKey = 'driving_schedule_clipboard';

  const fetchEvents = async () => {
    if (!selectedInstructor) {
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // console.log("Fetching events for instructor:", selectedInstructor._id);
      
      const response = await fetch(`/api/driving-test-lessons/events?instructorId=${selectedInstructor._id}`);
      // console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log("Events data:", data);
        
        // Formatear los eventos para mostrar mejor información
        const formattedEvents = data.map((event: any) => ({
          ...event,
          title: formatEventTitle(event),
          backgroundColor: event.backgroundColor,
          borderColor: event.borderColor,
        }));
        
        setEvents(formattedEvents || []);
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

  // Función para formatear el título del evento
  const formatEventTitle = (event: any) => {
    const classType = event.classType === 'driving test' ? 'Driving Test' : 'Driving Lesson';
    const status = event.status;
    
    let title = `${classType} - ${status}`;
    
    // Agregar nombre del estudiante si está reservado o pendiente
    if ((status === 'booked' || status === 'pending') && event.studentName) {
      title += ` (${event.studentName})`;
    }
    
    // Agregar información de pago para driving test
    if (event.classType === 'driving test' && event.amount) {
      title += ` - $${event.amount}`;
    }
    
    return title;
  };

  useEffect(() => {
    // console.log("Calendar component mounted/updated for instructor:", selectedInstructor?._id);
    fetchEvents();
  }, [selectedInstructor?._id]);



  // Handler para pegar con Ctrl+V SOLO si el modal está abierto y es nuevo (no edición)
  useEffect(() => {
    function handlePaste(e: KeyboardEvent) {
      if (
        e.ctrlKey &&
        e.key === 'v' &&
        isModalOpen &&
        selectedDate &&
        selectedTime
      ) {
        const clipboard = window.localStorage.getItem(clipboardKey);
        if (!clipboard) return;
        try {
          const data = JSON.parse(clipboard);
          console.log("Pasted data:", data);
          
          // El modal detectará automáticamente los datos pegados
          
        } catch (err) {
          console.error('Error al pegar el evento:', err);
          alert('Error al pegar el evento.');
        }
      }
    }
    window.addEventListener('keydown', handlePaste);
    return () => window.removeEventListener('keydown', handlePaste);
  }, [isModalOpen, selectedDate, selectedTime]);

  const getDefaultEndTime = (startTime: string, hours: number) => {
    if (!startTime) return "";
    const [hoursStart, minutes] = startTime.split(":").map(Number);
    let endHours = hoursStart + hours;
    if (endHours >= 24) endHours = 23;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleDateSelect = (selectInfo: any) => {
    try {
      // console.log("Date select triggered:", selectInfo);
      
      if (!selectInfo || !selectInfo.start) {
        console.error("Invalid select info");
        return;
      }

      const start = selectInfo.start;
      
      // Format date as YYYY-MM-DD
      const dateStr = start.toISOString().split('T')[0];
      
      // Format time as HH:mm
      const timeStr = start.toTimeString().slice(0, 5);
      
      // console.log("Selected date:", dateStr, "time:", timeStr);
      
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
      
      // Preparar los datos del evento para el modal de edición
      const eventData = {
        _id: clickInfo.event.id,
        title: clickInfo.event.title,
        start: clickInfo.event.start.toISOString(),
        end: clickInfo.event.end.toISOString(),
        classType: clickInfo.event.extendedProps?.classType,
        extendedProps: {
          classType: clickInfo.event.extendedProps?.classType,
          status: clickInfo.event.extendedProps?.status,
          amount: clickInfo.event.extendedProps?.amount,
          studentId: clickInfo.event.extendedProps?.studentId,
          studentName: clickInfo.event.extendedProps?.studentName,
          paid: clickInfo.event.extendedProps?.paid
        }
      };
      
      console.log("Prepared event data:", eventData);
      
      // Abrir modal de edición con los datos del evento
      setSelectedEvent(eventData);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error handling event click:", error);
    }
  };

  const handleScheduleCreated = () => {
    try {
      // console.log("Schedule created, refreshing events");
      fetchEvents();
    } catch (error) {
      console.error("Error refreshing events:", error);
    }
  };

  const handleModalClose = () => {
    // console.log("Closing modal");
    setIsModalOpen(false);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      console.log("Sending delete request for event:", eventId);
      
      const response = await fetch(`/api/driving-test-lessons/delete-event`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        console.log("Event deleted successfully");
        handleEditModalClose();
        fetchEvents(); // Refrescar eventos
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        alert(`Error deleting event: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event");
    }
  };

  const handleEventUpdate = async (eventData: any) => {
    try {
      console.log("Sending update request:", eventData);
      
      const response = await fetch(`/api/driving-test-lessons/update-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log("Event updated successfully");
        handleEditModalClose();
        fetchEvents(); // Refrescar eventos
      } else {
        const error = await response.json();
        console.error("Update failed:", error);
        alert(`Error updating event: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Error updating event");
    }
  };

  const handleEventCopy = async (eventData: any) => {
    try {
      console.log("Sending copy request:", eventData);
      
      const response = await fetch(`/api/driving-test-lessons/copy-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log("Event copied successfully");
        handleEditModalClose();
        fetchEvents(); // Refrescar eventos
        alert("Event copied successfully!");
      } else {
        const error = await response.json();
        console.error("Copy failed:", error);
        alert(`Error copying event: ${error.message}`);
      }
    } catch (error) {
      console.error("Error copying event:", error);
      alert("Error copying event");
    }
  };

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="cursor-pointer">
        {eventInfo.event.title}
      </div>
    );
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
    <div className="w-full">
      <style jsx>{`
        .fc-event {
          cursor: pointer !important;
        }
        .fc-event:hover {
          opacity: 0.8;
        }
      `}</style>
      
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <div className="relative">
        <div className="border rounded-lg p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay",
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventClassNames="cursor-pointer"
            eventInteractive={true}
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
        
        {/* Edit Event Modal */}
        <ScheduleModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          selectedInstructor={selectedInstructor}
          selectedDate={selectedEvent ? (selectedEvent.start instanceof Date 
            ? selectedEvent.start.toISOString().split('T')[0]
            : selectedEvent.start.split('T')[0]
          ) : undefined}
          selectedTime={selectedEvent ? (selectedEvent.start instanceof Date 
            ? selectedEvent.start.toTimeString().slice(0, 5)
            : selectedEvent.start.split('T')[1]?.slice(0, 5)
          ) : undefined}
          isEditMode={true}
          eventData={selectedEvent}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onEventCopy={handleEventCopy}
        />
      </div>
    </div>
  );
};

export default Calendar; 