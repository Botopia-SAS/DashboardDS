// TicketCalendar.tsx
// Componente de calendario para la página de tickets
// Adaptado del CalendarView de instructores

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { useState, useEffect } from "react";
import ScheduleModal from "./ScheduleModal";
import useClassTypeStore from "@/app/store/classTypeStore";

// FullCalendar v6 includes styles in the JavaScript bundles
// No separate CSS imports needed

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
  refreshKey?: number;
  focusClassId?: string | null;
  focusWeek?: number;
  focusYear?: number;
}

const TicketCalendar = ({ className, refreshKey, focusClassId, focusWeek, focusYear }: TicketCalendarProps) => {
  // Obtener el tipo de clase del store
  const { classType } = useClassTypeStore();
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TicketFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);

  // Datos reales cargados desde las APIs
  const [calendarEvents, setCalendarEvents] = useState<TicketCalendarEvent[]>([]);

  // Datos reales para el modal
  const [instructors, setInstructors] = useState<{ _id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ _id: string; title: string }[]>([]);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);

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

        // Cargar estudiantes (customers)
        const studentsResponse = await fetch('/api/customers');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          // Transformar el formato para que coincida con lo que espera ScheduleModal
          const transformedStudents = studentsData.map((student: any) => ({
            _id: student.id,
            name: student.name
          }));
          setStudents(transformedStudents);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Cargar ubicaciones
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
          // Seleccionar la primera ubicación por defecto
          if (data.length > 0) {
            setSelectedLocationId(data[0]._id);
          }
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  // Función para cargar los datos del calendario
  const fetchTicketClasses = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching all ticket classes from API');
      const response = await fetch("/api/ticket/calendar");
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📥 Raw API response:', data);
      console.log('📊 Number of ticket classes fetched:', data.length);
      
      // Verificar que data sea un array
      if (!Array.isArray(data)) {
        console.error('❌ Expected array but got:', typeof data);
        setCalendarEvents([]);
        return;
      }
      
      // No filtrar - mostrar todas las clases de todos los tipos
      const filteredData = data;
      
      console.log(`🔍 Showing all ticket classes:`, filteredData.length);
      
      // Convertir ticketClasses a eventos del calendario
      const events = filteredData.map((ticketClass: unknown, index: number) => {
        const tc = ticketClass as TicketClassResponse;
        console.log(`🎫 Processing ticket class ${index + 1}:`, tc);
        
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        
        // Determinar tipo de clase
        let classType = "Class";
        if (tc.type === "date") classType = "D.A.T.E";
        else if (tc.type === "bdi") classType = "B.D.I";
        else if (tc.type === "adi") classType = "A.D.I";
        
        // Determinar estado
        let status = "Available";
        if (tc.status === "full") status = "Full";
        else if (tc.status === "cancel") status = "Cancelled";
        else if (tc.status === "expired") status = "Expired";
        
        // Formatear fecha - mejorar el handling de fechas
        let dateStr = "";
        if (tc.date) {
          try {
            const date = new Date(tc.date);
            if (!isNaN(date.getTime())) {
              dateStr = date.toISOString().slice(0, 10);
            } else {
              console.warn('⚠️ Invalid date format:', tc.date);
              dateStr = tc.date.slice(0, 10);
            }
          } catch (error) {
            console.error('❌ Error parsing date:', tc.date, error);
            dateStr = new Date().toISOString().slice(0, 10);
          }
        }
        
        // Verificar que tengamos hora
        const hour = tc.hour || "00:00";
        const endHour = tc.endHour || "00:00";
        
        // Determinar color según estado
        let backgroundColor = "#6b7280"; // gris por defecto
        let borderColor = "#4b5563";
        
        if (status === "Full") {
          backgroundColor = "#7c3aed"; // púrpura
          borderColor = "#6d28d9";
        } else if (status === "Cancelled") {
          backgroundColor = "#ef4444"; // rojo
          borderColor = "#dc2626";
        } else if (status === "Available") {
          backgroundColor = "#10b981"; // verde
          borderColor = "#059669";
        }
        
        const event: TicketCalendarEvent = {
          id: tc._id || `ticket-${index}`,
          title: `${classType} - ${status} (${studentCount}/${totalSpots})`,
          start: `${dateStr}T${hour}`,
          end: `${dateStr}T${endHour}`,
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
        };
        
        console.log(`✅ Created event ${index + 1}:`, event);
        return event;
      });
      
      console.log('🎉 Final events array:', events);
      console.log('📈 Total events created:', events.length);
      setCalendarEvents(events);
      
    } catch (error) {
      console.error('❌ Error fetching ticket classes:', error);
      setCalendarEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar todos los TicketClass reales desde la API
  useEffect(() => {
    fetchTicketClasses();
  }, [refreshKey]);

  // Escuchar eventos de actualización en tiempo real
  useEffect(() => {
    const handleCalendarRefresh = () => {
      console.log('🔄 Calendar refresh triggered from external event');
      fetchTicketClasses();
    };

    // Escuchar eventos personalizados
    window.addEventListener('calendarRefresh', handleCalendarRefresh);
    
    // También escuchar cambios en el localStorage como backup
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarNeedsRefresh') {
        console.log('🔄 Calendar refresh triggered from localStorage');
        fetchTicketClasses();
        localStorage.removeItem('calendarNeedsRefresh');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('calendarRefresh', handleCalendarRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Efecto para enfocar automáticamente en un evento específico
  useEffect(() => {
    if (focusClassId && calendarEvents.length > 0) {
      // Buscar el evento específico
      const targetEvent = calendarEvents.find(event => event.id === focusClassId);
      
      if (targetEvent) {
        console.log('🎯 Focusing on event:', targetEvent);
        
        // Crear un pequeño delay para asegurar que el calendario esté renderizado
        setTimeout(() => {
          // Buscar el elemento del evento en el DOM
          const eventElement = document.querySelector(`[data-event-id="${focusClassId}"]`);
          
          if (eventElement) {
            // Scroll al elemento
            eventElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
            
            // Agregar un highlight temporal
            eventElement.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-75');
            
            // Remover el highlight después de 3 segundos
            setTimeout(() => {
              eventElement.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-75');
            }, 3000);
          }
        }, 500);
      }
    }
  }, [focusClassId, calendarEvents]);

  // Log para ver qué datos recibe FullCalendar
  console.log("Eventos que recibe FullCalendar:", calendarEvents);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('Date selected:', selectInfo);
    
    // Formatear la fecha y hora seleccionada
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;
    
    const formattedDate = startDate.toISOString().split('T')[0];
    const formattedStartTime = startDate.toTimeString().slice(0, 5);
    const formattedEndTime = endDate.toTimeString().slice(0, 5);
    
    // Configurar el slot seleccionado con la hora inicial del click
    setSelectedSlot({
      date: formattedDate,
      hour: formattedStartTime,
      endHour: formattedEndTime,
      type: classType, // Usar el tipo seleccionado en lugar de "date" fijo
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
      });
      setIsModalOpen(true);
    }
  };

  const refreshCalendar = async () => {
    const updatedResponse = await fetch("/api/ticket/calendar");
    if (!updatedResponse.ok) {
      throw new Error(`Failed to refresh calendar: ${updatedResponse.status}`);
    }
    const updatedData = await updatedResponse.json();
    if (!Array.isArray(updatedData)) {
      console.error('❌ Expected array but got:', typeof updatedData);
      return;
    }
    
    // No filtrar - mostrar todas las clases de todos los tipos
    const filteredData = updatedData;
    
    const events = filteredData.map((ticketClass: unknown) => {
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
  };

  const handleModalDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/ticket/classes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete TicketClass');
      }
      setIsModalOpen(false);
      await refreshCalendar();
    } catch (error) {
      console.error('❌ Error deleting TicketClass:', error);
      alert(`❌ Error deleting TicketClass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleModalSave = async (data: TicketFormData) => {
    try {
      // Crear múltiples clases si hay recurrencia
      if (data.recurrence && data.recurrence !== 'none' && data.recurrenceEndDate) {
        const startDate = new Date(data.date);
        const endDate = new Date(data.recurrenceEndDate);
        const addDays = (date: Date, days: number) => {
          const d = new Date(date);
          d.setDate(d.getDate() + days);
          return d;
        };
        const step = data.recurrence === 'daily' ? 1 : data.recurrence === 'weekly' ? 7 : 30;
        const payload: any[] = [];
        for (let d = new Date(startDate); d <= endDate; d = addDays(d, step)) {
          payload.push({
            date: d.toISOString().split('T')[0],
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
          });
        }
        const response = await fetch('/api/ticket/classes/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create recurring ticket classes');
        }
      } else {
        const ticketClassData = {
          date: data.date,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticketClassData),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || 'Failed to create ticket class');
        }
      }
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
      console.error('❌ Error creating TicketClass:', error);
      alert(`❌ Error creating TicketClass: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>🗓️ Ticket Classes Calendar - All Types</CardTitle>
            <p className="text-sm text-gray-600">
              Showing {calendarEvents.length} ticket classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Location:</label>
            <select
              className="border rounded px-3 py-1 text-sm"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
            >
              {locations.map((location) => (
                <option key={location._id} value={location._id}>
                  {location.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
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
        
        <div className="calendar-container" style={{ minHeight: '850px' }}>
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable
            editable={false}
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            height="850px"
            events={calendarEvents}
            select={handleDateSelect}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            eventDidMount={(info) => {
              setIsLoading(false);
              // Add ID to slot for navigation and focus functionality
              if (info.event.id) {
                info.el.setAttribute('data-event-id', info.event.id);
              }
              const event = info.event;
              const dateStr = event.start?.toISOString().split('T')[0] || '';
              const timeStr = event.start?.toTimeString().slice(0, 5).replace(':', '') || '';
              const slotId = `slot-${dateStr}-${timeStr}`;
              info.el.id = slotId;
              
              // Add hover effects
              info.el.style.cursor = 'pointer';
              info.el.style.transition = 'all 0.2s ease';
              
              // Store original colors
              const originalBg = info.el.style.backgroundColor;
              const originalBorder = info.el.style.borderColor;
              
              // Add hover event listeners
              info.el.addEventListener('mouseenter', () => {
                info.el.style.transform = 'scale(1.02)';
                info.el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                info.el.style.zIndex = '10';
                // Make color slightly lighter on hover
                const currentBg = info.el.style.backgroundColor;
                if (currentBg.includes('rgb(16, 185, 129)')) { // green
                  info.el.style.backgroundColor = 'rgb(34, 197, 94)'; // lighter green
                } else if (currentBg.includes('rgb(124, 58, 237)')) { // purple
                  info.el.style.backgroundColor = 'rgb(139, 92, 246)'; // lighter purple
                } else if (currentBg.includes('rgb(239, 68, 68)')) { // red
                  info.el.style.backgroundColor = 'rgb(248, 113, 113)'; // lighter red
                } else if (currentBg.includes('rgb(107, 114, 128)')) { // gray
                  info.el.style.backgroundColor = 'rgb(156, 163, 175)'; // lighter gray
                }
              });
              
              info.el.addEventListener('mouseleave', () => {
                info.el.style.transform = 'scale(1)';
                info.el.style.boxShadow = 'none';
                info.el.style.zIndex = '1';
                // Restore original color
                info.el.style.backgroundColor = originalBg;
              });
            }}
            loading={(loading) => setIsLoading(loading)}
            eventDisplay="block"
            eventTextColor="#ffffff"
            eventBackgroundColor="#10b981"
            eventBorderColor="#059669"
          />
        </div>
      </CardContent>
      
      {/* Modal para configurar TicketClass */}
      {isModalOpen && selectedSlot && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onUpdate={refreshCalendar}
          initialData={selectedSlot}
          instructors={instructors}
          locations={locations}
          classes={classes}
          students={students}
          selectedLocationId={selectedLocationId}
        />
      )}
    </Card>
  );
};

export default TicketCalendar;
