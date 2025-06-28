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
} from "./utils";

// Función para convertir horas a formato 24 horas
function convertTo24HourFormat(time: string): string {
  // Si ya está en formato 24 horas (HH:MM), retornarlo tal como está
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    return time;
  }
  
  // Si tiene AM/PM, convertir a 24 horas
  const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = time.match(timePattern);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Si no coincide con ningún patrón, retornar tal como está
  return time;
}

export function useInstructorForm(initialData?: InstructorData) {
  const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
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

  // Assigned locations logic (top-level, not inside any function)
  const assignedLocationIds = Array.isArray(initialData?.locationIds)
    ? initialData.locationIds
    : null;
  const filteredLocations = assignedLocationIds
    ? locations.filter((loc) => assignedLocationIds.includes(loc._id))
    : locations;

  useEffect(() => {
    async function loadSchedule() {
      setLoadingSchedule(true);
      
      // Start with the original schedule exactly as stored in the database
      // DO NOT modify it - this is our baseline for diff comparison
      const originalSchedule = normalizeSchedule(initialData?.schedule || []);
      
      console.log('[LOAD] Starting with original schedule:', originalSchedule.length, 'slots');
      console.log('[LOAD] Original schedule structure:', originalSchedule.map(s => ({
        date: s.date,
        start: s.start,
        end: s.end,
        classType: s.classType,
        ticketClassId: s.ticketClassId,
        slotId: s.slotId
      })));
      
      // Set the schedule to exactly match what's in the database
      // This ensures perfect diff matching - no transformations here
      setSchedule(originalSchedule);
      setLoadingSchedule(false);
    }
    loadSchedule();
  }, [initialData]);

  useEffect(() => {
    if (typeof window !== "undefined" && scheduleDraftKey) {
      localStorage.setItem(scheduleDraftKey, JSON.stringify(schedule));
    }
  }, [schedule, scheduleDraftKey]);

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
    
    console.log('[DISCARD] All changes have been discarded, state restored to original');
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
    const ticketClassIds = schedule
      .filter(slot => slot.ticketClassId)
      .map(slot => slot.ticketClassId!)
      .filter((id, index, arr) => arr.indexOf(id) === index); // unique IDs

    if (ticketClassIds.length === 0) return;

    const enrichedData: Record<string, any> = { ...enrichedTicketData };
    let hasUpdates = false;

    // Cargar datos de ticket classes que no tenemos aún
    for (const ticketClassId of ticketClassIds) {
      if (!enrichedData[ticketClassId]) {
        try {
          const res = await fetch(`/api/ticket/classes/${ticketClassId}`);
          if (res.ok) {
            const ticketData = await res.json();
            enrichedData[ticketClassId] = {
              students: ticketData.students || [],
              cupos: ticketData.cupos || 30,
            };
            hasUpdates = true;
            console.log(`Loaded ticket class data for ${ticketClassId}:`, enrichedData[ticketClassId]);
          }
        } catch (error) {
          console.error(`Error loading ticket class ${ticketClassId}:`, error);
        }
      }
    }

    if (hasUpdates) {
      setEnrichedTicketData(enrichedData);
    }
  };

  // useEffect para cargar datos de ticket classes cuando cambie el schedule
  useEffect(() => {
    if (schedule.length > 0) {
      const hasTicketClasses = schedule.some(slot => slot.ticketClassId);
      if (hasTicketClasses) {
        enrichCalendarEvents();
      }
    }
  }, [schedule]);

  const calendarEvents = schedule.map((slot: Slot) => {
    // Para ticket classes, usar datos enriquecidos si están disponibles
    let studentCount = 0;
    let totalCupos = 30;
    
    if (slot.ticketClassId && enrichedTicketData[slot.ticketClassId]) {
      const ticketData = enrichedTicketData[slot.ticketClassId];
      studentCount = Array.isArray(ticketData.students) ? ticketData.students.length : 0;
      totalCupos = ticketData.cupos || 30;
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
    if (!currentSlot) return;
    
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
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSelectedStudents([]);
    setAvailableSpots(30);
    toast.success("Slot deleted! Remember to press 'Save Changes' to save to the database.");
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
    
    // Actualizar el schedule - el diff system se encargará de detectar los cambios
    setSchedule((prevSchedule: Slot[]) => {
      // Remover el slot original
      const filtered = prevSchedule.filter(slot => slot.slotId !== currentSlot.originalSlotId);
      const newSlotId = uuidv4();
      
      const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType);
      
      // Crear el nuevo slot
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
        ticketClassId: currentSlot.ticketClassId,
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
            cupos: availableSpots
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

  const handleSaveSlot = () => {
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
      // Para driving test, generar slots de 2 horas para cada fecha
      const allNewSlots: Slot[] = [];
      
      for (const date of recurringDates) {
        const rawStartTime = currentSlot.start.split("T")[1];
        const rawEndTime = currentSlot.end.split("T")[1];
        
        // Convertir a formato 24 horas
        const startTime = convertTo24HourFormat(rawStartTime);
        const endTime = convertTo24HourFormat(rawEndTime);
        
        const dateTimeStart = `${date}T${startTime}`;
        const dateTimeEnd = `${date}T${endTime}`;
        
        console.log('[SAVE_SLOT] Driving test time conversion:', { 
          date, rawStartTime, rawEndTime, startTime, endTime 
        });
        
        const newSlots: Slot[] = splitIntoTwoHourSlots(dateTimeStart, dateTimeEnd, {
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
        });
        
        allNewSlots.push(...newSlots);
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
    
    for (const date of recurringDates) {
      // Verificar overlap para esta fecha específica
      const overlapLocal = schedule.some(slot => {
        if (!slot.date || !slot.start || !slot.end) return false;
        if (slot.date !== date) return false;
        return (
          (newStart < slot.end && newEnd > slot.start)
        );
      });
      
      if (overlapLocal) {
        toast.error(`There is already a class scheduled that overlaps with this time on ${date}.`);
        return;
      }
      
      const newSlot: Slot = {
        status: getSlotStatus(slotType, isTicketClass),
        cupos: isTicketClass ? availableSpots : 30,
        date: date,
        start: newStart,
        end: newEnd,
        classType: toValidClassType(currentSlot.classType),
        classId: (currentSlot as any).classId,
        duration: (currentSlot as any).duration,
        locationId: locationId, // always string
        amount: (currentSlot as any).amount,
        paid: (currentSlot as any).paid,
        pickupLocation: (currentSlot as any).pickupLocation,
        dropoffLocation: (currentSlot as any).dropoffLocation,
        booked: !isTicketClass && slotType === "booked", // Solo para driving test
        studentId: !isTicketClass && slotType === "booked" ? selectedStudent : null,
        students: isTicketClass ? selectedStudents : undefined,
        slotId: uuidv4(), // Nuevo ID para cada slot
      };
      
      allNewSlots.push(newSlot);
    }
    
    setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
    
    // Si es una ticket class, actualizar los datos enriquecidos para todos los slots creados
    if (isTicketClass) {
      const ticketDataUpdate = {
        students: selectedStudents,
        cupos: availableSpots
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
    toast.success(`${allNewSlots.length} slots saved for ${recurringDates.length} dates!`);
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
      try {
        const res = await fetch(`/api/ticket/classes/${realSlot.ticketClassId}`);
        if (res.ok) {
          const ticket = await res.json();
          console.log("Loaded ticket class data for editing:", ticket);
          
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
                cupos: cuposValue
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
  const calculateScheduleChanges = (originalSchedule: Slot[], currentSchedule: Slot[]) => {
    const changes = {
      toCreate: [] as Slot[],
      toUpdate: [] as { old: Slot, new: Slot }[],
      toDelete: [] as Slot[],
      toKeep: [] as Slot[]
    };

    console.log('[DIFF] Starting diff calculation:', {
      originalCount: originalSchedule.length,
      currentCount: currentSchedule.length
    });

    // Create maps for easier lookup
    const originalMap = new Map<string, Slot>();
    const currentMap = new Map<string, Slot>();

    // Map original slots - priority: ticketClassId > date+time+classType
    originalSchedule.forEach(slot => {
      let key: string;
      if (slot.ticketClassId && slot.ticketClassId.trim() !== '') {
        // For ticket classes, use ticketClassId as primary key
        key = `ticket:${slot.ticketClassId}`;
      } else {
        // For non-ticket classes (like driving test), use date+time+classType
        key = `slot:${slot.date}-${slot.start}-${slot.end}-${slot.classType || 'unknown'}`;
      }
      console.log('[DIFF] Original slot key:', key, { date: slot.date, start: slot.start, classType: slot.classType, ticketClassId: slot.ticketClassId });
      originalMap.set(key, slot);
    });

    // Map current slots using the same logic
    currentSchedule.forEach(slot => {
      let key: string;
      if (slot.ticketClassId && slot.ticketClassId.trim() !== '') {
        // For ticket classes, use ticketClassId as primary key
        key = `ticket:${slot.ticketClassId}`;
      } else {
        // For non-ticket classes (like driving test), use date+time+classType
        key = `slot:${slot.date}-${slot.start}-${slot.end}-${slot.classType || 'unknown'}`;
      }
      console.log('[DIFF] Current slot key:', key, { date: slot.date, start: slot.start, classType: slot.classType, ticketClassId: slot.ticketClassId });
      currentMap.set(key, slot);
    });

    // Find what to delete (in original but not in current)
    originalMap.forEach((originalSlot, key) => {
      if (!currentMap.has(key)) {
        console.log('[DIFF] Slot to DELETE:', key);
        changes.toDelete.push(originalSlot);
      }
    });

    // Find what to create, update, or keep
    currentMap.forEach((currentSlot, key) => {
      const originalSlot = originalMap.get(key);
      
      if (!originalSlot) {
        // New slot - needs creation
        console.log('[DIFF] Slot to CREATE:', key);
        changes.toCreate.push(currentSlot);
      } else {
        // Exists in both - check if it changed (only for meaningful changes)
        const hasChanges = (
          originalSlot.classId !== currentSlot.classId ||
          originalSlot.duration !== currentSlot.duration ||
          originalSlot.locationId !== currentSlot.locationId ||
          originalSlot.date !== currentSlot.date ||
          originalSlot.start !== currentSlot.start ||
          originalSlot.end !== currentSlot.end ||
          originalSlot.classType !== currentSlot.classType ||
          // For ticket classes, also check students and cupos changes
          (["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && (
            JSON.stringify(originalSlot.students || []) !== JSON.stringify(currentSlot.students || []) ||
            originalSlot.cupos !== currentSlot.cupos
          ))
        );

        if (hasChanges) {
          console.log('[DIFF] Slot to UPDATE:', key, {
            classIdChanged: originalSlot.classId !== currentSlot.classId,
            durationChanged: originalSlot.duration !== currentSlot.duration,
            locationChanged: originalSlot.locationId !== currentSlot.locationId,
            dateChanged: originalSlot.date !== currentSlot.date,
            timeChanged: originalSlot.start !== currentSlot.start || originalSlot.end !== currentSlot.end,
            typeChanged: originalSlot.classType !== currentSlot.classType,
            studentsChanged: JSON.stringify(originalSlot.students || []) !== JSON.stringify(currentSlot.students || []),
            cuposChanged: originalSlot.cupos !== currentSlot.cupos
          });
          changes.toUpdate.push({ old: originalSlot, new: currentSlot });
        } else {
          console.log('[DIFF] Slot to KEEP:', key);
          changes.toKeep.push(currentSlot);
        }
      }
    });

    console.log('[DIFF] Final diff results:', {
      toCreate: changes.toCreate.length,
      toUpdate: changes.toUpdate.length,
      toDelete: changes.toDelete.length,
      toKeep: changes.toKeep.length
    });

    return changes;
  };

  const onSubmit = async (values: InstructorData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    
    try {
      console.log('[SUBMIT] Starting efficient save process...');
      
      const photoString = Array.isArray(values.photo)
        ? values.photo[0] || ""
        : values.photo || "";
      
      // Calculate what changed using the efficient diff approach
      const originalSchedule = normalizeSchedule(initialData?.schedule || []);
      
      console.log('[SUBMIT] Original schedule before diff:', originalSchedule.map(s => ({
        date: s.date,
        start: s.start,
        end: s.end,
        classType: s.classType,
        ticketClassId: s.ticketClassId
      })));
      
      console.log('[SUBMIT] Current schedule before diff:', schedule.map(s => ({
        date: s.date,
        start: s.start,
        end: s.end,
        classType: s.classType,
        ticketClassId: s.ticketClassId
      })));
      
      const changes = calculateScheduleChanges(originalSchedule, schedule);
      
      console.log('[SUBMIT] Schedule changes detected:', {
        toCreate: changes.toCreate.length,
        toUpdate: changes.toUpdate.length, 
        toDelete: changes.toDelete.length,
        toKeep: changes.toKeep.length
      });
      
      // If everything is being recreated, something is wrong - stop and show error
      if (changes.toKeep.length === 0 && originalSchedule.length > 0 && schedule.length > 0) {
        console.error('[SUBMIT] ERROR: All classes are being recreated! This should not happen.');
        toast.error("Error: All classes would be recreated. Operation cancelled to prevent data loss.");
        setLoading(false);
        return;
      }

      const finalSchedule: Slot[] = [];

      // 1. KEEP unchanged slots as-is (no API calls needed)
      console.log('[SUBMIT] Keeping unchanged slots:', changes.toKeep.length);
      finalSchedule.push(...changes.toKeep);

      // 2. DELETE removed slots
      console.log('[SUBMIT] Deleting removed slots:', changes.toDelete.length);
      for (const slotToDelete of changes.toDelete) {
        try {
          await deleteTicketClass(slotToDelete);
        } catch (error) {
          console.error('[SUBMIT] Failed to delete slot:', error);
          toast.error(`Failed to delete slot: ${error}`);
          // Continue with other deletions
        }
      }

      // 3. UPDATE changed slots
      console.log('[SUBMIT] Updating changed slots:', changes.toUpdate.length);
      for (const { old: oldSlot, new: newSlot } of changes.toUpdate) {
        try {
          // Only update ticket classes (D.A.T.E, B.D.I, A.D.I)
          if (["D.A.T.E", "B.D.I", "A.D.I"].includes(newSlot.classType || "")) {
            const updatedSlot = await updateTicketClass(oldSlot, newSlot);
            finalSchedule.push(updatedSlot);
          } else {
            // For non-ticket classes, just keep the new version
            finalSchedule.push(newSlot);
          }
        } catch (error) {
          console.error('[SUBMIT] Failed to update slot:', error);
          toast.error(`Failed to update slot: ${error}`);
          setLoading(false);
          return;
        }
      }

      // 4. CREATE new slots
      console.log('[SUBMIT] Creating new slots:', changes.toCreate.length);
      for (const slotToCreate of changes.toCreate) {
        try {
          // Only create ticket classes for D.A.T.E, B.D.I, A.D.I
          if (["D.A.T.E", "B.D.I", "A.D.I"].includes(slotToCreate.classType || "")) {
            const createdSlot = await createTicketClass(slotToCreate);
            finalSchedule.push(createdSlot);
          } else {
            // For non-ticket classes (driving test, etc), just add them
            finalSchedule.push(slotToCreate);
          }
        } catch (error) {
          console.error('[SUBMIT] Failed to create slot:', error);
          toast.error(`Failed to create slot: ${error}`);
          setLoading(false);
          return;
        }
      }

      console.log('[SUBMIT] Final schedule composed:', {
        total: finalSchedule.length,
        withTicketClassId: finalSchedule.filter(s => s.ticketClassId).length,
        withoutTicketClassId: finalSchedule.filter(s => !s.ticketClassId).length
      });

      // For the instructor schedule, only store minimal data with ticketClassId reference
      const scheduleToPersist = finalSchedule.map(slot => {
        if (slot.ticketClassId && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
          // For ticket classes, only store reference and basic info
          return {
            date: slot.date,
            start: slot.start,
            end: slot.end,
            classType: slot.classType,
            ticketClassId: slot.ticketClassId,
            slotId: slot.slotId,
            recurrence: slot.recurrence,
            status: slot.status,
            // Don't store students and cupos here - they're in the ticket class
          };
        }
        // For non-ticket classes (driving test), keep all data
        return slot;
      });

      // Save instructor with the minimal schedule
      const bodyToSend: Record<string, unknown> = {
        instructorId: initialData?._id ?? "",
        ...values,
        photo: photoString,
        schedule: scheduleToPersist,
      };
      
      if (initialData && !bodyToSend.password) {
        delete bodyToSend.password;
      }

      const res = await fetch(`/api/instructors`, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Instructor saved successfully!");
        
        // Clear state
        setSchedule([]);
        clearScheduleDraft();
        
        window.location.href = "/instructors";
      } else {
        toast.error(data.message || "Error saving instructor.");
      }
    } catch (error) {
      console.error('[SUBMIT] Unexpected error:', error);
      toast.error("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Efficient CRUD operations
  const createTicketClass = async (slot: Slot): Promise<Slot> => {
    console.log('[CREATE] Creating new ticket class for slot:', { date: slot.date, start: slot.start, end: slot.end });

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

    const ticketPayload = {
      locationId: slot.locationId,
      date: dateForPayload,
      hour: slot.start,
      endHour: slot.end,
      classId: slot.classId,
      type: mapClassTypeForBackend(slot.classType),
      duration: durationForPayload,
      instructorId: initialData?._id,
      students: slot.students || [],
      cupos: slot.cupos || 30,
    };

    const res = await fetch("/api/ticket/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create ticket class: ${errorText}`);
    }

    const ticket = await res.json();
    console.log('[CREATE] Successfully created ticket class:', ticket._id);

    return {
      ...slot,
      ticketClassId: ticket._id,
    };
  };

  const updateTicketClass = async (oldSlot: Slot, newSlot: Slot): Promise<Slot> => {
    console.log('[UPDATE] Updating ticket class:', oldSlot.ticketClassId);
    
    if (oldSlot.ticketClassId) {
      // Check if time/date/location changed - if so, delete and recreate
      const timeLocationChanged = (
        oldSlot.date !== newSlot.date ||
        oldSlot.start !== newSlot.start ||
        oldSlot.end !== newSlot.end ||
        oldSlot.locationId !== newSlot.locationId
      );

      if (timeLocationChanged) {
        // Delete old ticket class
        const deleteRes = await fetch(`/api/ticket/classes/${oldSlot.ticketClassId}`, { 
          method: 'DELETE' 
        });
        
        if (!deleteRes.ok) {
          const errorText = await deleteRes.text();
          throw new Error(`Failed to delete old ticket class: ${errorText}`);
        }
        
        console.log('[UPDATE] Deleted old ticket class due to time/location change:', oldSlot.ticketClassId);
        
        // Create new ticket class
        const updatedSlot = await createTicketClass(newSlot);
        console.log('[UPDATE] Created new ticket class:', updatedSlot.ticketClassId);
        
        return updatedSlot;
      } else {
        // Only update students and cupos via PATCH
        console.log('[UPDATE] Updating students and cupos for ticket class:', oldSlot.ticketClassId);
        
        const updatePayload = {
          students: newSlot.students || [],
          cupos: newSlot.cupos || 30,
        };

        const patchRes = await fetch(`/api/ticket/classes/${oldSlot.ticketClassId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (!patchRes.ok) {
          const errorText = await patchRes.text();
          throw new Error(`Failed to update ticket class: ${errorText}`);
        }

        console.log('[UPDATE] Successfully updated students and cupos for ticket class:', oldSlot.ticketClassId);

        return {
          ...newSlot,
          ticketClassId: oldSlot.ticketClassId,
        };
      }
    }
    
    return newSlot;
  };

  const deleteTicketClass = async (slot: Slot): Promise<void> => {
    if (slot.ticketClassId) {
      console.log('[DELETE] Deleting ticket class:', slot.ticketClassId);
      
      const res = await fetch(`/api/ticket/classes/${slot.ticketClassId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete ticket class: ${errorText}`);
      }
      
      console.log('[DELETE] Successfully deleted ticket class:', slot.ticketClassId);
    }
    
    // Handle driving test slots
    if (slot.classType === 'driving test' && slot.slotId && initialData?._id) {
      await fetch(`/api/instructors/${initialData._id}/schedule`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.slotId }),
      });
      console.log('[DELETE] Deleted driving test slot:', slot.slotId);
    }
  };

  return {
    form,
    loading,
    loadingSchedule,
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
