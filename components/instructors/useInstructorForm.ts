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
  const [slotType, setSlotType] = useState<SlotType>("");
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  const [ticketClassIdsToDelete, setTicketClassIdsToDelete] = useState<string[]>([]);
  // Guardar los slots de Driving Test eliminados para borrarlos en el backend al guardar
  const [drivingTestSlotsToDelete, setDrivingTestSlotsToDelete] = useState<string[]>([]);

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
      const baseSchedule = normalizeSchedule(initialData?.schedule || []);
      let classesMap: Record<string, string> = {};
      let locationsMap: Record<string, string> = {};
      try {
        const classesRes = await fetch('/api/classes');
        if (classesRes.ok) {
          const classesArr = await classesRes.json();
          classesMap = Object.fromEntries((classesArr as { _id: string, title: string }[]).map((c) => [c._id, c.title]));
        }
      } catch {
        // Ignore error
      }
      try {
        const locationsRes = await fetch('/api/locations');
        if (locationsRes.ok) {
          const locationsArr = await locationsRes.json();
          locationsMap = Object.fromEntries((locationsArr as { _id: string, title: string }[]).map((l) => [l._id, l.title]));
        }
      } catch {
        // Ignore error
      }
      
      // Step 1: Get all ticketclasses for this instructor to populate missing ticketClassIds
      let instructorTicketClasses: Array<{_id: string, date: string, hour: string, endHour: string}> = [];
      if (initialData?._id) {
        try {
          const ticketClassesRes = await fetch(`/api/ticket/classes?instructorId=${initialData._id}`);
          if (ticketClassesRes.ok) {
            const allTicketClasses = await ticketClassesRes.json();
            instructorTicketClasses = Array.isArray(allTicketClasses) ? allTicketClasses : [];
            console.log('[LOAD] Found ticketclasses for instructor:', instructorTicketClasses.length);
          }
        } catch {
          console.warn('[LOAD] Failed to fetch instructor ticketclasses');
        }
      }
      
      // Step 2: Process schedule and populate ticketClassIds for slots that don't have them
      const slotsWithPopulatedTicketClassIds = baseSchedule.map(slot => {
        // If slot already has ticketClassId, keep it
        if (slot.ticketClassId && slot.ticketClassId !== "") {
          return slot;
        }
        
        // Find matching ticketclass for this slot
        const matchingTicketClass = instructorTicketClasses.find(tc => 
          tc.date?.slice(0, 10) === slot.date &&
          tc.hour === slot.start &&
          tc.endHour === slot.end
        );
        
        if (matchingTicketClass) {
          console.log('[LOAD] Found matching ticketclass for slot:', {
            date: slot.date,
            start: slot.start,
            end: slot.end,
            ticketClassId: matchingTicketClass._id
          });
          return {
            ...slot,
            ticketClassId: matchingTicketClass._id
          };
        }
        
        return slot;
      });
      
      // Step 3: Fetch full ticketclass data for slots with ticketClassIds
      const slotsWithTicketClass = await Promise.all(
        slotsWithPopulatedTicketClassIds.map(async (slot) => {
          if (slot.ticketClassId && slot.ticketClassId !== "") {
            try {
              const res = await fetch(`/api/ticket/classes/${slot.ticketClassId}`);
              if (res.ok) {
                const ticket = await res.json();
                return {
                  date: ticket.date?.slice(0, 10),
                  start: ticket.hour,
                  end: ticket.endHour,
                  classType: (ticket.type === 'date' ? 'D.A.T.E' : ticket.type === 'bdi' ? 'B.D.I' : ticket.type === 'adi' ? 'A.D.I' : ticket.type),
                  classId: ticket.classId,
                  locationId: ticket.locationId,
                  duration: ticket.duration,
                  drivingClassName: classesMap[ticket.classId as string] || ticket.classId,
                  locationName: locationsMap[ticket.locationId as string] || ticket.locationId,
                  status: slot.status || 'available',
                  booked: slot.booked ?? false,
                  studentId: slot.studentId ?? null,
                  ticketClassId: slot.ticketClassId,
                  // slotId solo debe ser el del slot, nunca el ticketClassId
                  slotId: slot.slotId || (slot as any)._id,
                };
              } else {
                return slot;
              }
            } catch {
              return slot;
            }
          }
          return slot;
        })
      );
      setSchedule(slotsWithTicketClass.filter(Boolean));
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
    
    // Limpiar todos los arrays de eliminación
    setTicketClassIdsToDelete([]);
    setDrivingTestSlotsToDelete([]);
    
    // Limpiar localStorage
    clearScheduleDraft();
    
    // Restablecer estado del modal
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
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

  const calendarEvents = schedule.map((slot: Slot) => ({
    title:
      (slot.status === "scheduled"
        ? "Booked"
        : slot.status === "cancelled"
        ? "Cancelled"
        : slot.status === "available"
        ? "Available"
        : slot.booked
        ? "Booked"
        : "Available") +
      (slot.classType ? ` - ${slot.classType}` : ""),
    start: `${slot.date}T${slot.start}`,
    end: `${slot.date}T${slot.end}`,
    backgroundColor:
      slot.status === "scheduled"
        ? "blue"
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
    },
  }));

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
    
    setCurrentSlot({ start, end, booked: false, recurrence: "None" });
    setIsModalOpen(true);
  };

  const originalTicketClassIds: string[] = Array.isArray(initialData?.schedule)
    ? initialData.schedule
        .filter((s: Slot) => !!s.ticketClassId)
        .map((s: Slot) => s.ticketClassId as string)
    : [];

  const handleDeleteSlot = async () => {
    if (!currentSlot) return;
    
    // Si es ticketclass (D.A.T.E, B.D.I, A.D.I), solo marcar para eliminación
    // NO hacer eliminación inmediata - solo visual hasta "Save Changes"
    if (
      typeof currentSlot.ticketClassId === 'string' &&
      currentSlot.ticketClassId &&
      ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType)
    ) {
      // Agregar a la lista para eliminación al guardar
      setTicketClassIdsToDelete((prev) => {
        // Evitar duplicados
        if (prev.includes(currentSlot.ticketClassId)) {
          return prev;
        }
        console.log('[DeleteTicketClass] Marked for deletion on save:', currentSlot.ticketClassId);
        return [...prev, currentSlot.ticketClassId];
      });
    }
    
    // Si es Driving Test, guardar el slotId para eliminarlo en el backend al guardar
    if (currentSlot.classType === 'driving test' && currentSlot.slotId) {
      setDrivingTestSlotsToDelete((prev) => [...prev, currentSlot.slotId]);
    }
    // Eliminar visualmente el slot (misma lógica para todos los tipos)
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
    toast.success("Slots deleted!");
  };

  function getSlotStatus(slotType: SlotType): "available" | "cancelled" | "scheduled" {
    if (slotType === "booked") return "scheduled";
    if (slotType === "cancelled") return "cancelled";
    return "available";
  }

  const handleUpdateSlot = async () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];
    
    // Encontrar el slot original para saber qué eliminar
    const oldSlot = schedule.find(slot => slot.slotId === currentSlot.originalSlotId);
    
    if (oldSlot) {
      // PASO 1: DELETE - Marcar el slot/ticketclass original para eliminación
      // NO hacer eliminación inmediata - solo visual hasta "Save Changes"
      
      // Si es ticketclass (D.A.T.E, B.D.I, A.D.I), marcarlo para eliminación al guardar
      if (oldSlot.ticketClassId && ["D.A.T.E", "B.D.I", "A.D.I"].includes(oldSlot.classType || "")) {
        setTicketClassIdsToDelete((prev) => {
          if (prev.includes(oldSlot.ticketClassId!)) {
            return prev;
          }
          console.log('[UPDATE] Marked old ticketclass for deletion on save:', oldSlot.ticketClassId);
          return [...prev, oldSlot.ticketClassId!];
        });
      }
      
      // Si es driving test, marcarlo para eliminación en el backend
      if (oldSlot.classType === 'driving test' && oldSlot.slotId) {
        setDrivingTestSlotsToDelete((prev) => [...prev, oldSlot.slotId!]);
      }
    }
    
    // PASO 2: CREATE - Crear el nuevo slot (la lógica existente para crear)
    setSchedule((prevSchedule: Slot[]) => {
      // Remover el slot original
      const filtered = prevSchedule.filter(slot => slot.slotId !== currentSlot.originalSlotId);
      const newSlotId = uuidv4();
      
      // Crear el nuevo slot
      const newSlot = {
        ...currentSlot,
        date,
        start: startTime,
        end: endTime,
        booked: slotType === "booked",
        studentId: slotType === "booked" ? selectedStudent : null,
        status: getSlotStatus(slotType),
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
        // NO heredar ticketClassId del slot original - se creará uno nuevo al guardar
        ticketClassId: undefined,
      };
      
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
    if (slotType === "booked" && !selectedStudent) {
      toast.error("Please select a student for a booked slot.");
      return;
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
          status: slotType === "booked" ? "scheduled" : slotType,
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
        status: "available",
        cupos: 30,
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
        booked: slotType === "booked",
        studentId: slotType === "booked" ? selectedStudent : null,
        slotId: uuidv4(), // Nuevo ID para cada slot
      };
      
      allNewSlots.push(newSlot);
    }
    
    setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
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
    if (realSlot && realSlot.ticketClassId && !realSlot.classType) {
      try {
        const res = await fetch(`/api/ticket/classes/${realSlot.ticketClassId}`);
        if (res.ok) {
          const ticket = await res.json();
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
            classType: (ticket.type === 'date' ? 'D.A.T.E' : ticket.type === 'bdi' ? 'B.D.I' : ticket.type === 'adi' ? 'A.D.I' : ticket.type),
            classId: ticket.classId,
            amount: realSlot.amount,
            duration: ticket.duration,
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: ticket.locationId,
          });
          setSlotType(realSlot.status === "scheduled" ? "booked" : realSlot.status === "cancelled" ? "cancelled" : "available");
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        }
      } catch {
        // Ignore error
      }
    }
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
    });
    if (realSlot?.status === "scheduled") setSlotType("booked");
    else if (realSlot?.status === "cancelled") setSlotType("cancelled");
    else setSlotType("available");
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

  const createMissingTicketClasses = async (schedule: Slot[]) => {
    const updatedSchedule: Slot[] = [];
    console.log('[CREATE_MISSING] Processing ONLY NEW slots needing ticketclass creation:', schedule.length);
    
    // DOUBLE-CHECK: filtrar una vez más para evitar cualquier slot con ticketClassId
    const trulyNewSlots = schedule.filter(slot => {
      if (slot.ticketClassId) {
        console.error('[CREATE_MISSING] CRITICAL ERROR: Slot with ticketClassId detected in creation queue!', {
          date: slot.date,
          start: slot.start,
          end: slot.end,
          ticketClassId: slot.ticketClassId
        });
        return false; // NEVER process slots with existing ticketClassId
      }
      if (!["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        console.error('[CREATE_MISSING] ERROR: Non-ticketclass slot should not be here!', slot.classType);
        return false;
      }
      return true;
    });
    
    console.log('[CREATE_MISSING] After final filter:', {
      original: schedule.length,
      filtered: trulyNewSlots.length,
      filtered_slots: trulyNewSlots.map(s => ({
        date: s.date,
        start: s.start,
        end: s.end,
        classType: s.classType,
        slotId: s.slotId
      }))
    });
    
    for (const slot of trulyNewSlots) {
      console.log('[CREATE_MISSING] Processing NEW slot for ticketclass creation:', {
        date: slot.date,
        start: slot.start,
        end: slot.end,
        classType: slot.classType,
        hasTicketClassId: !!slot.ticketClassId
      });
      
      console.log('[CREATE_MISSING] Creating ticketclass for slot:', {
        classType: slot.classType,
        date: slot.date,
        start: slot.start,
        end: slot.end
      });
      
      // Ensure instructor is assigned to location before creating ticket class
      if (slot.locationId && initialData?._id) {
        try {
          await ensureInstructorAssignedToLocation(slot.locationId, initialData._id);
        } catch (err) {
          // Error already handled by toast, skip this slot
          continue;
        }
      }
      
      // Ensure date is in YYYY-MM-DD format and duration is a string like '2h', '4h', '8h', '12h' for payload
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
      } else if (typeof slot.duration === "string") {
        const match = slot.duration.match(/(2|4|8|12)/);
        durationForPayload = match ? `${match[1]}h` : "4h";
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
        students: [],
      };
      
      console.log("[TicketClass] Creating with payload:", ticketPayload);
      const res = await fetch("/api/ticket/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketPayload),
      });
      
      if (res.ok) {
        const ticket = await res.json();
        console.log("[TicketClass] Successfully created:", ticket._id, "for date:", dateForPayload);
        updatedSchedule.push({
          ticketClassId: ticket._id,
          status: "available",
          cupos: slot.cupos ?? 30,
          date: slot.date,
          start: slot.start,
          end: slot.end,
        } as Slot);
      } else {
        const errorText = await res.text();
        console.error("[TicketClass] Backend error for slot:", {
          date: dateForPayload,
          hour: slot.start,
          classType: slot.classType,
          error: errorText
        });
        toast.error(`Failed to create ticket class: ${errorText}`);
        throw new Error(`Failed to create ticket class: ${errorText}`);
      }
    }
    
    console.log('[CREATE_MISSING] Created', updatedSchedule.length, 'new ticketclass slots');
    return updatedSchedule;
  };

  const onSubmit = async (values: InstructorData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    
    console.log('[SUBMIT] Starting submit with schedule:', schedule.map(s => ({
      date: s.date,
      start: s.start,
      end: s.end,
      classType: s.classType,
      ticketClassId: s.ticketClassId,
      slotId: s.slotId
    })));
    
    const photoString = Array.isArray(values.photo)
      ? values.photo[0] || ""
      : values.photo || "";
    
    // Guardar una copia de ticketClassIdsToDelete para usar en todo el proceso
    const idsToDelete = [...ticketClassIdsToDelete];
    console.log('[SUBMIT] TicketClass IDs to delete:', idsToDelete);
    
    // NUEVO: Identificar TODOS los ticketclasses que deben eliminarse
    // Comparar schedule original vs actual para encontrar ticketclasses eliminados
    const originalTicketClasses = (initialData?.schedule || [])
      .filter((slot: Slot) => slot.ticketClassId)
      .map((slot: Slot) => slot.ticketClassId as string);
    
    const currentTicketClasses = schedule
      .filter(slot => slot.ticketClassId)
      .map(slot => slot.ticketClassId);
    
    // Añadir ticketclasses que estaban en el original pero ya no están en el actual
    const missingTicketClasses = originalTicketClasses.filter(
      (id: string) => !currentTicketClasses.includes(id)
    );
    
    // Combinar ambas listas y eliminar duplicados
    const allIdsToDelete = [...new Set([...idsToDelete, ...missingTicketClasses])];
    console.log('[SUBMIT] ALL TicketClass IDs to delete (including missing):', allIdsToDelete);
    
    // Eliminar TODOS los ticketclasses marcados para eliminación
    // Esto asegura que se eliminen tanto de la colección ticketclasses como del schedule del instructor
    for (const id of allIdsToDelete) {
      try {
        console.log(`[SUBMIT] Attempting to delete ticketclass ${id}`);
        const response = await fetch(`/api/ticket/classes/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[SUBMIT] Failed to delete ticketclass ${id}:`, errorText);
          toast.error(`Failed to delete ticketclass ${id}: ${errorText}`);
        } else {
          const result = await response.text();
          console.log(`[SUBMIT] Successfully deleted ticketclass ${id}:`, result);
        }
      } catch {
        console.error(`[SUBMIT] Error deleting ticketclass ${id}`);
        toast.error(`Error deleting ticketclass ${id}`);
      }
    }
    
    // Eliminar los Driving Test del schedule del instructor en el backend
    if (initialData?._id && drivingTestSlotsToDelete.length > 0) {
      for (const slotId of drivingTestSlotsToDelete) {
        await fetch(`/api/instructors/${initialData._id}/schedule`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotId }),
        });
      }
      setDrivingTestSlotsToDelete([]);
    }
    
    // Filtrar el schedule para remover los slots eliminados
    const filteredSchedule = schedule.filter(
      slot => !slot.ticketClassId || !allIdsToDelete.includes(slot.ticketClassId)
    );
    
    console.log('[SUBMIT] Filtered schedule before createMissingTicketClasses:', {
      original: schedule.length,
      filtered: filteredSchedule.length,
      slotsWithTicketClassId: filteredSchedule.filter(s => s.ticketClassId).length,
      slotsWithoutTicketClassId: filteredSchedule.filter(s => !s.ticketClassId).length
    });
    
    // Solo resetear el array después de haber completado todas las operaciones
    setTicketClassIdsToDelete([]);
    for (const slot of filteredSchedule) {
      if (slot.ticketClassId && originalTicketClassIds.includes(slot.ticketClassId)) {
        const originalSlot = (initialData?.schedule || []).find((s: Slot) => s.ticketClassId === slot.ticketClassId);
        if (originalSlot) {
          const changedKeyFields = (
            slot.classId !== originalSlot.classId ||
            slot.duration !== originalSlot.duration ||
            slot.locationId !== originalSlot.locationId ||
            slot.date !== originalSlot.date ||
            slot.start !== originalSlot.start ||
            slot.end !== originalSlot.end
          );
          if (changedKeyFields) {
            const ticketPayload = {
              locationId: slot.locationId,
              date: slot.date,
              hour: slot.start,
              endHour: slot.end,
              classId: slot.classId,
              type: mapClassTypeForBackend(slot.classType),
              duration: slot.duration,
              instructorId: initialData?._id,
              students: [],
            };
            const res = await fetch("/api/ticket/classes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ticketPayload),
            });
            if (res.ok) {
              const ticket = await res.json();
              await fetch(`/api/ticket/classes/${slot.ticketClassId}`, { method: 'DELETE' });
              slot.ticketClassId = ticket._id;
            } else {
              const errorText = await res.text();
              toast.error(`Failed to update ticket class: ${errorText}`);
              setLoading(false);
              return;
            }
          } else {
            await fetch(`/api/ticket/classes/${slot.ticketClassId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: slot.date,
                hour: slot.start,
                endHour: slot.end,
                duration: slot.duration,
                classId: slot.classId,
                locationId: slot.locationId,
              }),
            });
          }
        }
      }
    }
    let finalSchedule: Slot[] = [];
    
    // SEPARAR: slots que ya tienen ticketClassId vs slots que necesitan creación
    const slotsWithExistingTicketClass = filteredSchedule.filter(slot => {
      if (slot.ticketClassId) {
        console.log('[SUBMIT] Slot with existing ticketClassId, will keep as-is:', {
          date: slot.date,
          start: slot.start, 
          end: slot.end,
          ticketClassId: slot.ticketClassId
        });
        return true;
      }
      return false;
    });

    const slotsNeedingTicketClassCreation = filteredSchedule.filter(slot => {
      if (!slot.ticketClassId && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        console.log('[SUBMIT] Slot without ticketClassId needing creation:', {
          date: slot.date,
          start: slot.start,
          end: slot.end,
          classType: slot.classType,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId
        });
        return true;
      } else if (slot.ticketClassId && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        console.log('[SUBMIT] Slot WITH ticketClassId (EXCLUDED from creation):', {
          date: slot.date,
          start: slot.start,
          end: slot.end,
          classType: slot.classType,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId
        });
      }
      return false;
    });

    const slotsNotNeedingTicketClass = filteredSchedule.filter(slot => {
      if (!slot.ticketClassId && !["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        console.log('[SUBMIT] Slot not needing ticketclass (driving test, etc):', {
          date: slot.date,
          start: slot.start,
          end: slot.end,
          classType: slot.classType
        });
        return true;
      }
      return false;
    });
    
    console.log('[SUBMIT] About to call createMissingTicketClasses with:', {
      slotsWithExistingTicketClass: slotsWithExistingTicketClass.length,
      slotsNeedingTicketClassCreation: slotsNeedingTicketClassCreation.length,
      slotsNotNeedingTicketClass: slotsNotNeedingTicketClass.length,
      totalSlots: filteredSchedule.length
    });
    
    // Solo crear ticketclasses para slots que realmente lo necesitan
    let createdTicketClassSlots: Slot[] = [];
    if (slotsNeedingTicketClassCreation.length > 0) {
      try {
        createdTicketClassSlots = await createMissingTicketClasses(slotsNeedingTicketClassCreation);
      } catch (err) {
        console.error('[SUBMIT] Error creating ticketclasses:', err);
        toast.error("Error creating ticketclasses");
        setLoading(false);
        return;
      }
    }
    
    // Combinar todos los slots para el schedule final
    finalSchedule = [
      ...slotsWithExistingTicketClass,
      ...createdTicketClassSlots,
      ...slotsNotNeedingTicketClass
    ];
    
    console.log('[SUBMIT] Final schedule composition:', {
      total: finalSchedule.length,
      withTicketClassId: finalSchedule.filter(s => s.ticketClassId).length,
      withoutTicketClassId: finalSchedule.filter(s => !s.ticketClassId).length
    });
    const bodyToSend: Record<string, unknown> = {
      instructorId: initialData?._id ?? "",
      ...values,
      photo: photoString,
      schedule: finalSchedule,
    };
    if (initialData && !bodyToSend.password) {
      delete bodyToSend.password;
    }
    try {
      const res = await fetch(`/api/instructors`, {
        method: initialData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Instructor saved successfully!");
        setSchedule([]);
        clearScheduleDraft();
        window.location.href = "/instructors";
      } else {
        toast.error(data.message || "Error saving instructor.");
      }
    } catch {
      toast.error("Server error.");
    } finally {
      setLoading(false);
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
