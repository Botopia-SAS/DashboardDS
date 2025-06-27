import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { formSchema } from "./instructorFormSchema";
import {
  toValidClassType,
  mapClassTypeForBackend,
  normalizeDuration,
} from "./instructorFormUtils";
import { InstructorData, Slot, SlotType, User } from "./types";
import {
  generateRecurringSlots,
  getStudentName,
  normalizeSchedule,
  splitIntoTwoHourSlots,
} from "./utils";

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
      let baseSchedule = normalizeSchedule(initialData?.schedule || []);
      let classesMap: Record<string, string> = {};
      let locationsMap: Record<string, string> = {};
      try {
        const classesRes = await fetch('/api/classes');
        if (classesRes.ok) {
          const classesArr = await classesRes.json();
          classesMap = Object.fromEntries((classesArr as { _id: string, title: string }[]).map((c) => [c._id, c.title]));
        }
      } catch (e) { }
      try {
        const locationsRes = await fetch('/api/locations');
        if (locationsRes.ok) {
          const locationsArr = await locationsRes.json();
          locationsMap = Object.fromEntries((locationsArr as { _id: string, title: string }[]).map((l) => [l._id, l.title]));
        }
      } catch (e) { }
      const slotsWithTicketClass = await Promise.all(
        baseSchedule.map(async (slot) => {
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
                  slotId: slot.slotId || slot.ticketClassId,
                };
              } else {
                return slot;
              }
            } catch (e) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } catch (error) {
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
      } catch (e) {
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

  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.startStr;
    const end = selectInfo.endStr;
    setCurrentSlot({ start, end, booked: false, recurrence: "None" });
    setIsModalOpen(true);
  };

  const originalTicketClassIds: string[] = Array.isArray(initialData?.schedule)
    ? initialData.schedule
        .filter((s: any) => !!s.ticketClassId)
        .map((s: any) => s.ticketClassId)
    : [];

  const handleDeleteSlot = async () => {
    if (!currentSlot) return;
    // Si es ticketclass (D.A.T.E, B.D.I, A.D.I), primero elimina el ticket en la base de datos
    if (
      typeof currentSlot.ticketClassId === 'string' &&
      currentSlot.ticketClassId &&
      ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType)
    ) {
      try {
        console.log('[DeleteTicketClass] Deleting ticket class:', currentSlot.ticketClassId);
        const res = await fetch(`/api/ticket/classes/${currentSlot.ticketClassId}`, { method: 'DELETE' });
        const text = await res.text();
        if (!res.ok) {
          console.error('[DeleteTicketClass] Error:', text);
          toast.error("Error deleting ticket class in DB: " + text);
          return;
        } else {
          console.log('[DeleteTicketClass] Deleted OK:', text);
        }
      } catch (e) {
        console.error('[DeleteTicketClass] Exception:', e);
        toast.error("Error deleting ticket class in DB");
        return;
      }
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

  const handleUpdateSlot = () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];
    setSchedule((prevSchedule: Slot[]) => {
      const oldSlot = prevSchedule.find(slot => slot.slotId === currentSlot.originalSlotId);
      let newTicketClassIdsToDelete = [...ticketClassIdsToDelete];
      if (oldSlot && oldSlot.ticketClassId) {
        newTicketClassIdsToDelete.push(oldSlot.ticketClassId);
      }
      setTicketClassIdsToDelete(newTicketClassIdsToDelete);
      const filtered = prevSchedule.filter(slot => slot.slotId !== currentSlot.originalSlotId);
      const newSlotId = uuidv4();
      return [
        ...filtered,
        {
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
        }
      ];
    });
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    toast.success(
      "Slot updated! Remember to press 'Save Changes' to save to the database."
    );
  };

  const handleSaveSlot = () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
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
    // --- Ensure locationId is always a string (the _id) ---
    let locationId = currentSlot.locationId;
    if (locationId && typeof locationId === 'object' && '_id' in locationId) {
      locationId = locationId._id;
    }
    if (locationId && typeof locationId !== 'string') {
      locationId = String(locationId);
    }
    // ---
    if (currentSlot.classType === "driving test") {
      let newSlots: Slot[] = splitIntoTwoHourSlots(currentSlot.start, currentSlot.end, {
        booked: slotType === "booked",
        studentId: slotType === "booked" ? selectedStudent : null,
        status: slotType === "booked" ? "scheduled" : slotType,
        classType: currentSlot.classType,
        amount: currentSlot.amount,
        paid: currentSlot.paid,
        pickupLocation: currentSlot.pickupLocation,
        dropoffLocation: currentSlot.dropoffLocation,
        slotId: currentSlot.slotId || uuidv4(),
        locationId,
      });
      for (const slot of newSlots) {
        if (
          schedule.some(
            (s: Slot) =>
              s.date === slot.date && s.start === slot.start && s.end === slot.end
          )
        ) {
          toast.error("Slot already exists for that time.");
          return;
        }
      }
      setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...newSlots]);
      setIsModalOpen(false);
      setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
      setSelectedStudent("");
      setSlotType("");
      toast.success("Slot saved!");
      return;
    }
    const newDate = currentSlot.start.split("T")[0];
    const newStart = currentSlot.start.split("T")[1].slice(0, 5);
    const newEnd = currentSlot.end.split("T")[1].slice(0, 5);
    const overlapLocal = schedule.some(slot => {
      if (!slot.date || !slot.start || !slot.end) return false;
      if (slot.date !== newDate) return false;
      return (
        (newStart < slot.end && newEnd > slot.start)
      );
    });
    if (overlapLocal) {
      toast.error("There is already a class scheduled that overlaps with this time (local schedule)." );
      return;
    }
    setSchedule((prevSchedule: Slot[]) => [
      ...prevSchedule,
      {
        status: "available",
        cupos: 30,
        date: newDate,
        start: newStart,
        end: newEnd,
        classType: toValidClassType(currentSlot.classType),
        classId: (currentSlot as any).classId,
        duration: (currentSlot as any).duration,
        locationId, // always string
        amount: (currentSlot as any).amount,
        paid: (currentSlot as any).paid,
        pickupLocation: (currentSlot as any).pickupLocation,
        dropoffLocation: (currentSlot as any).dropoffLocation,
        booked: slotType === "booked",
        studentId: slotType === "booked" ? selectedStudent : null,
        slotId: currentSlot.slotId || uuidv4(),
      },
    ]);
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSlotType("");
    toast.success("Slot saved!");
  };

  const handleEventClick = async (eventInfo: any) => {
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
      } catch (e) {}
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
    } catch (err: any) {
      toast.error(err.message || "Error asignando instructor a la ubicación");
      throw err;
    }
  }

  const createMissingTicketClasses = async (schedule: Slot[]) => {
    const updatedSchedule: Slot[] = [];
    for (const slot of schedule) {
      if (slot.ticketClassId) {
        if (["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
          updatedSchedule.push({
            ticketClassId: slot.ticketClassId,
            status: slot.status,
            cupos: slot.cupos ?? 30,
            date: slot.date,
            start: slot.start,
            end: slot.end,
          } as Slot);
        } else {
          updatedSchedule.push(slot);
        }
        continue;
      }
      if (["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        // Ensure instructor is assigned to location before creating ticket class
        if (slot.locationId && initialData?._id) {
          try {
            await ensureInstructorAssignedToLocation(slot.locationId, initialData._id);
          } catch (err) {
            // Error already handled by toast, skip this slot
            continue;
          }
        }
        // Ensure date is ISO string and duration is a string like '2h', '4h', '8h', '12h' for payload
        let isoDate = slot.date;
        if (slot.date && !slot.date.includes("T")) {
          isoDate = new Date(slot.date).toISOString();
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
          date: isoDate,
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
          console.error("[TicketClass] Backend error:", errorText);
          toast.error(`Failed to create ticket class: ${errorText}`);
          throw new Error(`Failed to create ticket class: ${errorText}`);
        }
      } else {
        updatedSchedule.push(slot);
      }
    }
    return updatedSchedule;
  };

  const onSubmit = async (values: InstructorData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    const photoString = Array.isArray(values.photo)
      ? values.photo[0] || ""
      : values.photo || "";
    for (const id of ticketClassIdsToDelete) {
      await fetch(`/api/ticket/classes/${id}`, { method: 'DELETE' });
    }
    setTicketClassIdsToDelete([]);
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
    let filteredSchedule = schedule.filter(
      slot => !slot.ticketClassId || !ticketClassIdsToDelete.includes(slot.ticketClassId)
    );
    for (const slot of filteredSchedule) {
      if (slot.ticketClassId && originalTicketClassIds.includes(slot.ticketClassId)) {
        const originalSlot = (initialData?.schedule || []).find((s: any) => s.ticketClassId === slot.ticketClassId);
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
    try {
      finalSchedule = await createMissingTicketClasses(filteredSchedule);
    } catch (err) {
      setLoading(false);
      return;
    }
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
    } catch (error) {
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
    initialData,
    router,
  };
}
