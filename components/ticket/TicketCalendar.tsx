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

// Los estilos CSS para resaltar slots están en: styles/ticket-slot-highlight.css
// Se importan automáticamente en globals.css

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
  classType?: string;
  focusClassId?: string | null;
  focusWeek?: number;
  focusYear?: number;
  highlightEventId?: string | null;
}

const TicketCalendar = ({ className, refreshKey, classType: propClassType, focusClassId, focusWeek, focusYear, highlightEventId }: TicketCalendarProps) => {
  // Obtener el tipo de clase del store como fallback
  const { classType: storeClassType } = useClassTypeStore();
  
  // Use prop classType if provided, otherwise use store classType
  const classType = propClassType || storeClassType;
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TicketFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  
  // Estado para el slot seleccionado visualmente
  const [blinkingSlot, setBlinkingSlot] = useState<{start: Date, end: Date} | null>(null);
  const [currentOverlay, setCurrentOverlay] = useState<HTMLElement | null>(null);

  // Datos reales cargados desde las APIs - MOVER AQUÍ ANTES DE LOS useEffect
  const [calendarEvents, setCalendarEvents] = useState<TicketCalendarEvent[]>([]);
  
  // Datos reales para el modal
  const [instructors, setInstructors] = useState<{ _id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ _id: string; title: string }[]>([]);
  const [students, setStudents] = useState<{ _id: string; name: string }[]>([]);

  // Efecto para aplicar selección visual permanente al slot
  useEffect(() => {
    // Limpiar overlay anterior si existe
    if (currentOverlay && currentOverlay.parentNode) {
      currentOverlay.parentNode.removeChild(currentOverlay);
      setCurrentOverlay(null);
    }

    if (blinkingSlot) {
      // Crear un overlay que muestre la selección del slot
      const overlay = document.createElement('div');
      overlay.className = 'slot-blinking-overlay';
      overlay.style.cssText = `
        position: absolute;
        z-index: 1000;
        pointer-events: none;
        border-radius: 4px;
      `;
      
      // Encontrar el contenedor del calendario
      const calendarContainer = document.querySelector('.fc-timegrid-body');
      if (calendarContainer) {
        calendarContainer.appendChild(overlay);
        setCurrentOverlay(overlay);
        
        // Calcular posición basada en el tiempo y fecha del slot
        const startDate = blinkingSlot.start;
        const endDate = blinkingSlot.end;
        
        // Buscar la columna de fecha correspondiente
        const dateStr = startDate.toISOString().split('T')[0];
        const dayColumn = document.querySelector(`[data-date="${dateStr}"]`);
        
        if (dayColumn) {
          // Calcular posición vertical basada en la hora
          const startHour = startDate.getHours();
          const startMinutes = startDate.getMinutes();
          const endHour = endDate.getHours();
          const endMinutes = endDate.getMinutes();
          
          // Altura de cada hora en el calendario (esto puede variar)
          const hourHeight = 48; // Altura aproximada en pixels por hora
          const minuteHeight = hourHeight / 60;
          
          const topOffset = (startHour - 6) * hourHeight + startMinutes * minuteHeight; // -6 porque el calendario inicia a las 6am
          const height = ((endHour - startHour) * 60 + (endMinutes - startMinutes)) * minuteHeight;
          
          const rect = dayColumn.getBoundingClientRect();
          const containerRect = calendarContainer.getBoundingClientRect();
          
          overlay.style.left = `${rect.left - containerRect.left}px`;
          overlay.style.top = `${topOffset}px`;
          overlay.style.width = `${rect.width}px`;
          overlay.style.height = `${height}px`;
        }
      }
    }
  }, [blinkingSlot]);

  // Limpiar overlay al desmontar el componente
  useEffect(() => {
    return () => {
      if (currentOverlay && currentOverlay.parentNode) {
        currentOverlay.parentNode.removeChild(currentOverlay);
      }
    };
  }, [currentOverlay]);

  // INTERCEPTOR BRUTAL - Monitorear y eliminar CUALQUIER transformación
  useEffect(() => {
    const forceNoTransform = () => {
      const allEvents = document.querySelectorAll('.fc-event, .fc-timegrid-event, .fc-event-main');
      allEvents.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        // FORZAR que NO tenga transformaciones
        if (htmlEl.style.transform && htmlEl.style.transform !== 'none') {
          htmlEl.style.transform = 'none';
          console.log('🚫 BLOCKED TRANSFORM:', htmlEl.style.transform);
        }
        if (htmlEl.style.scale && htmlEl.style.scale !== '1') {
          htmlEl.style.scale = '1';
          console.log('🚫 BLOCKED SCALE:', htmlEl.style.scale);
        }
        // FORZAR dimensiones naturales
        htmlEl.style.width = htmlEl.style.width || 'auto';
        htmlEl.style.height = htmlEl.style.height || 'auto';
      });
    };

    // Ejecutar cada 100ms para interceptar cambios
    const interceptor = setInterval(forceNoTransform, 100);
    
    // También ejecutar inmediatamente
    forceNoTransform();

    return () => clearInterval(interceptor);
  }, [calendarEvents]);

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
      
      // Filtrar clases por el tipo actualmente seleccionado
      // Normalizar tanto el classType del prop como el type de la base de datos
      const normalizeClassType = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-');
      const normalizedClassType = normalizeClassType(classType);
      console.log('🔍 Current classType for filtering:', classType, '| Normalized:', normalizedClassType);
      console.log('📊 All ticket classes types:', data.map((tc: TicketClassResponse) => tc.type));

      const filteredData = data.filter((tc: TicketClassResponse) => {
        const normalizedTicketType = normalizeClassType(tc.type);
        const matches = normalizedTicketType === normalizedClassType;
        if (matches) {
          console.log(`✅ Class matched: ${tc._id} (type: ${tc.type}, normalized: ${normalizedTicketType})`);
        }
        return matches;
      });

      console.log(`🔍 Filtering for classType "${classType}": ${filteredData.length} of ${data.length} classes`);
      
      // Convertir ticketClasses a eventos del calendario
      const events = filteredData.map((ticketClass: unknown, index: number) => {
        const tc = ticketClass as TicketClassResponse;
        console.log(`🎫 Processing ticket class ${index + 1}:`, tc);
        
        const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
        const totalSpots = tc.spots || 30;
        
        // Obtener nombre del instructor
        let instructorName = "Sin Asignar";
        if (tc.instructorId) {
          if (typeof tc.instructorId === 'object' && tc.instructorId.name) {
            instructorName = tc.instructorId.name;
          } else if (typeof tc.instructorId === 'string') {
            instructorName = tc.instructorId;
          }
        }
        console.log('👨‍🏫 Instructor name for this class:', instructorName);
        
        // Determinar tipo de clase - usar el tipo directamente en mayúsculas
        const displayClassType = tc.type.toUpperCase();
        
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
        
        // Calcular endHour si no está definido o es vacío
        let endHour = tc.endHour;
        console.log(`🔍 Debug endHour - Original: "${tc.endHour}", Hour: "${hour}", ClassType: "${classType}"`);
        
        if (!endHour || endHour.trim() === "") {
          // Si no hay endHour definido, calcular basado en la duración típica
          // Parsear la hora de inicio
          const [startHour, startMinute] = hour.split(':').map(num => parseInt(num, 10));
          
          // Duración por defecto: 2 horas
          let durationHours = 2;
          if (tc.duration) {
            // Intentar extraer las horas de la duración (formato "2h", "1.5h", etc.)
            const durationMatch = tc.duration.match(/(\d+(?:\.\d+)?)/);
            if (durationMatch) {
              durationHours = parseFloat(durationMatch[1]);
            }
          }
          
          // Calcular la hora de fin
          const endHourNumber = startHour + durationHours;
          const endMinuteNumber = startMinute;
          
          // Asegurarse de que no pase de 24 horas
          const finalEndHour = Math.min(endHourNumber, 23);
          
          // Formatear como HH:MM
          endHour = `${finalEndHour.toString().padStart(2, '0')}:${endMinuteNumber.toString().padStart(2, '0')}`;
          
          console.log(`⏰ Calculated endHour for ${classType}: ${hour} -> ${endHour} (duration: ${durationHours}h)`);
        }
        
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
    console.log('🔄 TicketCalendar useEffect triggered - classType:', classType, 'refreshKey:', refreshKey);
    fetchTicketClasses();
  }, [refreshKey, classType]); // Agregar classType para recargar cuando cambie el tipo

  // Escuchar eventos de actualización en tiempo real
  useEffect(() => {
    const handleCalendarRefresh = () => {
      console.log('🔄 Calendar refresh triggered from external event');
      fetchTicketClasses();
    };

    const handleStudentUpdate = () => {
      console.log('🔄 Calendar refresh triggered from student update');
      fetchTicketClasses();
    };

    const handleTicketUpdate = () => {
      console.log('🔄 Calendar refresh triggered from ticket update');
      fetchTicketClasses();
    };

    // Escuchar eventos personalizados
    window.addEventListener('calendarRefresh', handleCalendarRefresh);
    window.addEventListener('studentRequestUpdate', handleStudentUpdate);
    window.addEventListener('ticketClassUpdate', handleTicketUpdate);

    // También escuchar cambios en el localStorage como backup
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarNeedsRefresh' || e.key === 'studentRequestUpdate' || e.key === 'ticketUpdate') {
        console.log('🔄 Calendar refresh triggered from localStorage:', e.key);
        fetchTicketClasses();
        localStorage.removeItem(e.key);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('calendarRefresh', handleCalendarRefresh);
      window.removeEventListener('studentRequestUpdate', handleStudentUpdate);
      window.removeEventListener('ticketClassUpdate', handleTicketUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Efecto para enfocar automáticamente en un evento específico desde notificaciones
  useEffect(() => {
    const targetId = highlightEventId || focusClassId;
    if (targetId && calendarEvents.length > 0) {
      console.log('🎯 Starting highlight effect for eventId:', targetId);
      console.log('📋 Available calendar events:', calendarEvents.map(e => ({ id: e.id, title: e.title })));

      // Buscar el evento específico
      const targetEvent = calendarEvents.find(event => event.id === targetId);

      if (targetEvent) {
        console.log('✅ Target event found:', targetEvent);

        // Múltiples intentos para encontrar el elemento
        let attempts = 0;
        const maxAttempts = 10;

        const findAndHighlightElement = () => {
          attempts++;
          console.log(`🔍 Attempt ${attempts}/${maxAttempts} to find element`);

          // Intentar múltiples selectores
          const selectors = [
            `[data-event-id="${targetId}"]`,
            `.fc-event[data-event-id="${targetId}"]`,
            `#${targetId}`
          ];

          let eventElement: Element | null = null;

          // Intentar cada selector
          for (const selector of selectors) {
            eventElement = document.querySelector(selector);
            if (eventElement) {
              console.log(`✅ Found element with selector: ${selector}`);
              break;
            }
          }

          // Si no encontró con selectores específicos, buscar por ID en todos los eventos
          if (!eventElement) {
            const allEvents = document.querySelectorAll('.fc-event');
            console.log(`🔍 Searching through ${allEvents.length} calendar events for ID match`);

            for (const event of allEvents) {
              // Buscar el evento que tenga el ID correcto
              if (event.getAttribute('data-event-id') === targetId || event.id === targetId) {
                eventElement = event;
                console.log('✅ Found element by ID match');
                break;
              }
            }
          }

          if (eventElement && eventElement instanceof HTMLElement) {
            console.log('🎉 Element found! Applying direct mega highlight');

            // Scroll al elemento primero
            eventElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });

            // Aplicar la clase de resaltado desde notificación
            console.log('🌟 Adding highlight-notification-event class to element');
            eventElement.classList.add('highlight-notification-event');

            // Guardar las clases originales para restaurar después
            const originalClasses = eventElement.className;

            // También aplicar estilos inline como backup
            const originalStyles = {
              background: eventElement.style.background,
              border: eventElement.style.border,
              boxShadow: eventElement.style.boxShadow,
              zIndex: eventElement.style.zIndex,
              transform: eventElement.style.transform,
              width: eventElement.style.width,
              height: eventElement.style.height
            };

            // Aplicar estilos inline azules igual que driving test/lesson
            eventElement.style.background = eventElement.style.background;
            eventElement.style.border = '2px solid #3B82F6';
            eventElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
            eventElement.style.zIndex = '1000';
            eventElement.style.position = 'relative';
            eventElement.style.borderRadius = '6px';
            // Asegurar que NO cambie el tamaño
            eventElement.style.transform = 'none';
            eventElement.style.width = 'auto';
            eventElement.style.height = 'auto';

            console.log('Applied inline styles and mega highlight class');

            // Después de 5 segundos, remover el resaltado
            setTimeout(() => {
              console.log('🔄 Removing highlight after 5 seconds');
              eventElement.classList.remove('highlight-notification-event');
              // Restaurar estilos originales
              Object.assign(eventElement.style, originalStyles);
            }, 5000);
          } else if (attempts < maxAttempts) {
            // Intentar de nuevo después de un delay
            setTimeout(findAndHighlightElement, 1000);
          } else {
            console.error('❌ Could not find event element after', maxAttempts, 'attempts');
            console.log('Available elements:');
            console.log('- All .fc-event elements:', document.querySelectorAll('.fc-event').length);
            console.log('- Elements with data-event-id:', document.querySelectorAll('[data-event-id]').length);

            // Intentar buscar por contenido como último recurso
            const allEvents = document.querySelectorAll('.fc-event');
            console.log('🔍 Last resort: searching by content');
            for (const event of allEvents) {
              const eventTitle = event.querySelector('.fc-event-title')?.textContent || '';
              console.log('Event title:', eventTitle);
              if (eventTitle.includes(targetEvent.title.split(' - ')[0])) {
                console.log('✅ Found by content match, applying direct highlight');

                // Scroll al elemento
                event.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'center'
                });

                const eventElement = event as HTMLElement;

                // Aplicar resaltado de notificación
                eventElement.classList.add('highlight-notification-event');

                // Aplicar estilos inline consistentes con driving test/lesson
                const originalStyles = {
                  background: eventElement.style.background,
                  border: eventElement.style.border,
                  boxShadow: eventElement.style.boxShadow,
                  zIndex: eventElement.style.zIndex,
                  transform: eventElement.style.transform,
                  width: eventElement.style.width,
                  height: eventElement.style.height
                };

                eventElement.style.background = eventElement.style.background;
                eventElement.style.border = '2px solid #3B82F6';
                eventElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.8)';
                eventElement.style.zIndex = '1000';
                eventElement.style.position = 'relative';
                eventElement.style.borderRadius = '6px';
                // Asegurar que NO cambie el tamaño
                eventElement.style.transform = 'none';
                eventElement.style.width = 'auto';
                eventElement.style.height = 'auto';

                console.log('Applied notification highlight to content-matched element');

                // Después de 5 segundos, remover el resaltado
                setTimeout(() => {
                  eventElement.classList.remove('highlight-notification-event');
                  Object.assign(eventElement.style, originalStyles);
                }, 5000);

                break;
              }
            }
          }
        };

        // Iniciar la búsqueda
        setTimeout(findAndHighlightElement, 2000); // Aumentar delay para asegurar renderizado completo
      } else {
        console.warn('⚠️ Target event not found in calendar events');
      }
    } else {
      console.log('ℹ️ Highlight effect not triggered:', { highlightEventId, focusClassId, eventsCount: calendarEvents.length });
    }
  }, [highlightEventId, focusClassId, calendarEvents]);

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
    
    // Aplicar efecto visual de selección Y abrir modal para crear slot
    setBlinkingSlot({ start: startDate, end: endDate });
    
    // Configurar selectedSlot para abrir el modal de creación
    setSelectedSlot({
      date: formattedDate,
      hour: formattedStartTime,
      endHour: formattedEndTime,
      type: classType, // Usar el tipo de clase actual del filtro
      status: "available",
      instructorId: "",
      students: [],
      spots: 30,
      classId: focusClassId || "",
      duration: "2h",
      locationId: selectedLocationId,
      studentRequests: [],
    });
    setIsModalOpen(true);
    
    console.log('Slot seleccionado para crear:', {
      date: formattedDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime
    });
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
    
    // Mostrar todas las clases sin filtrar - el calendario debe mostrar todo
    const filteredData = updatedData;
    
    const events = filteredData.map((ticketClass: unknown) => {
      const tc = ticketClass as TicketClassResponse;
      const studentCount = Array.isArray(tc.students) ? tc.students.length : 0;
      const totalSpots = tc.spots || 30;
      
      // Usar el tipo directamente en mayúsculas
      const classType = tc.type.toUpperCase();
      
      let status = "Available";
      if (tc.status === "full") status = "Full";
      else if (tc.status === "cancel") status = "Cancelled";
      else if (tc.status === "expired") status = "Expired";
      
      // Get instructor name
      let instructorName = "Unknown";
      if (typeof tc.instructorId === 'object' && tc.instructorId?.name) {
        instructorName = tc.instructorId.name;
      } else if (typeof tc.instructorId === 'string') {
        // Try to find instructor name from loaded instructors
        const instructor = instructors.find(inst => inst._id === tc.instructorId);
        instructorName = instructor?.name || "Unknown";
      }
      
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
      
      // Calcular endHour correctamente
      let calculatedEndHour = tc.endHour;
      if (!calculatedEndHour || calculatedEndHour.trim() === "" || calculatedEndHour === "00:00") {
        // Calcular endHour basado en hour + duration
        const [startHour, startMinute] = (tc.hour || "00:00").split(':').map(num => parseInt(num, 10));
        const durationHours = tc.duration ? parseFloat(tc.duration.match(/(\d+(?:\.\d+)?)/)?.[1] || "2") : 2;
        const endHourNumber = Math.min(startHour + durationHours, 23);
        calculatedEndHour = `${endHourNumber.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      }
      
      console.log(`🕐 Clase ${tc._id}: ${tc.hour} -> ${calculatedEndHour} (original endHour: ${tc.endHour})`);
      
      return {
        id: tc._id,
        title: `${classType}\n${instructorName}\n${status} (${studentCount}/${totalSpots})`,
        start: `${dateStr}T${tc.hour || "00:00"}`,
        end: `${dateStr}T${calculatedEndHour}`,
        backgroundColor,
        borderColor,
        textColor: "#ffffff",
        extendedProps: {
          ticketClass: tc,
          classType,
          status,
          studentCount,
          totalSpots,
          instructorName
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

      // SIEMPRE actualizar el calendario después de eliminar un ticket
      console.log('🔄 Updating calendar after ticket deletion');
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

      // SIEMPRE actualizar el calendario después de crear un ticket
      console.log('🔄 Updating calendar after ticket creation');
      await refreshCalendar();

    } catch (error) {
      console.error('❌ Error creating TicketClass:', error);
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <>
      <Card className={`${className}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>🗓️ {classType.toUpperCase()} Classes Calendar</CardTitle>
              <p className="text-sm text-gray-600">
                {calendarEvents.length === 0
                  ? `No ${classType.toUpperCase()} classes found`
                  : `Showing ${calendarEvents.length} ${classType.toUpperCase()} class${calendarEvents.length !== 1 ? 'es' : ''}`
                }
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
            eventMinHeight={60}
            eventShortHeight={45}
            unselect={() => {
              // Deseleccionar slot cuando se hace clic fuera
              console.log('Slot deseleccionado');
              setBlinkingSlot(null);
            }}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            initialDate={
              focusClassId && focusWeek && focusYear
                ? (() => {
                    // Calculate date from week and year
                    const firstDayOfYear = new Date(focusYear, 0, 1);
                    const firstWeekStart = new Date(firstDayOfYear);
                    firstWeekStart.setDate(1 - firstDayOfYear.getDay()); // Get to Sunday of first week
                    const targetDate = new Date(firstWeekStart);
                    targetDate.setDate(firstWeekStart.getDate() + (focusWeek - 1) * 7);
                    return targetDate;
                  })()
                : undefined
            }
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
              
              // Aplicar estilos para mostrar texto en múltiples líneas
              const titleEl = info.el.querySelector('.fc-event-title') || info.el.querySelector('.fc-event-title-container') || info.el.querySelector('.fc-event-main');
              
              if (titleEl) {
                const htmlTitleEl = titleEl as HTMLElement;
                htmlTitleEl.style.whiteSpace = 'pre-line';
                htmlTitleEl.style.overflow = 'visible';
                htmlTitleEl.style.textOverflow = 'clip';
                htmlTitleEl.style.fontSize = '10px';
                htmlTitleEl.style.lineHeight = '1.1';
                htmlTitleEl.style.padding = '2px';
                htmlTitleEl.style.wordWrap = 'break-word';
                htmlTitleEl.style.hyphens = 'auto';
              }
              
              // Aplicar estilos al contenedor del evento
              info.el.style.padding = '2px';
              info.el.style.fontSize = '10px';
              info.el.style.lineHeight = '1.1';
              info.el.style.overflow = 'visible';
              info.el.style.whiteSpace = 'pre-line';
              info.el.style.wordWrap = 'break-word';
              
              // Add hover effects
              info.el.style.cursor = 'pointer';
              info.el.style.transition = 'all 0.2s ease';
              
              // Store original colors
              const originalBg = info.el.style.backgroundColor;
              
              // Add hover event listeners (SIN TRANSFORMACIONES)
              info.el.addEventListener('mouseenter', () => {
                // NO APLICAR TRANSFORM - causa encogimiento
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
                // NO APLICAR TRANSFORM - causa encogimiento
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
    </>
  );
};

export default TicketCalendar;
