"use client";

import { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ScheduleModal from "./ScheduleModal";

interface CalendarProps {
  selectedInstructor?: any;
  targetDate?: string | null;
  targetType?: string | null;
  targetEventId?: string | null;
}

const Calendar: React.FC<CalendarProps> = ({ selectedInstructor, targetDate, targetType, targetEventId }) => {
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

  // Efecto para navegar a la fecha objetivo desde notificaciones y resaltar evento específico
  useEffect(() => {
    if (targetDate && calendarRef.current) {
      console.log(`🎯 Navigating to target date: ${targetDate}, type: ${targetType}, eventId: ${targetEventId}`);
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(targetDate);

      // Resaltar el evento específico si se proporciona el eventId
      if (targetEventId) {
        setTimeout(() => {
          const targetEventElement = document.querySelector(`[data-event-id="${targetEventId}"]`) ||
                                  document.querySelector(`a[href*="${targetEventId}"]`) ||
                                  document.querySelector(`.fc-event[data-event-id="${targetEventId}"]`);

          if (targetEventElement) {
            // Scroll al evento específico
            targetEventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Añadir clase de resaltado
            targetEventElement.classList.add('highlight-notification-event');

            // Remover el resaltado después de 5 segundos
            setTimeout(() => {
              targetEventElement.classList.remove('highlight-notification-event');
            }, 5000);
          } else {
            // Si no encontramos el elemento específico, al menos hacemos scroll a la fecha
            const targetDateElement = document.querySelector(`[data-date="${targetDate}"]`);
            if (targetDateElement) {
              targetDateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 500); // Aumentamos el delay para asegurar que los eventos se hayan renderizado
      } else {
        // Si no hay eventId específico, solo navegamos a la fecha
        setTimeout(() => {
          const targetDateElement = document.querySelector(`[data-date="${targetDate}"]`);
          if (targetDateElement) {
            targetDateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [targetDate, targetType, targetEventId, events]); // Añadimos events como dependencia



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
          // const data = JSON.parse(clipboard);
          // console.log("Pasted data:", data);
          
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

  // const getDefaultEndTime = (startTime: string, hours: number) => {
  //   if (!startTime) return "";
  //   const [hoursStart, minutes] = startTime.split(":").map(Number);
  //   let endHours = hoursStart + hours;
  //   if (endHours >= 24) endHours = 23;
  //   return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  // };

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
      // console.log("Event clicked:", clickInfo.event);
      
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
          paid: clickInfo.event.extendedProps?.paid,
          pickupLocation: clickInfo.event.extendedProps?.pickupLocation,
          dropoffLocation: clickInfo.event.extendedProps?.dropoffLocation,
          selectedProduct: clickInfo.event.extendedProps?.selectedProduct
        }
      };
      
      // console.log("Prepared event data:", eventData);
      
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
      // console.log("Sending delete request for event:", eventId);
      
      const response = await fetch(`/api/driving-test-lessons/delete-event`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        // console.log("Event deleted successfully");
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
      // console.log("Sending update request:", eventData);
      
      const response = await fetch(`/api/driving-test-lessons/update-event`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        // console.log("Event updated successfully");
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
      // console.log("Sending copy request:", eventData);
      
      const response = await fetch(`/api/driving-test-lessons/copy-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        // console.log("Event copied successfully");
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
    const event = eventInfo.event;
    const extendedProps = event.extendedProps;
    
    // Formatear el título con líneas separadas para mejor legibilidad
    const classType = extendedProps?.classType === 'driving test' ? 'Test' : 'Lesson';
    const status = extendedProps?.status || 'available';
    
    // Calcular duración del evento para optimizar display
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const isShortEvent = durationMinutes <= 30;
    
    return (
      <div className="w-full h-full flex flex-col justify-center" data-event-id={event.id} data-status={status}>
        {isShortEvent ? (
          // Layout optimizado para eventos de 30 minutos - solo tipo y status
          <>
            <div className="font-bold leading-tight text-center">
              {classType}
            </div>
            <div className="font-medium capitalize text-center">
              {status}
            </div>
          </>
        ) : (
          // Layout normal para eventos más largos
          <>
            <div className="font-medium leading-tight">
              {classType}
            </div>
            <div className="opacity-90 capitalize">
              {status}
            </div>
            {(status === 'booked' || status === 'pending') && extendedProps?.studentName && (
              <div className="mt-1 leading-tight">
                {extendedProps.studentName}
              </div>
            )}
            {extendedProps?.classType === 'driving test' && extendedProps?.amount && (
              <div className="font-semibold mt-1">
                ${extendedProps.amount}
              </div>
            )}
          </>
        )}
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
      <style jsx global>{`
        /* Estilos principales para eventos */
        .fc .fc-timegrid-event .fc-event-main {
          padding: 4px 6px !important;
          font-size: 12px !important;
          line-height: 1.3 !important;
          white-space: normal !important;
          overflow: visible !important;
          word-wrap: break-word !important;
          height: auto !important;
        }
        
        .fc .fc-timegrid-event {
          min-height: 25px !important;
          max-height: none !important;
          border-radius: 4px !important;
          overflow: visible !important;
        }
        
        .fc .fc-timegrid-event-harness {
          min-height: 25px !important;
          overflow: visible !important;
        }
        
        /* Eventos de 30 minutos - altura específica */
        .fc .fc-timegrid-event[data-duration="30"] {
          min-height: 30px !important;
          max-height: 35px !important;
        }
        
        .fc .fc-timegrid-event-harness[data-duration="30"] {
          min-height: 30px !important;
          max-height: 35px !important;
        }
        
        /* Eventos de 1+ horas - altura normal */
        .fc .fc-timegrid-event[data-duration="60"], 
        .fc .fc-timegrid-event[data-duration="120"] {
          min-height: 45px !important;
        }
        
        .fc .fc-timegrid-event-harness[data-duration="60"],
        .fc .fc-timegrid-event-harness[data-duration="120"] {
          min-height: 45px !important;
        }
        
        /* Reducir tamaño de letra para todos los eventos */
        .fc .fc-timegrid-event .fc-event-main {
          padding: 4px 6px !important;
          font-size: 12px !important;
          line-height: 1.3 !important;
        }

        /* Texto para eventos de 30 minutos */
        .fc .fc-timegrid-event[data-duration="30"] .fc-event-main {
          padding: 3px 5px !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
        }
        
        .fc .fc-event {
          cursor: pointer !important;
          border-width: 1px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        
        .fc .fc-event-title {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          word-wrap: break-word !important;
          line-height: 1.3 !important;
          font-weight: 500 !important;
        }
        
        /* Estilos específicos por estado */
        .fc .fc-event[data-status="booked"] .fc-event-main {
          padding: 8px 10px !important;
          min-height: 50px !important;
        }
        
        .fc .fc-event[data-status="booked"] {
          min-height: 50px !important;
        }
        
        .fc .fc-event[data-status="pending"] .fc-event-main {
          padding: 8px 10px !important;
          min-height: 50px !important;
        }
        
        .fc .fc-event[data-status="pending"] {
          min-height: 50px !important;
        }
        
        .fc .fc-event[data-status="cancelled"] .fc-event-main {
          padding: 6px 8px !important;
          min-height: 40px !important;
        }
        
        /* Hover effects */
        .fc .fc-event:hover {
          opacity: 0.9 !important;
          transform: scale(1.02) !important;
          z-index: 10 !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
          transition: all 0.2s ease !important;
        }
        
        /* Texto dentro de eventos */
        .fc .fc-event-main div {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .fc .fc-event-main .font-medium {
          font-weight: 600 !important;
          margin-bottom: 2px !important;
        }
        
        .fc .fc-event-main .font-semibold {
          font-weight: 700 !important;
          margin-top: 2px !important;
        }
        
        .fc .fc-event-main .truncate {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 100% !important;
        }
        
        /* Asegurar que los eventos largos se vean completos */
        .fc .fc-timegrid-event.fc-event-mirror {
          min-height: 45px !important;
        }
        
        .highlight-notification-event {
          animation: highlightPulse 2s ease-in-out 3;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8) !important;
          border: 2px solid #3B82F6 !important;
          z-index: 1000 !important;
          position: relative !important;
        }
        
        @keyframes highlightPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(59, 130, 246, 1);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .fc .fc-timegrid-event .fc-event-main {
            padding: 4px 6px !important;
            font-size: 11px !important;
          }

          .fc .fc-timegrid-event {
            min-height: 35px !important;
          }
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
            eventDidMount={(info) => {
              // Calcular duración y agregar atributo data-duration para CSS
              if (info.event.start && info.event.end) {
                const startTime = new Date(info.event.start);
                const endTime = new Date(info.event.end);
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                
                // Agregar atributo data-duration al elemento del evento
                info.el.setAttribute('data-duration', durationMinutes.toString());
                
                // También agregar al harness para que el CSS funcione correctamente
                const harness = info.el.closest('.fc-timegrid-event-harness');
                if (harness) {
                  harness.setAttribute('data-duration', durationMinutes.toString());
                }
              }
            }}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
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