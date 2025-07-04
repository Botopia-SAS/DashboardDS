import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { EventClickArg } from "@fullcalendar/core";
import { formSchema } from "./instructorFormSchema";
import {
  toValidClassType,
  mapClassTypeForBackend,
} from "./instructorFormUtils";
import { InstructorData, Slot, SlotType, User } from "./types";
import {
  normalizeSchedule,
  splitIntoTwoHourSlots,
  convertTo24HourFormat,
} from "./utils";


export function useInstructorForm(initialData?: InstructorData) {
  const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const scheduleDraftKey = initialData?._id ? `instructorScheduleDraft_${initialData._id}` : undefined;
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<any>({
    start: "",
    end: "",
    booked: false,
    recurrence: "None",
    status: undefined,
    recurrenceEnd: null,
    isEditing: false,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAll, setEditAll] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | string[]>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableSpots, setAvailableSpots] = useState<number>(30);
  const [slotType, setSlotType] = useState<SlotType>("");
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  // Estado para almacenar información de ticket classes cargada
  const [enrichedTicketData, setEnrichedTicketData] = useState<Record<string, any>>({});
  // Estado para almacenar todas las ticket classes del instructor
  const [allInstructorTicketClasses, setAllInstructorTicketClasses] = useState<any[]>([]);
  const [instructorTicketClassesLoaded, setInstructorTicketClassesLoaded] = useState(false);
  // Set de IDs de ticket classes que ya se han cargado en el estado
  const [loadedTicketClassIds, setLoadedTicketClassIds] = useState<Set<string>>(new Set());

  // Cargar TODAS las ticket classes del instructor de una sola vez
  const loadInstructorTicketClasses = async () => {
    if (!initialData?._id) {
      return;
    }
    
    // Solo cargar si aún no se han cargado o se fuerza la recarga
    if (instructorTicketClassesLoaded) {
      // console.log(`[CACHE] Using previously cached ticket classes for instructor: ${initialData._id}`);
      return;
    }

    // console.log(`[CACHE] Loading all ticket classes for instructor: ${initialData._id}`);

    try {
      const res = await fetch(`/api/ticket/classes?instructorId=${initialData._id}`);
      if (res.ok) {
        const ticketClasses = await res.json();
        // console.log(`[CACHE] Loaded ${ticketClasses.length} ticket classes for instructor`);
        
        setAllInstructorTicketClasses(ticketClasses);
        
        // Crear el cache de datos enriquecidos con todas las ticket classes
        const enrichedData: Record<string, any> = { ...enrichedTicketData };
        const newlyLoadedIds = new Set<string>();
        
        ticketClasses.forEach((ticket: any) => {
          const ticketId = ticket._id;
          newlyLoadedIds.add(ticketId);
          
          enrichedData[ticketId] = {
            students: ticket.students || [],
            cupos: ticket.cupos || 30,
            classId: ticket.classId,
            locationId: ticket.locationId,
            amount: ticket.price,
            duration: ticket.duration ? parseInt(String(ticket.duration).replace('h', '')) : 4,
            type: ticket.type,
            date: ticket.date,
            hour: ticket.hour,
            endHour: ticket.endHour,
            // Guardar una copia completa del objeto para tener acceso a todos sus datos
            fullData: ticket
          };
        });
        
        // Actualizar el cache y el conjunto de IDs cargados
        setEnrichedTicketData(enrichedData);
        setLoadedTicketClassIds(prev => new Set([...prev, ...newlyLoadedIds]));
        setInstructorTicketClassesLoaded(true);
        
        // console.log(`[CACHE] Enriched data created for ${Object.keys(enrichedData).length} ticket classes`);
      }
    } catch (error) {
      console.error('Error loading instructor ticket classes:', error);
    }
  };

  // Assigned locations logic (top-level, not inside any function)
  const assignedLocationIds = Array.isArray(initialData?.locationIds)
    ? initialData.locationIds
    : null;
  const filteredLocations = assignedLocationIds
    ? locations.filter((loc) => assignedLocationIds.includes(loc._id))
    : locations;

  useEffect(() => {
    let isMounted = true;
    
    async function loadSchedule() {
      if (!isMounted) return;
      
      setLoadingSchedule(true);
      
      try {
        // Cargar todas las ticket classes del instructor de una sola vez
        await loadInstructorTicketClasses();
        
        if (!isMounted) return;
        
        // Start with the original schedule exactly as stored in the database
        // DO NOT modify it - this is our baseline for diff comparison
        const originalSchedule = normalizeSchedule(initialData?.schedule || []);
        
        // console.log('[LOAD] Starting with original schedule:', originalSchedule.length, 'slots');
        // console.log('[LOAD] Original schedule structure:', originalSchedule.map(s => ({
        //   date: s.date,
        //   start: s.start,
        //   end: s.end,
        //   classType: s.classType,
        //   ticketClassId: s.ticketClassId,
        //   slotId: s.slotId
        // })));
        
        // Set the schedule to exactly match what's in the database
        // This ensures perfect diff matching - no transformations here
        if (isMounted) {
          setSchedule(originalSchedule);
          setLoadingSchedule(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('[LOAD] Error loading schedule:', error);
          setLoadingSchedule(false);
        }
      }
    }
    
    loadSchedule();
    
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  // Efecto para cargar las ticket classes del instructor al inicio
  useEffect(() => {
    let isMounted = true;
    
    if (initialData?._id && !instructorTicketClassesLoaded) {
      loadInstructorTicketClasses().catch(error => {
        if (isMounted) {
          console.error('[EFFECT] Error loading instructor ticket classes:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialData?._id]);

  useEffect(() => {
    if (typeof window !== "undefined" && scheduleDraftKey) {
      localStorage.setItem(scheduleDraftKey, JSON.stringify(schedule));
    }
  }, [schedule, scheduleDraftKey]);

  // Detect changes in schedule and update hasChanges state
  useEffect(() => {
    const originalSchedule = normalizeSchedule(initialData?.schedule || []);
    const changes = calculateScheduleChangesProfessional(originalSchedule, schedule);
    
    const hasRealChanges = changes.toCreate.length > 0 || 
                          changes.toUpdate.length > 0 || 
                          changes.toDelete.length > 0;
    
    setHasChanges(hasRealChanges);
    
    if (hasRealChanges) {
      console.log('[CHANGES] Changes detected:', {
        toCreate: changes.toCreate.length,
        toUpdate: changes.toUpdate.length,
        toDelete: changes.toDelete.length
      });
    }
  }, [schedule, initialData]);

  const clearScheduleDraft = () => {
    if (typeof window !== "undefined" && scheduleDraftKey) {
      localStorage.removeItem(scheduleDraftKey);
    }
  };

  // Función para descartar todos los cambios y restablecer al estado original
  const discardAllChanges = () => {
    // Restablecer el schedule a los valores originales
    const originalSchedule = normalizeSchedule(initialData?.schedule || []);
    setSchedule(originalSchedule);
    
    // Limpiar localStorage
    clearScheduleDraft();
    
    // Restablecer estado del modal
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSelectedStudents([]);
    setAvailableSpots(30);
    setSlotType("");
    setRecurrenceEnd(null);
    
    // console.log('[DISCARD] All changes have been discarded, state restored to original');
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        const filtered = users
          .filter((u: User) => u.role?.toLowerCase() === "user")
          .map((u: User) => ({
            ...u,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }));
        setAllUsers(filtered);
      } catch {
        toast.error("Could not load students.");
      }
    };
    if (isModalOpen) {
      fetchUsers();
    }
  }, [isModalOpen]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        setLocations(data);
      } catch {
        toast.error("Could not load locations");
      }
    };
    fetchLocations();
  }, []);

  // Función para enriquecer eventos del calendario con datos de ticket classes
  const enrichCalendarEvents = async () => {
    try {
      // Si ya cargamos todas las ticket classes del instructor, no necesitamos hacer nada más
      if (instructorTicketClassesLoaded && allInstructorTicketClasses.length > 0) {
        console.log('[CACHE] Using pre-loaded instructor ticket classes for enrichment');
        return;
      }
      
      // En caso contrario, usar el enfoque original de cargar las clases individualmente
      const ticketClassIds = schedule
        .filter(slot => slot.ticketClassId)
        .map(slot => slot.ticketClassId!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // unique IDs

      if (ticketClassIds.length === 0) return;

      // Solo cargar los que no hemos cargado ya
      const idsToLoad = ticketClassIds.filter(id => !loadedTicketClassIds.has(id));
      
      if (idsToLoad.length === 0) {
        console.log('[CACHE] All ticket class data already loaded, skipping API calls');
        return;
      }

      console.log(`[CACHE] Loading ${idsToLoad.length} new ticket classes out of ${ticketClassIds.length} total`);

      const enrichedData: Record<string, any> = { ...enrichedTicketData };
      const newlyLoaded = new Set<string>();

      // Cargar solo los datos que no tenemos aún
      for (const ticketClassId of idsToLoad) {
        try {
          const res = await fetch(`/api/ticket/classes/${ticketClassId}`);
          if (res.ok) {
            const ticketData = await res.json();
            enrichedData[ticketClassId] = {
              students: ticketData.students || [],
              cupos: ticketData.cupos || 30,
              classId: ticketData.classId,
              locationId: ticketData.locationId,
              amount: ticketData.price,
              duration: ticketData.duration,
              type: ticketData.type,
              date: ticketData.date,
              hour: ticketData.hour,
              endHour: ticketData.endHour,
            };
            newlyLoaded.add(ticketClassId);
            console.log(`[CACHE] Loaded ticket class data for ${ticketClassId}:`, enrichedData[ticketClassId]);
          } else {
            console.warn(`[CACHE] Failed to load ticket class ${ticketClassId}: ${res.status}`);
          }
        } catch (error) {
          console.error(`[CACHE] Error loading ticket class ${ticketClassId}:`, error);
          // Continue with other ticket classes even if one fails
        }
      }

      if (newlyLoaded.size > 0) {
        setEnrichedTicketData(enrichedData);
        setLoadedTicketClassIds(prev => new Set([...prev, ...newlyLoaded]));
        console.log(`[CACHE] Successfully loaded ${newlyLoaded.size} new ticket classes`);
      }
    } catch (error) {
      console.error('[CACHE] Error in enrichCalendarEvents:', error);
      // Don't throw - this is not critical for the app to function
    }
  };

  // useEffect para cargar datos de ticket classes cuando cambie el schedule
  useEffect(() => {
    let isMounted = true;
    
    if (schedule.length > 0) {
      const hasTicketClasses = schedule.some(slot => slot.ticketClassId);
      if (hasTicketClasses && isMounted) {
        enrichCalendarEvents().catch(error => {
          if (isMounted) {
            console.error('[EFFECT] Error enriching calendar events:', error);
          }
        });
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [schedule]);

  const calendarEvents = schedule.map((slot: Slot) => {
    // Para ticket classes, usar datos enriquecidos si están disponibles
    let studentCount = 0;
    let totalCupos = 30;
    
    if (slot.ticketClassId && enrichedTicketData[slot.ticketClassId]) {
      const ticketData = enrichedTicketData[slot.ticketClassId];
      studentCount = Array.isArray(ticketData.students) ? ticketData.students.length : 0;
      totalCupos = ticketData.cupos || 30;
      
      // Asegurar que el slot tenga toda la información necesaria desde la caché
      if (!slot.classId && ticketData.classId) {
        slot.classId = ticketData.classId;
      }
      
      if (!slot.locationId && ticketData.locationId) {
        slot.locationId = ticketData.locationId;
      }
      
      if (!slot.students && ticketData.students) {
        slot.students = ticketData.students;
      }
      
      if (!slot.cupos && ticketData.cupos) {
        slot.cupos = ticketData.cupos;
      }
      
      if (!slot.amount && ticketData.amount) {
        slot.amount = ticketData.amount;
      }
      
      // Asegurar que el tipo de clase sea correcto para DATE, BDI, ADI
      if (ticketData.type && ["date", "bdi", "adi"].includes(ticketData.type.toLowerCase())) {
        slot.classType = ticketData.type.toUpperCase() === "DATE" ? "D.A.T.E" : 
                         ticketData.type.toUpperCase() === "BDI" ? "B.D.I" : 
                         ticketData.type.toUpperCase() === "ADI" ? "A.D.I" : 
                         slot.classType;
      }
    } else if (slot.students) {
      // Fallback a datos del slot si existen
      studentCount = Array.isArray(slot.students) ? slot.students.length : 0;
      totalCupos = slot.cupos || 30;
    }

    return {
    title:
      (slot.status === "scheduled"
        ? "Booked"
        : slot.status === "full"
        ? "Full"
        : slot.status === "cancelled"
        ? "Cancelled"
        : slot.status === "available"
        ? "Available"
        : slot.booked
        ? "Booked"
        : "Available") +
      (slot.classType ? ` - ${slot.classType}` : "") +
      (["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "") ? 
        ` (${studentCount}/${totalCupos})` : ""),
    start: `${slot.date}T${slot.start}`,
    end: `${slot.date}T${slot.end}`,
    backgroundColor:
      slot.status === "scheduled"
        ? "blue"
        : slot.status === "full"
        ? "purple"
        : slot.status === "cancelled"
        ? "red"
        : slot.status === "available"
        ? "gray"
        : slot.booked
        ? "blue"
        : "green",
    borderColor:
      slot.status === "scheduled"
        ? "darkblue"
        : slot.status === "full"
        ? "darkpurple"
        : slot.status === "cancelled"
        ? "darkred"
        : slot.status === "available"
        ? "darkgray"
        : slot.booked
        ? "darkblue"
        : "darkgreen",
    textColor: "white",
    extendedProps: {
      recurrence: slot.recurrence || "None",
      booked: slot.booked ?? false,
      studentId: Array.isArray(slot.studentId)
        ? (slot.studentId.length > 0 ? slot.studentId[0] : null)
        : slot.studentId || null,
      slotId: slot.slotId,
      students: slot.students || [],
      cupos: slot.cupos || 30,
    },
    };
  });

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
  };

  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    const start = selectInfo.startStr;
    let end = selectInfo.endStr;
    
    // Si no hay un end específico o es muy corto, establecer 2 horas por defecto
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    // Si la duración es menor a 30 minutos (click rápido), establecer 2 horas por defecto
    if (durationMinutes < 30) {
      const defaultEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 horas
      end = defaultEndDate.toISOString();
    }
    
    // Limpiar estado para nuevo slot
    setCurrentSlot({ start, end, booked: false, recurrence: "None" });
    setSelectedStudents([]); // Limpiar estudiantes seleccionados
    setSelectedStudent(""); // Limpiar estudiante individual
    setAvailableSpots(30); // Resetear cupos a valor por defecto
    setSlotType(""); // Limpiar tipo de slot
    setIsModalOpen(true);
  };

  const originalTicketClassIds: string[] = Array.isArray(initialData?.schedule)
    ? initialData.schedule
        .filter((s: Slot) => !!s.ticketClassId)
        .map((s: Slot) => s.ticketClassId as string)
    : [];

  const handleDeleteSlot = async () => {
    if (!currentSlot) {
      console.warn('[DELETE] No current slot to delete');
      return;
    }
    
    try {
      console.log('[DELETE] Starting deletion process for slot:', {
        slotId: currentSlot.slotId,
        ticketClassId: currentSlot.ticketClassId,
        date: currentSlot.start.split("T")[0],
        start: currentSlot.start.split("T")[1],
        end: currentSlot.end.split("T")[1]
      });
      
      // Eliminar visualmente el slot (las eliminaciones reales se harán en onSubmit usando el diff)
      setSchedule((prevSchedule: Slot[]) =>
        prevSchedule.filter((slot: Slot) => {
          // Elimina por slotId si existe
          if (currentSlot.slotId && slot.slotId === currentSlot.slotId) return false;
          // Elimina por ticketClassId si existe
          if (currentSlot.ticketClassId && slot.ticketClassId === currentSlot.ticketClassId) return false;
          // Elimina por fecha/hora si no hay id
          if (
            !currentSlot.slotId && !currentSlot.ticketClassId &&
            slot.date === currentSlot.start.split("T")[0] &&
            slot.start === currentSlot.start.split("T")[1] &&
            slot.end === currentSlot.end.split("T")[1]
          ) return false;
          return true;
        })
      );
      
      // Clean up state before closing modal to prevent stale state issues
      const modalCleanup = () => {
        setIsModalOpen(false);
        setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
        setSelectedStudent("");
        setSelectedStudents([]);
        setAvailableSpots(30);
      };
      
      // Use setTimeout to ensure state updates are processed before cleanup
      setTimeout(modalCleanup, 0);
      
      console.log('[DELETE] Visual deletion completed successfully');
      toast.success("Slot deleted! Remember to press 'Save Changes' to save to the database.");
      
    } catch (error) {
      console.error('[DELETE] Error during visual deletion:', error);
      toast.error("Error deleting slot. Please try again.");
      
      // Still clean up modal state even if there was an error
      setIsModalOpen(false);
      setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
      setSelectedStudent("");
      setSelectedStudents([]);
      setAvailableSpots(30);
    }
  };

  function getSlotStatus(slotType: SlotType, isTicketClass: boolean = false): "available" | "cancelled" | "scheduled" | "full" {
    if (isTicketClass) {
      // Para ticket classes, no usar "scheduled", solo "available", "cancelled", "full"
      if (slotType === "full") return "full";
      if (slotType === "cancelled") return "cancelled";
      return "available";
    } else {
      // Para driving test, mantener lógica original
      if (slotType === "booked") return "scheduled";
      if (slotType === "full") return "full";
      if (slotType === "cancelled") return "cancelled";
      return "available";
    }
  }

  const handleUpdateSlot = async () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];
    
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType);
    
    // Verificar superposición de horarios antes de actualizar
    const tempSlot: Slot = {
      date,
      start: startTime, 
      end: endTime,
      classType: toValidClassType(currentSlot.classType),
      ticketClassId: currentSlot.ticketClassId // Incluimos el ID para que no se compare consigo mismo
    };
    
    // Filtrar el schedule actual excluyendo el slot que estamos editando
    const otherSlots = schedule.filter(slot => {
      if (currentSlot.ticketClassId) {
        return slot.ticketClassId !== currentSlot.ticketClassId;
      }
      return slot.slotId !== currentSlot.originalSlotId;
    });
    
    const { overlaps, overlappingSlot } = checkTimeOverlap(tempSlot, otherSlots);
    
    if (overlaps) {
      console.error('[UPDATE] Time overlap detected:', { 
        new: { date, start: startTime, end: endTime },
        existing: overlappingSlot 
      });
      
      // Mostrar mensaje detallado al usuario
      toast.error(`Error: Ya existe una clase programada de ${overlappingSlot?.start || 'inicio'} a ${overlappingSlot?.end || 'fin'} en esta fecha.`);
      return;
    }
    
    // Actualizar el schedule - el diff system se encargará de detectar los cambios
    setSchedule((prevSchedule: Slot[]) => {
      // Remover el slot original
      const filtered = prevSchedule.filter(slot => slot.slotId !== currentSlot.originalSlotId);
      const newSlotId = uuidv4();
      
      // Crear el nuevo slot - ensure we preserve the ticketClassId
      // Find the original slot in the schedule to get the ticketClassId if needed
      const originalTicketClassId = currentSlot.ticketClassId || 
                                    (currentSlot.originalSlotId && 
                                     schedule.find(s => s.slotId === currentSlot.originalSlotId)?.ticketClassId);
      
      console.log('[UPDATE] Preserving ticket class ID:', {
        fromCurrentSlot: currentSlot.ticketClassId,
        fromOriginalSlot: originalTicketClassId,
        willUse: originalTicketClassId || currentSlot.ticketClassId
      });
      
      const newSlot = {
        ...currentSlot,
        date,
        start: startTime,
        end: endTime,
        booked: !isTicketClass && slotType === "booked", // Solo para driving test
        studentId: !isTicketClass && slotType === "booked" ? selectedStudent : null,
        status: getSlotStatus(slotType, isTicketClass),
        recurrence: currentSlot.recurrence,
        slotId: newSlotId,
        classType: toValidClassType(currentSlot.classType),
        amount: currentSlot.amount,
        paid: currentSlot.paid,
        pickupLocation: currentSlot.pickupLocation,
        dropoffLocation: currentSlot.dropoffLocation,
        locationId: currentSlot.locationId,
        duration: currentSlot.duration,
        classId: currentSlot.classId,
        // Keep existing ticketClassId if it exists (for updates), otherwise it will be created
        // Use the original ticketClassId if we found it
        ticketClassId: originalTicketClassId || currentSlot.ticketClassId,
        // Para ticket classes, incluir estudiantes y cupos
        students: isTicketClass ? selectedStudents : undefined,
        cupos: isTicketClass ? availableSpots : undefined,
      };
      
      // Si es una ticket class, actualizar los datos enriquecidos
      if (isTicketClass && newSlot.ticketClassId) {
        setEnrichedTicketData(prev => ({
          ...prev,
          [newSlot.ticketClassId!]: {
            students: selectedStudents,
            cupos: availableSpots,
            classId: currentSlot.classId,
            locationId: currentSlot.locationId,
            amount: currentSlot.amount,
            duration: currentSlot.duration ? parseInt(currentSlot.duration.replace('h', '')) : undefined,
          }
        }));
      }
      
      return [...filtered, newSlot];
    });
    
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    toast.success(
      "Slot updated! Remember to press 'Save Changes' to save to the database."
    );
  };

  // Función para generar fechas de recurrencia
  const generateRecurringDates = (startDate: string, recurrence: string, endDate: string | null): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    // Siempre incluir la fecha inicial
    dates.push(startDate);
    
    if (recurrence === "None" || !end) {
      return dates;
    }
    
    const current = new Date(start);
    
    while (current <= end) {
      if (recurrence === "Daily") {
        current.setDate(current.getDate() + 1);
      } else if (recurrence === "Weekly") {
        current.setDate(current.getDate() + 7);
      } else if (recurrence === "Monthly") {
        current.setMonth(current.getMonth() + 1);
      }
      
      if (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const handleSaveSlot = async () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    
    console.log('[SAVE_SLOT] currentSlot:', currentSlot);
    
    if (!slotType) {
      toast.error("Please select a slot type.");
      return;
    }
    
    // Para módulos ADI, BDI, DATE
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType);
    
    if (isTicketClass) {
      // Validar campos requeridos para ticket classes
      if (!currentSlot.classId) {
        toast.error("Please select a driving class for this type of lesson.");
        return;
      }
      
      if (!currentSlot.locationId) {
        toast.error("Please select a location for this class.");
        return;
      }
      
      // Validar cupos para ticket classes
      if (!availableSpots || availableSpots <= 0) {
        toast.error("Please enter the number of available spots.");
        return;
      }
      
      // Para ticket classes, solo permitir "available", "cancelled" o "full"
      if (!["available", "cancelled", "full"].includes(slotType)) {
        toast.error("Please select a valid status for this class type.");
        return;
      }
      
      // Si es Available, permitir agregar estudiantes
      if (slotType === "available" && selectedStudents.length > availableSpots) {
        toast.error(`Cannot add more students than available spots (${availableSpots}).`);
        return;
      }
      
      // Si está lleno, cambiar a "full"
      if (selectedStudents.length >= availableSpots) {
        setSlotType("full");
      }
    } else {
      // Para driving test, mantener lógica original
      if (slotType === "booked" && !selectedStudent) {
        toast.error("Please select a student for a booked slot.");
        return;
      }
    }
    // Prevent saving slot for unassigned location
    if (assignedLocationIds && currentSlot.locationId && !assignedLocationIds.includes(currentSlot.locationId)) {
      toast.error("You must assign the instructor to this location before adding a class here.");
      return;
    }
    
    // Validar recurrencia
    if (currentSlot.recurrence !== "None" && !recurrenceEnd) {
      toast.error("Please select an end date for the recurring slot.");
      return;
    }
    
    // --- Ensure locationId is always a string (the _id) ---
    let locationId = currentSlot.locationId;
    if (locationId && typeof locationId === 'object' && '_id' in locationId) {
      locationId = locationId._id;
    }
    if (locationId && typeof locationId !== 'string') {
      locationId = String(locationId);
    }
    // ---
    
    // Generar las fechas de recurrencia
    const startDate = currentSlot.start.split("T")[0];
    const recurringDates = generateRecurringDates(startDate, currentSlot.recurrence, recurrenceEnd);
    
    console.log("Generating recurring slots:", { 
      startDate, 
      recurrence: currentSlot.recurrence, 
      endDate: recurrenceEnd, 
      dates: recurringDates 
    });
    
    if (currentSlot.classType === "driving test") {
      // Para driving test, crear un slot completo sin dividir por duración
      const allNewSlots: Slot[] = [];
      
      for (const date of recurringDates) {
        const rawStartTime = currentSlot.start.split("T")[1];
        const rawEndTime = currentSlot.end.split("T")[1];
        
        // Convertir a formato 24 horas
        const startTime = convertTo24HourFormat(rawStartTime);
        const endTime = convertTo24HourFormat(rawEndTime);
        
        console.log('[SAVE_SLOT] Driving test time conversion:', { 
          date, rawStartTime, rawEndTime, startTime, endTime 
        });
        
        // Crear un solo slot con la duración completa
        const newSlot: Slot = {
          date,
          start: startTime,
          end: endTime,
          booked: slotType === "booked",
          studentId: slotType === "booked" ? selectedStudent : null,
          status: getSlotStatus(slotType, false), // driving test is not a ticket class
          classType: currentSlot.classType,
          amount: currentSlot.amount,
          paid: currentSlot.paid,
          pickupLocation: currentSlot.pickupLocation,
          dropoffLocation: currentSlot.dropoffLocation,
          slotId: uuidv4(), // Nuevo ID para cada slot
          locationId,
        };
        
        allNewSlots.push(newSlot);
      }
      
      // Verificar overlaps
      for (const slot of allNewSlots) {
        if (
          schedule.some(
            (s: Slot) =>
              s.date === slot.date && s.start === slot.start && s.end === slot.end
          )
        ) {
          toast.error(`Slot already exists for ${slot.date} at ${slot.start}-${slot.end}.`);
          return;
        }
      }
      
      setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
      setIsModalOpen(false);
      setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
      setSelectedStudent("");
      setSlotType("");
      setRecurrenceEnd(null);
      toast.success(`${allNewSlots.length} slots saved for ${recurringDates.length} dates!`);
      return;
    }      
    
    // Para otros tipos de clase (incluidos ticketclass)
    const allNewSlots: Slot[] = [];
    const rawStart = currentSlot.start.split("T")[1].slice(0, 5);
    const rawEnd = currentSlot.end.split("T")[1].slice(0, 5);
    
    // Convertir a formato 24 horas para asegurar compatibilidad
    const newStart = convertTo24HourFormat(rawStart);
    const newEnd = convertTo24HourFormat(rawEnd);
    
    console.log('[SAVE_SLOT] Time conversion:', { rawStart, rawEnd, newStart, newEnd });
    
    // Primero verificar todas las superposiciones para evitar crear ninguna si hay errores
    for (const date of recurringDates) {
      // Crear slot temporal para verificar superposiciones
      const tempSlot: Slot = {
        date,
        start: newStart,
        end: newEnd,
        status: getSlotStatus(slotType, isTicketClass),
        classType: toValidClassType(currentSlot.classType),
      };
      
      // Verificar superposición con la nueva función
      const { overlaps, overlappingSlot } = checkTimeOverlap(tempSlot, schedule);
      
      if (overlaps) {
        console.error('[SAVE_SLOT] Time overlap detected:', { 
          new: { date, start: newStart, end: newEnd },
          existing: overlappingSlot 
        });
        
        // Mostrar mensaje detallado al usuario
        toast.error(`Error: Ya existe una clase programada de ${overlappingSlot?.start || 'inicio'} a ${overlappingSlot?.end || 'fin'} en esta fecha.`);
        return;
      }
    }
    
    // Para todos los tipos de clases, crear slots visuales/temporales
    // Solo las ticket classes se crearán en la BD cuando se haga clic en "Save Changes"
    for (const date of recurringDates) {
      let tempId: string | undefined = undefined;
      
      // Si es una ticket class, generar un ID temporal único e independiente
      if (isTicketClass) {
        // Crear un ID temporal único que incluya la fecha para garantizar independencia
        tempId = `temp-${date}-${newStart}-${uuidv4()}`;
        console.log(`[SAVE_SLOT] Creating independent temporary ticket class slot with ID: ${tempId}`);
      }
      
      const newSlot: Slot = {
        status: getSlotStatus(slotType, isTicketClass),
        cupos: isTicketClass ? availableSpots : 30,
        date: date,
        start: newStart,
        end: newEnd,
        classType: toValidClassType(currentSlot.classType),
        classId: currentSlot.classId,
        duration: currentSlot.duration,
        locationId: locationId,
        amount: currentSlot.amount,
        paid: currentSlot.paid,
        pickupLocation: currentSlot.pickupLocation,
        dropoffLocation: currentSlot.dropoffLocation,
        students: isTicketClass ? selectedStudents : undefined,
        slotId: uuidv4(),
        // Para driving test slots, no usar ticketClassId
        // Para ticket classes, usar ID temporal que se reemplazará al guardar
        booked: !isTicketClass && slotType === "booked",
        studentId: !isTicketClass && slotType === "booked" ? selectedStudent : null,
        ticketClassId: isTicketClass ? tempId : undefined,
        isTemporary: isTicketClass ? true : undefined,
        // Agregar metadatos para tracking independiente
        createdAsRecurrence: currentSlot.recurrence !== "None",
        originalRecurrenceGroup: currentSlot.recurrence !== "None" ? uuidv4() : undefined
      };
      
      allNewSlots.push(newSlot);
      
      // Si es una ticket class, actualizar el cache local con datos temporales
      if (isTicketClass && tempId) {
        const tempTicketData = {
          students: selectedStudents || [],
          cupos: availableSpots || 30,
          classId: currentSlot.classId,
          locationId: locationId,
          amount: currentSlot.amount,
          duration: currentSlot.duration ? parseInt(String(currentSlot.duration).replace('h', '')) : 4,
          type: mapClassTypeForBackend(toValidClassType(currentSlot.classType)),
          date: date,
          hour: newStart,
          endHour: newEnd,
          isTemporary: true,
          createdAsRecurrence: currentSlot.recurrence !== "None"
        };
        
        setEnrichedTicketData(prev => ({
          ...prev,
          [tempId]: tempTicketData
        }));
        
        console.log(`[SAVE_SLOT] Added independent temporary ticket class data to cache: ${tempId}`);
      }
    }
    
    setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
    
    // Si es una ticket class, actualizar los datos enriquecidos para todos los slots creados
    if (isTicketClass) {
      const ticketDataUpdate = {
        students: selectedStudents,
        cupos: availableSpots,
        classId: currentSlot.classId,
        locationId: currentSlot.locationId,
        amount: currentSlot.amount,
        duration: currentSlot.duration ? parseInt(String(currentSlot.duration).replace('h', '')) : undefined,
      };
      
      setEnrichedTicketData(prev => {
        const updated = { ...prev };
        allNewSlots.forEach(slot => {
          if (slot.ticketClassId) {
            updated[slot.ticketClassId] = ticketDataUpdate;
          }
        });
        return updated;
      });
    }
    
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSelectedStudents([]);
    setAvailableSpots(30);
    setSlotType("");
    setRecurrenceEnd(null);
    
    // Message depends on whether ticket classes were created
    const hasTicketClasses = allNewSlots.some((slot: Slot) => isTicketClass && slot.isTemporary);
    if (hasTicketClasses) {
      toast.success(`${allNewSlots.length} classes added to schedule! Click 'Save Changes' to create them in the database.`);
    } else {
      toast.success(`${allNewSlots.length} slots saved for ${recurringDates.length} dates! Remember to press 'Save Changes' to save to the database.`);
    }
  };

  const handleEventClick = async (eventInfo: EventClickArg) => {
    const { start, end, extendedProps } = eventInfo.event;
    if (!start || !end) {
      return;
    }
    let realSlot: Slot | undefined;
    if (extendedProps && extendedProps.slotId) {
      realSlot = schedule.find((s: Slot) => s.slotId === extendedProps.slotId);
    }
    if (!realSlot) {
      const formattedStart = start.toISOString().split("T")[0] + "T" + start.toTimeString().slice(0, 5);
      const formattedEnd = end.toISOString().split("T")[0] + "T" + end.toTimeString().slice(0, 5);
      realSlot = schedule.find(
        (s: Slot) =>
          s.date === formattedStart.split("T")[0] &&
          s.start === formattedStart.split("T")[1] &&
          s.end === formattedEnd.split("T")[1]
      );
    }

    // Para ticket classes, cargar información completa desde la base de datos
    if (realSlot && realSlot.ticketClassId) {
      // Primero intentar usar datos del cache local
      const cachedData = enrichedTicketData[realSlot.ticketClassId];
      
      if (cachedData && loadedTicketClassIds.has(realSlot.ticketClassId)) {
        console.log("Using cached ticket class data for editing:", realSlot.ticketClassId);
        
        // Usar datos del cache
        const classType = realSlot.classType || 'D.A.T.E';

        setCurrentSlot({
          start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
          end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
          booked: realSlot.booked || false,
          recurrence: realSlot.recurrence || "None",
          isEditing: true,
          originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
          originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
          slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
          originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
          studentId: Array.isArray(realSlot.studentId)
            ? (realSlot.studentId[0] || "")
            : (realSlot.studentId || ""),
          status: realSlot.status,
          classType: classType,
          classId: cachedData.classId || realSlot.classId,
          amount: cachedData.amount || realSlot.amount,
          duration: cachedData.duration ? `${cachedData.duration}h` : (realSlot.duration || ''),
          paid: realSlot.paid,
          pickupLocation: realSlot.pickupLocation,
          dropoffLocation: realSlot.dropoffLocation,
          locationId: cachedData.locationId || realSlot.locationId,
          cupos: cachedData.cupos || 30,
          students: cachedData.students || [],
        });
        
        // Configurar datos específicos para ticket classes
        const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
        if (isTicketClass) {
          const cuposValue = cachedData.cupos || 30;
          const studentsValue = cachedData.students || [];
          
          setAvailableSpots(cuposValue);
          setSelectedStudents(studentsValue);
          
          // Determinar el estado del slot basado en la cantidad de estudiantes
          const studentCount = studentsValue.length;
          if (studentCount >= cuposValue) {
            setSlotType("full");
          } else if (realSlot.status === "cancelled") {
            setSlotType("cancelled");
          } else {
            setSlotType("available");
          }
        }
        
        setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
        setIsModalOpen(true);
        return;
      }
      
      // Check if this is a temporary ticket class ID
      if (realSlot.ticketClassId.startsWith('temp-')) {
        console.log("Editing temporary ticket class (using cached data only):", realSlot.ticketClassId);
        
        // For temporary ticket classes, we must use only cached data
        const cachedData = enrichedTicketData[realSlot.ticketClassId];
        
        if (cachedData) {
          // Use cached data for temporary slot
          const classType = realSlot.classType || 'D.A.T.E';

          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: cachedData.classId || realSlot.classId,
            amount: cachedData.amount || realSlot.amount,
            duration: cachedData.duration ? `${cachedData.duration}h` : (realSlot.duration || ''),
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: cachedData.locationId || realSlot.locationId,
            cupos: cachedData.cupos || 30,
            students: cachedData.students || [],
            ticketClassId: realSlot.ticketClassId // Keep the temporary ID
          });
          
          // Configure ticket class specific data
          const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
          if (isTicketClass) {
            const cuposValue = cachedData.cupos || 30;
            const studentsValue = cachedData.students || [];
            
            setAvailableSpots(cuposValue);
            setSelectedStudents(studentsValue);
            
            // Determine slot status based on student count
            const studentCount = studentsValue.length;
            if (studentCount >= cuposValue) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        } else {
          console.warn("No cached data found for temporary ticket class:", realSlot.ticketClassId);
          // Fall back to slot data directly
          const classType = realSlot.classType || 'D.A.T.E';
          
          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: realSlot.classId,
            amount: realSlot.amount,
            duration: realSlot.duration || '',
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: realSlot.locationId,
            cupos: realSlot.cupos || 30,
            students: realSlot.students || [],
            ticketClassId: realSlot.ticketClassId // Keep the temporary ID
          });
          
          // Configure using slot data
          const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
          if (isTicketClass) {
            setAvailableSpots(realSlot.cupos || 30);
            setSelectedStudents(realSlot.students || []);
            
            const studentCount = (realSlot.students || []).length;
            const totalSpots = realSlot.cupos || 30;
            if (studentCount >= totalSpots) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        }
      }
      
      // Si no hay datos en cache, cargar desde la API (como respaldo) - only for real IDs
      try {
        console.log("Loading ticket class data from API (cache miss):", realSlot.ticketClassId);
        const res = await fetch(`/api/ticket/classes/${realSlot.ticketClassId}`);
        if (res.ok) {
          const ticket = await res.json();
          console.log("Loaded ticket class data for editing:", ticket);
          
          // Actualizar el cache para futuras consultas
          const ticketDataForCache = {
            students: ticket.students || [],
            cupos: ticket.cupos || 30,
            classId: ticket.classId,
            locationId: ticket.locationId,
            amount: ticket.price,
            duration: ticket.duration,
          };
          setEnrichedTicketData(prev => ({
            ...prev,
            [realSlot.ticketClassId!]: ticketDataForCache
          }));
          setLoadedTicketClassIds(prev => new Set([...prev, realSlot.ticketClassId!]));
          
          // Mapear el tipo correcto
          const classType = ticket.type === 'date' ? 'D.A.T.E' : 
                           ticket.type === 'bdi' ? 'B.D.I' : 
                           ticket.type === 'adi' ? 'A.D.I' : 
                           ticket.type;

          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: ticket.classId,
            amount: ticket.price || realSlot.amount,
            duration: ticket.duration ? `${ticket.duration}h` : '',
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: ticket.locationId,
            cupos: ticket.cupos || realSlot.cupos || 30,
            students: ticket.students || [],
          });
          
          // Configurar datos específicos para ticket classes
          const isTicketClass = ["date", "bdi", "adi"].includes(ticket.type);
          if (isTicketClass) {
            const cuposValue = ticket.cupos || realSlot.cupos || 30;
            const studentsValue = ticket.students || [];
            
            setAvailableSpots(cuposValue);
            setSelectedStudents(studentsValue);
            
            // Actualizar datos enriquecidos
            setEnrichedTicketData(prev => ({
              ...prev,
              [realSlot.ticketClassId!]: {
                students: studentsValue,
                cupos: cuposValue,
                classId: ticket.classId,
                locationId: ticket.locationId,
                amount: ticket.price,
                duration: ticket.duration,
              }
            }));
            
            console.log("Setting ticket class data:", {
              cupos: cuposValue,
              students: studentsValue,
              studentCount: studentsValue.length
            });
            
            // Determinar el estado del slot basado en la cantidad de estudiantes
            const studentCount = studentsValue.length;
            if (studentCount >= cuposValue) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          } else {
            // Para driving test, usar lógica original
            setSlotType(realSlot.status === "scheduled" ? "booked" : realSlot.status === "cancelled" ? "cancelled" : "available");
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.error("Error loading ticket class data:", error);
      }
    }
    // Para slots regulares (driving tests o slots sin ticketClassId)
    setCurrentSlot({
      start: realSlot?.start ? `${realSlot.date}T${realSlot.start}` : "",
      end: realSlot?.end ? `${realSlot.date}T${realSlot.end}` : "",
      booked: realSlot?.booked || false,
      recurrence: realSlot?.recurrence || "None",
      isEditing: true,
      originalStart: realSlot?.start ? `${realSlot.date}T${realSlot.start}` : "",
      originalEnd: realSlot?.end ? `${realSlot.date}T${realSlot.end}` : "",
      slotId: realSlot?.slotId || uuidv4(),
      originalSlotId: realSlot?.slotId || uuidv4(),
      studentId: Array.isArray(realSlot?.studentId)
        ? (realSlot?.studentId[0] || "")
        : (realSlot?.studentId || ""),
      status: realSlot?.status,
      classType: realSlot?.classType,
      classId: realSlot?.classId,
      amount: realSlot?.amount,
      duration: realSlot?.duration,
      paid: realSlot?.paid,
      pickupLocation: realSlot?.pickupLocation,
      dropoffLocation: realSlot?.dropoffLocation,
      locationId: realSlot?.locationId,
      cupos: realSlot?.cupos,
      students: realSlot?.students || [],
    });
    
    // Configurar datos para slots regulares
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(realSlot?.classType || "");
    if (isTicketClass) {
      setAvailableSpots(realSlot?.cupos || 30);
      setSelectedStudents(realSlot?.students || []);
      const studentCount = (realSlot?.students || []).length;
      const totalSpots = realSlot?.cupos || 30;
      if (studentCount >= totalSpots) {
        setSlotType("full");
      } else if (realSlot?.status === "cancelled") {
        setSlotType("cancelled");
      } else {
        setSlotType("available");
      }
    } else {
      // Para driving test, usar lógica original
      if (realSlot?.status === "scheduled") setSlotType("booked");
      else if (realSlot?.status === "cancelled") setSlotType("cancelled");
      else setSlotType("available");
    }
    
    if (realSlot?.status === "scheduled" && realSlot?.studentId) {
      setSelectedStudent(realSlot.studentId);
    } else {
      setSelectedStudent("");
    }
    setIsModalOpen(true);
  };

  const form = useForm<InstructorData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      dni: initialData?.dni || "",
      email: initialData?.email || "",
      password: "",
      photo: initialData?.photo || "",
      certifications: initialData?.certifications || "",
      experience: initialData?.experience || "",
      schedule: initialData?.schedule || [],
    },
  });

  // Helper: Ensure instructor is assigned to location before ticket class creation
  async function ensureInstructorAssignedToLocation(locationId: string, instructorId: string) {
    try {
      const res = await fetch(`/api/locations/${locationId}`);
      if (!res.ok) throw new Error("No se pudo obtener la ubicación");
      const location = await res.json();
      let instructorsArr = Array.isArray(location.instructors) ? location.instructors.map(String) : [];
      if (instructorsArr.includes(instructorId)) {
        return true; // Already assigned
      }
      // Add instructor, ensure unique, valid, non-empty 24-char strings
      instructorsArr = Array.from(new Set([...instructorsArr, instructorId]))
        .filter(id => typeof id === 'string' && id.length === 24);
      const patchRes = await fetch(`/api/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructors: instructorsArr }),
      });
      if (!patchRes.ok) {
        const errorText = await patchRes.text();
        toast.error(`No se pudo asignar el instructor a la ubicación: ${errorText}`);
        throw new Error(`No se pudo asignar el instructor a la ubicación: ${errorText}`);
      }
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error asignando instructor a la ubicación";
      toast.error(errorMessage);
      throw err;
    }
  }

  // New efficient approach: Calculate what needs to be done based on diff
  // Function to detect if two slots have significant differences that require database update
  const hasSignificantChanges = (oldSlot: Slot, newSlot: Slot): boolean => {
    const oldClassType = oldSlot.classType || "";
    const newClassType = newSlot.classType || "";
    
    // CRITICAL: If class type changed, this is always a significant change
    if (oldClassType !== newClassType) {
      console.log('[DIFF] Class type changed - SIGNIFICANT:', {
        oldType: oldClassType,
        newType: newClassType,
        ticketClassId: oldSlot.ticketClassId,
        slotId: oldSlot.slotId
      });
      return true;
    }
    
    // CRITICAL: If one has ticketClassId and other doesn't, significant change
    const oldHasTicketId = !!oldSlot.ticketClassId && !oldSlot.ticketClassId.toString().startsWith('temp-');
    const newHasTicketId = !!newSlot.ticketClassId && !newSlot.ticketClassId.toString().startsWith('temp-');
    if (oldHasTicketId !== newHasTicketId) {
      console.log('[DIFF] TicketClassId presence changed - SIGNIFICANT:', {
        oldHasTicketId,
        newHasTicketId,
        oldTicketClassId: oldSlot.ticketClassId,
        newTicketClassId: newSlot.ticketClassId
      });
      return true;
    }
    
    // Para ticket classes existentes (no temporales), ser MUY conservador
    if (["D.A.T.E", "B.D.I", "A.D.I"].includes(oldClassType)) {
      // Si ambos tienen el mismo ticketClassId real, probablemente son el mismo slot
      if (oldSlot.ticketClassId && newSlot.ticketClassId && 
          oldSlot.ticketClassId === newSlot.ticketClassId &&
          !oldSlot.ticketClassId.toString().startsWith('temp-')) {
        
        console.log('[DIFF] Same ticket class ID - checking for REAL changes:', {
          ticketClassId: oldSlot.ticketClassId,
          oldDate: oldSlot.date,
          newDate: newSlot.date,
          oldStart: oldSlot.start,
          newStart: newSlot.start
        });
        
        // Solo considerar cambios en campos críticos para ticket classes existentes
        const studentsChangedReal = JSON.stringify(oldSlot.students || []) !== JSON.stringify(newSlot.students || []);
        const cuposChangedReal = (oldSlot.cupos || 30) !== (newSlot.cupos || 30);
        const amountChangedReal = Math.abs((oldSlot.amount || 0) - (newSlot.amount || 0)) > 0.01;
        
        // Para ticket classes existentes, cambios de fecha/hora son muy raros y pueden ser errores
        const timeChanged = oldSlot.start !== newSlot.start || oldSlot.end !== newSlot.end;
        const dateChanged = oldSlot.date !== newSlot.date;
        
        if (timeChanged || dateChanged) {
          console.warn('[DIFF] Time/date change detected for existing ticket class - potential data issue:', {
            ticketClassId: oldSlot.ticketClassId,
            dateChanged: { old: oldSlot.date, new: newSlot.date },
            timeChanged: { 
              old: `${oldSlot.start}-${oldSlot.end}`, 
              new: `${newSlot.start}-${newSlot.end}` 
            }
          });
        }
        
        const hasRealChanges = studentsChangedReal || cuposChangedReal || amountChangedReal;
        
        if (hasRealChanges) {
          console.log('[DIFF] REAL changes detected for existing ticket class:', {
            ticketClassId: oldSlot.ticketClassId,
            studentsChanged: studentsChangedReal,
            cuposChanged: cuposChangedReal,
            amountChanged: amountChangedReal,
            oldStudents: (oldSlot.students || []).length,
            newStudents: (newSlot.students || []).length,
            oldCupos: oldSlot.cupos || 30,
            newCupos: newSlot.cupos || 30
          });
        } else {
          console.log('[DIFF] No real changes for existing ticket class - KEEPING as-is:', {
            ticketClassId: oldSlot.ticketClassId,
            date: oldSlot.date,
            start: oldSlot.start
          });
        }
        
        return hasRealChanges;
      }
      
      // Si no tienen el mismo ticket ID, usar comparación general
      const oldNorm = normalizeSlotForComparison(oldSlot);
      const newNorm = normalizeSlotForComparison(newSlot);
      
      const studentsChanged = JSON.stringify(oldNorm.students || []) !== JSON.stringify(newNorm.students || []);
      const cuposChanged = (oldNorm.cupos || 30) !== (newNorm.cupos || 30);
      const amountChanged = Math.abs((oldNorm.amount || 0) - (newNorm.amount || 0)) > 0.01;
      const locationChanged = (oldNorm.locationId || "") !== (newNorm.locationId || "");
      const classIdChanged = (oldNorm.classId || "") !== (newNorm.classId || "");
      
      return studentsChanged || cuposChanged || amountChanged || locationChanged || classIdChanged;
    }
    
    // Para driving tests, comparar campos importantes
    if (oldClassType === "driving test") {
      const timeChanged = oldSlot.start !== newSlot.start || oldSlot.end !== newSlot.end;
      const dateChanged = oldSlot.date !== newSlot.date;
      const studentChanged = (oldSlot.studentId || "") !== (newSlot.studentId || "");
      const statusChanged = (oldSlot.status || "") !== (newSlot.status || "");
      const bookedChanged = (oldSlot.booked || false) !== (newSlot.booked || false);
      
      const hasChanges = timeChanged || dateChanged || studentChanged || statusChanged || bookedChanged;
      
      if (hasChanges) {
        console.log('[DIFF] Significant changes detected for driving test:', {
          slotId: oldSlot.slotId,
          timeChanged,
          dateChanged,
          studentChanged,
          statusChanged,
          bookedChanged
        });
      }
      
      return hasChanges;
    }
    
    // Para otros tipos, usar comparación general pero conservadora
    const oldNorm = normalizeSlotForComparison(oldSlot);
    const newNorm = normalizeSlotForComparison(newSlot);
    
    const significantFields = ['date', 'start', 'end', 'status', 'booked', 'studentId', 'amount'];
    const hasChanges = significantFields.some(field => {
      const oldVal = (oldNorm as any)[field];
      const newVal = (newNorm as any)[field];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });
    
    return hasChanges;
  };

  // Normalizes a slot for comparison purposes
  const normalizeSlotForComparison = (slot: Slot): Slot => {
    const normalized = { ...slot };
    
    // Helper function to safely convert to string and clean
    const safeString = (value: any): string => {
      if (value === null || value === undefined || value === "null" || value === "undefined") {
        return "";
      }
      return String(value).trim();
    };

    // Helper function to safely convert to number
    const safeNumber = (value: any): number => {
      if (value === null || value === undefined || value === "null" || value === "undefined" || value === "") {
        return 0;
      }
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to safely handle arrays
    const safeArray = (value: any): string[] => {
      if (!Array.isArray(value)) {
        return [];
      }
      return value.map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item._id || item.id || String(item);
        }
        return String(item);
      }).filter(item => item !== "").sort();
    };

    // Normalize locationId to string
    if (normalized.locationId && typeof normalized.locationId === 'object' && 'locationId' in normalized.locationId) {
      normalized.locationId = (normalized.locationId as any)._id;
    }
    normalized.locationId = safeString(normalized.locationId);
    
    // Normalize classId to string
    if (normalized.classId && typeof normalized.classId === 'object' && '_id' in normalized.classId) {
      normalized.classId = (normalized.classId as any)._id;
    }
    normalized.classId = safeString(normalized.classId);
    
    // Normalize date format (remove any time component, ensure YYYY-MM-DD)
    if (normalized.date) {
      try {
        const dateStr = normalized.date.split('T')[0];
        const dateObj = new Date(dateStr + 'T00:00:00.000Z');
        if (!isNaN(dateObj.getTime())) {
          normalized.date = dateObj.toISOString().split('T')[0];
        } else {
          normalized.date = safeString(normalized.date).split('T')[0];
        }
      } catch (e) {
        normalized.date = safeString(normalized.date).split('T')[0];
      }
    } else {
      normalized.date = "";
    }
    
    // Normalize time formats (ensure HH:MM format)
    if (normalized.start) {
      const timePart = normalized.start.includes('T') ? normalized.start.split('T')[1] : normalized.start;
      const timeOnly = timePart.substring(0, 5); // HH:MM only
      // Ensure HH:MM format with zero padding
      const [hours, minutes] = timeOnly.split(':');
      normalized.start = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } else {
      normalized.start = "";
    }
    
    if (normalized.end) {
      const timePart = normalized.end.includes('T') ? normalized.end.split('T')[1] : normalized.end;
      const timeOnly = timePart.substring(0, 5); // HH:MM only
      // Ensure HH:MM format with zero padding
      const [hours, minutes] = timeOnly.split(':');
      normalized.end = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } else {
      normalized.end = "";
    }
    
    // Normalize duration - be more flexible with formats
    if (normalized.duration) {
      if (typeof normalized.duration === 'number') {
        normalized.duration = `${normalized.duration}h`;
      } else if (typeof normalized.duration === 'string') {
        // Clean duration string - handle various formats like "1h", "1 h", "1", etc.
        const durationStr = normalized.duration.toLowerCase().trim();
        const match = durationStr.match(/(\d+)/);
        if (match) {
          normalized.duration = `${match[1]}h`;
        } else {
          normalized.duration = "1h"; // Default fallback
        }
      } else {
        normalized.duration = "1h"; // Default fallback
      }
    } else {
      normalized.duration = "1h"; // Default fallback
    }
    
    // Normalize students array
    normalized.students = safeArray(normalized.students);
    
    // Normalize cupos to number
    normalized.cupos = safeNumber(normalized.cupos) || 30; // Default to 30 if not valid
    
    // Normalize classType
    const originalClassType = normalized.classType;
    if (originalClassType && ["D.A.T.E", "B.D.I", "A.D.I", "driving test"].includes(originalClassType)) {
      normalized.classType = originalClassType;
    } else {
      normalized.classType = undefined;
    }
    
    return normalized;
  };

  // NEW PROFESSIONAL DIFF FUNCTION - REPLACES BROKEN calculateScheduleChanges
  const calculateScheduleChangesProfessional = (originalSchedule: Slot[], currentSchedule: Slot[]) => {
    const changes = {
      toCreate: [] as Slot[],
      toUpdate: [] as { old: Slot, new: Slot }[],
      toDelete: [] as Slot[],
      toKeep: [] as Slot[]
    };

    console.log('[DIFF] Starting professional diff calculation:', {
      originalCount: originalSchedule.length,
      currentCount: currentSchedule.length
    });

    // Helper function to create a unique key for slot matching
    const getSlotKey = (slot: Slot): string => {
      // Priority 1: Real ticket class ID (most reliable for existing ticket classes)
      if (slot.ticketClassId && !slot.ticketClassId.toString().startsWith('temp-')) {
        return `ticket:${slot.ticketClassId}`;
      }
      
      // Priority 2: Driving test slot ID 
      if (slot.slotId && slot.classType === "driving test") {
        return `slot:${slot.slotId}`;
      }
      
      // Priority 3: For ticket classes without real ID, use date/time/type combination
      if (["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        return `tickettime:${slot.date}:${slot.start}:${slot.end}:${slot.classType}:${slot.classId || 'noclass'}:${slot.locationId || 'noloc'}`;
      }
      
      // Priority 4: Date/time combination for other types (fallback)
      return `time:${slot.date}:${slot.start}:${slot.end}:${slot.classType || 'unknown'}`;
    };

    // Create lookup maps for efficient comparison
    const originalMap = new Map<string, Slot>();
    const currentMap = new Map<string, Slot>();
    const processedKeys = new Set<string>();

    // Index original schedule
    originalSchedule.forEach(slot => {
      const key = getSlotKey(slot);
      originalMap.set(key, slot);
      console.log('[DIFF] Original slot indexed:', { 
        key, 
        ticketClassId: slot.ticketClassId,
        slotId: slot.slotId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start
      });
    });

    // Index current schedule and identify new/updated slots
    currentSchedule.forEach(slot => {
      const key = getSlotKey(slot);
      currentMap.set(key, slot);

      // Handle temporary slots (always create) - these are NEW ticket classes
      if (slot.isTemporary || (slot.ticketClassId && slot.ticketClassId.toString().startsWith('temp-'))) {
        console.log('[DIFF] NEW temporary ticket class to CREATE:', { 
          key, 
          ticketClassId: slot.ticketClassId,
          classType: slot.classType,
          date: slot.date,
          start: slot.start
        });
        changes.toCreate.push(slot);
        processedKeys.add(key);
        return;
      }

      const originalSlot = originalMap.get(key);
      
      if (!originalSlot) {
        // New slot - could be driving test or new ticket class
        console.log('[DIFF] NEW slot to CREATE:', { 
          key, 
          date: slot.date, 
          start: slot.start, 
          classType: slot.classType,
          ticketClassId: slot.ticketClassId,
          slotId: slot.slotId
        });
        changes.toCreate.push(slot);
      } else {
        // Existing slot - check for significant changes
        if (hasSignificantChanges(originalSlot, slot)) {
          console.log('[DIFF] EXISTING slot needs UPDATE:', { 
            key, 
            ticketClassId: slot.ticketClassId,
            date: slot.date, 
            start: slot.start, 
            classType: slot.classType,
            reason: 'Significant changes detected'
          });
          changes.toUpdate.push({ old: originalSlot, new: slot });
        } else {
          console.log('[DIFF] EXISTING slot unchanged, KEEPING as-is:', { 
            key, 
            ticketClassId: slot.ticketClassId,
            classType: slot.classType,
            date: slot.date,
            start: slot.start
          });
          changes.toKeep.push(slot);
        }
      }
      
      processedKeys.add(key);
    });

    // Find deleted slots (in original but not in current)
    originalSchedule.forEach(slot => {
      const key = getSlotKey(slot);
      if (!processedKeys.has(key) && !currentMap.has(key)) {
        console.log('[DIFF] EXISTING slot to DELETE:', { 
          key,
          ticketClassId: slot.ticketClassId,
          slotId: slot.slotId,
          date: slot.date, 
          start: slot.start, 
          classType: slot.classType 
        });
        changes.toDelete.push(slot);
      }
    });

    // Filter questionable updates to prevent unnecessary recreations
    const validUpdates = changes.toUpdate.filter(update => {
      // For ticket classes, be very strict about what constitutes a real update
      if (["D.A.T.E", "B.D.I", "A.D.I"].includes(update.old.classType || "")) {
        const oldNorm = normalizeSlotForComparison(update.old);
        const newNorm = normalizeSlotForComparison(update.new);
        
        const studentsChanged = JSON.stringify(oldNorm.students || []) !== JSON.stringify(newNorm.students || []);
        const cuposChanged = (oldNorm.cupos || 30) !== (newNorm.cupos || 30);
        const amountChanged = Math.abs((oldNorm.amount || 0) - (newNorm.amount || 0)) > 0.01;
        const locationChanged = (oldNorm.locationId || "") !== (newNorm.locationId || "");
        const classIdChanged = (oldNorm.classId || "") !== (newNorm.classId || "");
        
        const hasRealChanges = studentsChanged || cuposChanged || amountChanged || locationChanged || classIdChanged;
        
        if (!hasRealChanges) {
          console.log('[DIFF] Preventing unnecessary ticket class update:', {
            ticketClassId: update.old.ticketClassId,
            reason: 'No meaningful changes detected',
            students: { old: oldNorm.students?.length || 0, new: newNorm.students?.length || 0 },
            cupos: { old: oldNorm.cupos || 30, new: newNorm.cupos || 30 }
          });
          changes.toKeep.push(update.new);
          return false;
        }
        
        console.log('[DIFF] Valid ticket class update:', {
          ticketClassId: update.old.ticketClassId,
          changes: {
            students: studentsChanged,
            cupos: cuposChanged,
            amount: amountChanged,
            location: locationChanged,
            classId: classIdChanged
          }
        });
        return true;
      }
      
      // For driving tests, allow all detected updates
      return true;
    });

    // Update the changes object with filtered updates
    const removedUpdates = changes.toUpdate.filter(update => !validUpdates.includes(update));
    changes.toUpdate = validUpdates;

    console.log('[DIFF] Final diff summary:', {
      toCreate: changes.toCreate.length,
      toUpdate: changes.toUpdate.length,
      toDelete: changes.toDelete.length,
      toKeep: changes.toKeep.length,
      removedUnnecessaryUpdates: removedUpdates.length
    });

    // Warning for high change percentage
    const totalChanges = changes.toCreate.length + changes.toUpdate.length + changes.toDelete.length;
    const changePercentage = originalSchedule.length > 0 ? (totalChanges / originalSchedule.length) * 100 : 0;

    if (changePercentage > 80 && originalSchedule.length > 5) {
      console.warn('[DIFF] HIGH CHANGE PERCENTAGE DETECTED:', {
        percentage: Math.round(changePercentage),
        totalChanges,
        originalCount: originalSchedule.length,
        message: 'This might indicate a data format issue. Review carefully.'
      });
    }

    return changes;
  };

  const onSubmit = async (values: InstructorData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    setSavingChanges(true);
    toast.loading("Updating instructor calendar...", { id: 'saving-calendar' });
    try {
      let instructorId = initialData?._id;
      let isNew = !instructorId;
      let createdInstructor = null;
      let originalSchedule: Slot[] = [];
      if (isNew) {
        // 1. Crear instructor
        const instructorPayload = { ...values };
        delete instructorPayload.schedule;
        const res = await fetch('/api/instructors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(instructorPayload)
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to create instructor: ${errorText}`);
        }
        createdInstructor = await res.json();
        instructorId = createdInstructor._id;
        toast.success('Instructor created! Now saving classes...', { id: 'saving-calendar' });
        originalSchedule = [];
      } else {
        originalSchedule = normalizeSchedule(initialData?.schedule || []);
      }

      // 2. Calcular el diff de schedule
      const changes = calculateScheduleChangesProfessional(originalSchedule, schedule);
      // 3. Crear/actualizar/eliminar ticketclasses primero
      // Solo para tipos ADI, BDI, DATE
      const ticketClassTypes = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"];
      // --- CREAR NUEVAS TICKETCLASSES ---
      let createdTicketClasses = [];
      if (changes.toCreate.length > 0) {
        const toCreate = changes.toCreate.filter(slot => ticketClassTypes.includes((slot.classType || "").toUpperCase()));
        if (toCreate.length === 1) {
          // POST individual
          const slot = toCreate[0];
          const payload = {
            locationId: slot.locationId,
            date: slot.date,
            hour: slot.start,
            endHour: slot.end,
            classId: slot.classId,
            type: mapClassTypeForBackend(slot.classType),
            duration: slot.duration,
            instructorId,
            students: slot.students || [],
            cupos: slot.cupos || 30,
          };
          const res = await fetch('/api/ticket/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('Failed to create ticket class');
          const created = await res.json();
          createdTicketClasses.push({ ...slot, ticketClassId: created._id });
        } else if (toCreate.length > 1) {
          // POST batch
          const batchPayload = toCreate.map(slot => ({
            locationId: slot.locationId,
            date: slot.date,
            hour: slot.start,
            endHour: slot.end,
            classId: slot.classId,
            type: mapClassTypeForBackend(slot.classType),
            duration: slot.duration,
            instructorId,
            students: slot.students || [],
            cupos: slot.cupos || 30,
          }));
          const res = await fetch('/api/ticket/classes/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchPayload)
          });
          if (!res.ok) throw new Error('Failed to create ticket classes');
          const created = await res.json();
          for (let i = 0; i < created.length; i++) {
            createdTicketClasses.push({ ...toCreate[i], ticketClassId: created[i]._id });
          }
        }
      }
      // --- FIN CREACIÓN TICKETCLASSES ---

      // 4. Construir el schedule FINAL con todos los slots, enlazando ticketClassId reales
      const finalSchedule: Slot[] = [
        ...changes.toKeep,
        ...changes.toUpdate.map(u => u.new),
        ...changes.toCreate
      ].map(slot => {
        // Si es ticketclass, busca el ticketClassId real
        if (ticketClassTypes.includes((slot.classType || "").toUpperCase())) {
          const found = createdTicketClasses.find(s =>
            s.date === slot.date &&
            s.start === slot.start &&
            s.end === slot.end &&
            s.classType === slot.classType &&
            s.classId === slot.classId &&
            s.locationId === slot.locationId
          );
          if (found) {
            return { ...slot, ticketClassId: found.ticketClassId };
          }
        }
        // Si es driving test, nunca debe tener ticketClassId
        if ((slot.classType || "").toLowerCase() === "driving test" && slot.ticketClassId) {
          const { ticketClassId, ...rest } = slot;
          return rest;
        }
        return slot;
      });

      // Limpiar campos temporales y normalizar fechas/horas antes del PATCH
      const cleanSchedule = finalSchedule.map(slot => {
        const cleaned = { ...slot };
        if (typeof cleaned.ticketClassId === 'string' && cleaned.ticketClassId.startsWith('temp-')) {
          delete cleaned.ticketClassId;
        }
        // Normaliza fecha a YYYY-MM-DD
        if (cleaned.date && cleaned.date.includes('T')) {
          cleaned.date = cleaned.date.split('T')[0];
        }
        // Normaliza hora a HH:mm
        if (cleaned.start && cleaned.start.length > 5) {
          cleaned.start = cleaned.start.slice(0,5);
        }
        if (cleaned.end && cleaned.end.length > 5) {
          cleaned.end = cleaned.end.slice(0,5);
        }
        return cleaned;
      });

      // PATCH para instructores nuevos y existentes
      if (instructorId) {
        await fetch(`/api/instructors/${instructorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId,
            schedule: cleanSchedule,
            email: createdInstructor?.email || initialData?.email,
            dni: createdInstructor?.dni || initialData?.dni
          })
        });
      }
      setLoading(false);
      setSavingChanges(false);
      toast.success('All changes saved!', { id: 'saving-calendar' });
      router.push('/instructors');
    } catch (error) {
      setLoading(false);
      setSavingChanges(false);
      toast.dismiss('saving-calendar');
      const err = error as Error;
      toast.error(err.message || 'Error saving instructor');
    }
  };

  // Efficient CRUD operations
  const createTicketClass = async (slot: Slot): Promise<Slot> => {
    console.log('[CREATE] Creating new ticket class for slot:', { date: slot.date, start: slot.start, end: slot.end });
    
    // Validar campos requeridos antes de hacer la llamada API
    if (!slot.classId) {
      throw new Error("classId is required for ticket classes");
    }
    
    if (!slot.locationId) {
      throw new Error("locationId is required for ticket classes");
    }
    
    if (!initialData?._id) {
      throw new Error("instructorId is required");
    }

    // Validate that classId and locationId are valid ObjectIds (24 characters)
    if (typeof slot.classId !== 'string' || slot.classId.length !== 24) {
      throw new Error(`Invalid classId format: ${slot.classId}`);
    }

    if (typeof slot.locationId !== 'string' || slot.locationId.length !== 24) {
      throw new Error(`Invalid locationId format: ${slot.locationId}`);
    }

    // Ensure instructor is assigned to location
    if (slot.locationId && initialData?._id) {
      try {
        await ensureInstructorAssignedToLocation(slot.locationId, initialData._id);
      } catch (err) {
        throw new Error(`Failed to assign instructor to location: ${err}`);
      }
    }

    // Prepare payload
    let dateForPayload = slot.date;
    if (slot.date && slot.date.includes("T")) {
      dateForPayload = slot.date.split("T")[0];
    }
    
    let durationForPayload: string = "4h";
    if (typeof slot.duration === "string" && ["2h","4h","8h","12h"].includes(slot.duration)) {
      durationForPayload = slot.duration;
    } else if (typeof slot.duration === "number") {
      if ([2,4,8,12].includes(slot.duration)) {
        durationForPayload = `${slot.duration}h`;
      }
    }

    // Ensure students array contains only valid string IDs
    const validStudents = (slot.students || [])
      .filter(id => typeof id === 'string' && id.length === 24)
      .slice(0, slot.cupos || 30); // Don't exceed cupos

    // Validate date format
    if (!dateForPayload.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error(`Invalid date format: ${dateForPayload}`);
    }

    // Validate time format
    if (!slot.start.match(/^\d{2}:\d{2}$/)) {
      throw new Error(`Invalid start time format: ${slot.start}`);
    }

    if (!slot.end.match(/^\d{2}:\d{2}$/)) {
      throw new Error(`Invalid end time format: ${slot.end}`);
    }

    const ticketPayload = {
      locationId: slot.locationId,
      date: dateForPayload,
      hour: slot.start,
      endHour: slot.end,
      classId: slot.classId,
      type: mapClassTypeForBackend(slot.classType),
      duration: durationForPayload,
      instructorId: initialData?._id,
      students: validStudents,
      cupos: slot.cupos || 30,
    };

    console.log('[CREATE] Ticket payload being sent:', ticketPayload);

    const res = await fetch("/api/ticket/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[CREATE] Failed to create ticket class. Status:', res.status, 'Error:', errorText);
      console.error('[CREATE] Failed payload was:', ticketPayload);
      throw new Error(`Failed to create ticket class (${res.status}): ${errorText}`);
    }

    const ticket = await res.json();
    console.log('[CREATE] Successfully created ticket class:', ticket._id);

    const createdSlot = {
      ...slot,
      ticketClassId: ticket._id,
    };

    // Actualizar inmediatamente el cache local para evitar llamadas futuras
    setEnrichedTicketData(prev => ({
      ...prev,
      [ticket._id]: {
        students: slot.students || [],
        cupos: slot.cupos || 30,
        classId: slot.classId,
        locationId: slot.locationId,
        amount: slot.amount,
        duration: slot.duration ? parseInt(String(slot.duration).replace('h', '')) : 4,
        type: ticketPayload.type,
        date: ticketPayload.date,
        hour: ticketPayload.hour,
        endHour: ticketPayload.endHour,
        // Guardar el objeto completo en caso de ser necesario
        fullData: ticket
      }
    }));
    
    // Actualizar el set de IDs cargados y la lista completa de clases si es necesario
    setLoadedTicketClassIds(prev => new Set([...prev, ticket._id]));
    
    // Actualizar también la lista completa de ticket classes si está disponible
    if (instructorTicketClassesLoaded) {
      setAllInstructorTicketClasses(prev => [
        ...prev, 
        { 
          ...ticketPayload, 
          _id: ticket._id,
          students: slot.students || [],
          cupos: slot.cupos || 30,
          // Incluir datos adicionales del ticket
          price: slot.amount,
          duration: durationForPayload
        }
      ]);
    }
    
    console.log('[CACHE] Updated ticket class data cache for:', ticket._id);

    return createdSlot;
  };

  const deleteTicketClass = async (slot: Slot): Promise<void> => {
    // Only attempt deletion if there's actually something to delete
    if (slot.ticketClassId && !slot.isTemporary && !slot.ticketClassId.toString().startsWith('temp-')) {
      console.log('[DELETE] Deleting ticket class:', slot.ticketClassId);
      
      try {
        const res = await fetch(`/api/ticket/classes/${slot.ticketClassId}`, { 
          method: 'DELETE' 
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            console.log('[DELETE] Ticket class already deleted or not found:', slot.ticketClassId);
            // This is OK - the class was already deleted
            return;
          } else {
            const errorText = await res.text();
            console.warn('[DELETE] Failed to delete ticket class, but continuing:', errorText);
            // Don't throw - just warn and continue
            return;
          }
        }
        
        console.log('[DELETE] Successfully deleted ticket class:', slot.ticketClassId);
      } catch (fetchError) {
        // Network errors - log but don't throw to avoid breaking the flow
        console.warn('[DELETE] Network error while deleting ticket class, continuing anyway:', fetchError);
        return;
      }
    } else if (slot.ticketClassId) {
      console.log('[DELETE] Skipping deletion of temporary ticket class:', slot.ticketClassId);
    }
    
    // Handle driving test slots
    if (slot.classType === 'driving test' && slot.slotId && initialData) {
      try {
        const res = await fetch(`/api/instructors/${initialData._id}/schedule`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotId: slot.slotId }),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.warn('[DELETE] Failed to delete driving test slot, but continuing:', errorText);
          return;
        }
        
        console.log('[DELETE] Deleted driving test slot:', slot.slotId);
      } catch (fetchError) {
        console.warn('[DELETE] Network error while deleting driving test slot, continuing anyway:', fetchError);
        return;
      }
    }
  };

  // Función para verificar si hay superposición de horarios
  const checkTimeOverlap = (slot: Slot, existingSlots: Slot[]): { overlaps: boolean, overlappingSlot?: Slot } => {
    // Convertir las fechas y horas a objetos Date para comparación
    const slotDate = slot.date;
    const slotStart = convertTo24HourFormat(slot.start);
    const slotEnd = convertTo24HourFormat(slot.end);
    
    // Solo revisar superposición con slots del mismo día
    const slotsOnSameDay = existingSlots.filter(existing => 
      existing.date === slotDate && 
      // Excluir el mismo slot si estamos editando
      (!slot.ticketClassId || existing.ticketClassId !== slot.ticketClassId)
    );
    
    // Verificar superposición
    for (const existing of slotsOnSameDay) {
      const existingStart = convertTo24HourFormat(existing.start);
      const existingEnd = convertTo24HourFormat(existing.end);
      
      // Verificar superposición: si el inicio del nuevo está antes del fin del existente
      // y el fin del nuevo está después del inicio del existente
      if (
        (slotStart < existingEnd && slotEnd > existingStart) ||
        (slotStart === existingStart && slotEnd === existingEnd)
      ) {
        return { overlaps: true, overlappingSlot: existing };
      }
    }
    
    return { overlaps: false };
  };

  return {
    form,
    loading,
    loadingSchedule,
    savingChanges,
    hasChanges,
    recurrenceOptions,
    recurrenceEnd,
    setRecurrenceEnd,
    schedule,
    setSchedule,
    calendarEvents,
    isModalOpen,
    setIsModalOpen,
    currentSlot,
    setCurrentSlot,
    handleSaveSlot,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDateSelect,
    handleEventClick,
    slotType,
    setSlotType,
    allUsers,
    selectedStudent,
    setSelectedStudent,
    selectedStudents,
    setSelectedStudents,
    availableSpots,
    setAvailableSpots,
    locations: filteredLocations,
    editModalOpen,
    setEditModalOpen,
    setEditAll,
    generatePassword,
    onSubmit,
    clearScheduleDraft,
    discardAllChanges,
    initialData,
    router,
  };
}
