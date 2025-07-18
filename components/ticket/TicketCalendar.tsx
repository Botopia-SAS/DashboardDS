// TicketCalendar.tsx
// Componente de calendario para la página de tickets
// Adaptado del CalendarView de instructores

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { useState, useEffect, useRef } from "react";
import ScheduleModal from "./ScheduleModal";

interface TicketFormData {
  _id?: string;
  date: string;
  hour: string;
  endHour: string;
  type: string;
  status: string;
  instructorId: string;
  students: string[];
  spots: number;
  classId?: string;
  duration?: string;
  locationId?: string;
  studentRequests?: string[];
  recurrence?: string;
  recurrenceEndDate?: string;
}

interface TicketClassResponse {
  _id: string;
  date: string;
  hour: string;
  endHour?: string;
  type: string;
  status: string;
  instructorId: string | { _id: string; name: string };
  students: string[];
  spots: number;
  classId?: string | { _id: string; title: string };
  duration?: string;
  locationId?: string | { _id: string; title: string };
  studentRequests?: string[];
}

interface TicketCalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps?: {
    classType?: string;
    student?: string;
    status?: string;
    ticketClass?: TicketClassResponse;
    studentCount?: number;
    totalSpots?: number;
  };
}

interface TicketCalendarProps {
  className?: string;
}

const TicketCalendar = ({ className }: TicketCalendarProps) => {
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TicketFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Referencia al calendario para navegación
  const calendarRef = useRef<FullCalendar>(null);

  // Datos del calendario - inicializar vacío
  const [calendarEvents, setCalendarEvents] = useState<TicketCalendarEvent[]>([]);

  // Datos para el modal - inicializar vacíos
  const [instructors, setInstructors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  // Clipboard para copiar/pegar clases
  const clipboardKey = 'ticketclass_clipboard';
  // Estado para saber en qué slot se hizo click por última vez
  const [lastSelectedSlot, setLastSelectedSlot] = useState<any>(null);

  // Cargar datos reales desde las APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar instructores
        const instructorsResponse = await fetch('/api/instructors');
        if (instructorsResponse.ok) {
          const instructorsData = await instructorsResponse.json();
          setInstructors(instructorsData);
        }

        // Cargar ubicaciones
        const locationsResponse = await fetch('/api/locations');
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setLocations(locationsData);
        }

        // Cargar clases
        const classesResponse = await fetch('/api/classes');
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setClasses(classesData);
        }

        // Cargar estudiantes (usuarios)
        const studentsResponse = await fetch('/api/users');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          // Mapeo para asegurar {_id, name}
          const mappedStudents = studentsData.map((u: any) => ({
            _id: u._id,
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()
          }));
          setStudents(mappedStudents);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Cargar todos los TicketClass reales desde la API
  useEffect(() => {
    const fetchTicketClasses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/ticket/calendar");
        
        if (!response.ok) {
          console.error(`API Error: ${response.status} ${response.statusText}`);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        // Mapeo forzado de eventos para asegurar que se vean
        const events = Array.isArray(data) ? data.map((tc: any, index: number) => {
          try {
            const dateStr = tc.date ? tc.date.slice(0, 10) : "";
            const hour = tc.hour || "00:00";
            const endHour = tc.endHour || "01:00";
            const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
            const totalSpots = tc.spots || 30;
            let classType = "Class";
            if (tc.type === "date") classType = "D.A.T.E";
            else if (tc.type === "bdi") classType = "B.D.I";
            else if (tc.type === "adi") classType = "A.D.I";
            let status = "Available";
            if (tc.status === "full") status = "Full";
            else if (tc.status === "cancel") status = "Cancelled";
            else if (tc.status === "expired") status = "Expired";
            let backgroundColor = "#6b7280";
            let borderColor = "#4b5563";
            if (status === "Full") {
              backgroundColor = "#7c3aed";
              borderColor = "#6d28d9";
            } else if (status === "Cancelled") {
              backgroundColor = "#ef4444";
              borderColor = "#dc2626";
            } else if (status === "Available") {
              backgroundColor = "#10b981";
              borderColor = "#059669";
            }
            return {
              id: tc._id || `ticket-${index}`,
              title: `${classType} - ${status} (${studentCount}/${totalSpots})`,
              start: `${dateStr}T${hour}:00`,
              end: `${dateStr}T${endHour}:00`,
              backgroundColor,
              borderColor,
              textColor: "#fff",
              extendedProps: {
                ticketClass: tc,
                classType,
                status,
                studentCount,
                totalSpots
              }
            };
          } catch (error) {
            console.error('Error mapping ticket class:', tc, error);
            return null;
          }
        }).filter(Boolean) as TicketCalendarEvent[] : [];
        
        setCalendarEvents(events);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching ticket classes:', error);
        setIsLoading(false);
      }
    };

    fetchTicketClasses();
  }, []);

  // Handler para pegar con Ctrl+V SOLO si el modal de crear clase está abierto y es nuevo (no edición)
  useEffect(() => {
    function handlePaste(e: KeyboardEvent) {
      if (
        e.ctrlKey &&
        e.key === 'v' &&
        isModalOpen &&
        selectedSlot &&
        !selectedSlot._id // Solo si es creación, no edición
      ) {
        const clipboard = window.localStorage.getItem(clipboardKey);
        if (!clipboard) return;
        try {
          const data = JSON.parse(clipboard);
          // Usa la fecha/hora del slot seleccionado
          const { date, hour, endHour } = selectedSlot;
          const newClass = {
            ...data,
            date,
            hour,
            endHour,
          };
          // Limpiar campos no permitidos por el backend
          delete newClass._id;
          // Si hay duration, recalcular endHour en base a hour y duration
          if (newClass.duration && newClass.hour) {
            const [h, m] = newClass.hour.split(":").map(Number);
            const dur = parseInt(newClass.duration);
            let endHourNum = h + dur;
            let endMinute = m;
            if (endHourNum >= 24) { endHourNum = 23; endMinute = 59; }
            newClass.endHour = `${endHourNum.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
          }
          // Rellenar el formulario del modal con los datos pegados
          setSelectedSlot({
            ...selectedSlot,
            ...newClass,
          });
        } catch (err) {
          alert('Error al pegar la clase.');
        }
      }
    }
    window.addEventListener('keydown', handlePaste);
    return () => window.removeEventListener('keydown', handlePaste);
  }, [isModalOpen, selectedSlot]);

  // Modifica handleDateSelect para guardar el slot seleccionado
  const handleDateSelect = (selectInfo: any) => {
    // Formatear la fecha y hora seleccionada
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    const formattedDate = startDate.toISOString().split('T')[0];
    const formattedStartTime = startDate.toTimeString().slice(0, 5);
    const formattedEndTime = endDate.toTimeString().slice(0, 5);
    setLastSelectedSlot({ date: formattedDate, hour: formattedStartTime, endHour: formattedEndTime });
    // Configurar el slot seleccionado con la hora inicial del click
    setSelectedSlot({
      date: formattedDate,
      hour: formattedStartTime,
      endHour: formattedEndTime,
      type: "date", // Tipo por defecto
      status: "available",
      instructorId: "",
      students: [],
      spots: 30,
      classId: "",
      duration: "2h",
      locationId: "",
      studentRequests: [],
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (eventInfo: EventClickArg) => {
    const ticketClass = eventInfo.event.extendedProps.ticketClass as TicketClassResponse;
    if (ticketClass) {
      setSelectedSlot({
        _id: ticketClass._id,
        date: ticketClass.date?.slice(0, 10) || "",
        hour: ticketClass.hour || "",
        endHour: ticketClass.endHour || "",
        type: ticketClass.type || "date",
        status: ticketClass.status || "available",
        instructorId: typeof ticketClass.instructorId === 'string' ? ticketClass.instructorId : ticketClass.instructorId._id,
        students: ticketClass.students || [],
        spots: ticketClass.spots || 30,
        classId: typeof ticketClass.classId === 'string' ? ticketClass.classId : ticketClass.classId?._id || "",
        duration: ticketClass.duration || "2h",
        locationId: typeof ticketClass.locationId === 'string' ? ticketClass.locationId : ticketClass.locationId?._id || "",
        studentRequests: ticketClass.studentRequests || [],
      } as TicketFormData & { _id?: string });
      setIsModalOpen(true);
    }
  };

  const handleModalSave = async (data: TicketFormData) => {
    try {
      // Detectar si es un update (tiene _id) o una creación nueva
      const isUpdate = '_id' in data && data._id;
      
      if (isUpdate) {
        // Es un update - el modal ya manejó la petición PUT, solo necesitamos refrescar
        //console.log('🔄 Refreshing calendar after update...');
      } else {
        // Es una creación nueva - manejar recurrencia si existe
        const generateRecurrenceDates = (startDate: string, recurrence: string, endDate: string) => {
          const dates = [];
          const current = new Date(startDate);
          const end = new Date(endDate);
          
          while (current <= end) {
            dates.push(new Date(current));
            
            switch (recurrence) {
              case 'daily':
                current.setDate(current.getDate() + 1);
                break;
              case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
              case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
              default:
                break;
            }
          }
          
          return dates;
        };
        
        // Si hay recurrencia, crear múltiples clases
        if (data.recurrence && data.recurrence !== 'none' && data.recurrenceEndDate) {
          const dates = generateRecurrenceDates(data.date, data.recurrence, data.recurrenceEndDate);
          
          // Crear cada clase individualmente
          for (const date of dates) {
            const ticketClassData = {
              date: new Date(date.toISOString().split('T')[0] + 'T' + data.hour).toISOString(),
              hour: data.hour,
              endHour: data.endHour,
              classId: data.classId,
              type: data.type,
              locationId: data.locationId,
              instructorId: data.instructorId,
              students: data.students,
              spots: data.spots,
              duration: data.duration,
              studentRequests: data.studentRequests || [],
            };
            
            const response = await fetch('/api/ticket/classes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ticketClassData),
            });
            
            if (!response.ok) {
              const result = await response.json();
              throw new Error(result.error || `Failed to create ticket class for ${date.toISOString().split('T')[0]}`);
            }
          }
        } else {
          // Si no hay recurrencia, crear una sola clase
          const ticketClassData = {
            date: new Date(data.date + 'T' + data.hour).toISOString(),
            hour: data.hour,
            endHour: data.endHour,
            classId: data.classId,
            type: data.type,
            locationId: data.locationId,
            instructorId: data.instructorId,
            students: data.students,
            spots: data.spots,
            duration: data.duration,
            studentRequests: data.studentRequests || [],
          };
          
          const response = await fetch('/api/ticket/classes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketClassData),
          });
          
          if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to create ticket class');
          }
        }
      }
      
      // Cerrar el modal
      setIsModalOpen(false);
      
      // Recargar los eventos del calendario
      const updatedResponse = await fetch("/api/ticket/calendar");
      
      if (!updatedResponse.ok) {
        throw new Error(`Failed to refresh calendar: ${updatedResponse.status}`);
      }
      
      const updatedData = await updatedResponse.json();
      
      if (!Array.isArray(updatedData)) {
        console.error('❌ Expected array but got:', typeof updatedData);
        return;
      }
      
      const events = updatedData.map((ticketClass: unknown) => {
        const tc = ticketClass as TicketClassResponse;
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        
        let classType = "Class";
        if (tc.type === "date") classType = "D.A.T.E";
        else if (tc.type === "bdi") classType = "B.D.I";
        else if (tc.type === "adi") classType = "A.D.I";
        
        let status = "Available";
        if (tc.status === "full") status = "Full";
        else if (tc.status === "cancel") status = "Cancelled";
        else if (tc.status === "expired") status = "Expired";
        
        const dateStr = tc.date?.slice(0, 10) || "";
        
        let backgroundColor = "#6b7280";
        let borderColor = "#4b5563";
        
        if (status === "Full") {
          backgroundColor = "#7c3aed";
          borderColor = "#6d28d9";
        } else if (status === "Cancelled") {
          backgroundColor = "#ef4444";
          borderColor = "#dc2626";
        } else if (status === "Available") {
          backgroundColor = "#10b981";
          borderColor = "#059669";
        }
        
        return {
          id: tc._id,
          title: `${classType} - ${status} (${studentCount}/${totalSpots})`,
          start: `${dateStr}T${tc.hour || "00:00"}`,
          end: `${dateStr}T${tc.endHour || "00:00"}`,
          backgroundColor,
          borderColor,
          textColor: "#ffffff",
          extendedProps: {
            ticketClass: tc,
            classType,
            status,
            studentCount,
            totalSpots
          }
        } as TicketCalendarEvent;
      });
      
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error saving ticket class:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleModalDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ticket/classes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error deleting TicketClass');
      // Refresca los eventos
      const updatedResponse = await fetch('/api/ticket/calendar');
      if (!updatedResponse.ok) throw new Error('Failed to refresh calendar');
      const updatedData = await updatedResponse.json();
      const events = Array.isArray(updatedData) ? updatedData.map((tc: any, index: number) => {
        const dateStr = tc.date ? tc.date.slice(0, 10) : "";
        const hour = tc.hour || "00:00";
        const endHour = tc.endHour || "01:00";
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        let classType = "Class";
        if (tc.type === "date") classType = "D.A.T.E";
        else if (tc.type === "bdi") classType = "B.D.I";
        else if (tc.type === "adi") classType = "A.D.I";
        let status = "Available";
        if (tc.status === "full") status = "Full";
        else if (tc.status === "cancel") status = "Cancelled";
        else if (tc.status === "expired") status = "Expired";
        let backgroundColor = "#6b7280";
        let borderColor = "#4b5563";
        if (status === "Full") {
          backgroundColor = "#7c3aed";
          borderColor = "#6d28d9";
        } else if (status === "Cancelled") {
          backgroundColor = "#ef4444";
          borderColor = "#dc2626";
        } else if (status === "Available") {
          backgroundColor = "#10b981";
          borderColor = "#059669";
        }
        return {
          id: tc._id || `ticket-${index}`,
          title: `${classType} - ${status} (${studentCount}/${totalSpots})`,
          start: `${dateStr}T${hour}:00`,
          end: `${dateStr}T${endHour}:00`,
          backgroundColor,
          borderColor,
          textColor: "#fff",
          extendedProps: {
            ticketClass: tc,
            classType,
            status,
            studentCount,
            totalSpots
          }
        };
      }) : [];
      setCalendarEvents(events);
      setIsModalOpen(false);
      setSelectedSlot(null);
    } catch (err) {
      alert('Error deleting TicketClass');
    }
  };

  const handleModalUpdate = async () => {
    try {
      // Refrescar los eventos del calendario
      const updatedResponse = await fetch("/api/ticket/calendar");
      if (!updatedResponse.ok) throw new Error('Failed to refresh calendar');
      const updatedData = await updatedResponse.json();
      
      if (!Array.isArray(updatedData)) {
        console.error('❌ Expected array but got:', typeof updatedData);
        return;
      }
      
      const events = updatedData.map((ticketClass: unknown) => {
        const tc = ticketClass as TicketClassResponse;
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        
        let classType = "Class";
        if (tc.type === "date") classType = "D.A.T.E";
        else if (tc.type === "bdi") classType = "B.D.I";
        else if (tc.type === "adi") classType = "A.D.I";
        
        let status = "Available";
        if (tc.status === "full") status = "Full";
        else if (tc.status === "cancel") status = "Cancelled";
        else if (tc.status === "expired") status = "Expired";
        
        const dateStr = tc.date?.slice(0, 10) || "";
        
        let backgroundColor = "#6b7280";
        let borderColor = "#4b5563";
        
        if (status === "Full") {
          backgroundColor = "#7c3aed";
          borderColor = "#6d28d9";
        } else if (status === "Cancelled") {
          backgroundColor = "#ef4444";
          borderColor = "#dc2626";
        } else if (status === "Available") {
          backgroundColor = "#10b981";
          borderColor = "#059669";
        }
        
        return {
          id: tc._id,
          title: `${classType} - ${status} (${studentCount}/${totalSpots})`,
          start: `${dateStr}T${tc.hour || "00:00"}`,
          end: `${dateStr}T${tc.endHour || "00:00"}`,
          backgroundColor,
          borderColor,
          textColor: "#ffffff",
          extendedProps: {
            ticketClass: tc,
            classType,
            status,
            studentCount,
            totalSpots
          }
        } as TicketCalendarEvent;
      });
      
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error refreshing calendar after update:', error);
    }
  };

  if (hasError) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500">Error loading calendar</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading ticket classes...</p>
            </div>
          </div>
        )}
        {!isLoading && calendarEvents.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">No ticket classes found</p>
              <p className="text-sm text-gray-400 mt-1">Click on a time slot to create a new ticket class</p>
            </div>
          </div>
        )}
        {!isLoading && (
          <div className="calendar-container">
            <style>{`.fc-event { cursor: pointer !important; }`}</style>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              initialDate={new Date().toISOString().split('T')[0]}
              selectable
              editable={false}
              slotMinTime="06:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              height="auto"
              contentHeight="auto"
              events={calendarEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDisplay="block"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
              }}
              loading={(loading) => {
                setIsLoading(loading);
              }}
            />
          </div>
        )}
      </CardContent>
      {/* Modal para configurar TicketClass */}
      {isModalOpen && selectedSlot && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onUpdate={handleModalUpdate}
          initialData={selectedSlot || {}}
          instructors={instructors}
          locations={locations}
          classes={classes}
          students={students}
        />
      )}
    </Card>
  );
};

export default TicketCalendar;