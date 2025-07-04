import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { InstructorData, Slot } from "./types";
import { normalizeSchedule, convertTo24HourFormat } from "./utils";
import { mapClassTypeForBackend } from "./instructorFormUtils";
import { useInstructorFormState } from "./hooks/useInstructorFormState";
import { useTicketClassCache } from "./hooks/useTicketClassCache";
import { useInstructorFormCore } from "./hooks/useInstructorFormCore";
import { useInstructorFormHandlers } from "./hooks/useInstructorFormHandlers";

export function useInstructorForm(initialData?: InstructorData) {
  const router = useRouter();
  
  // Usar los hooks modulares
  const state = useInstructorFormState(initialData);
  const { form, ensureInstructorAssignedToLocation, calculateScheduleChangesProfessional } = useInstructorFormCore(initialData);
  const ticketCache = useTicketClassCache({
    initialData,
    enrichedTicketData: state.enrichedTicketData,
    setEnrichedTicketData: state.setEnrichedTicketData,
    allInstructorTicketClasses: state.allInstructorTicketClasses,
    setAllInstructorTicketClasses: state.setAllInstructorTicketClasses,
    instructorTicketClassesLoaded: state.instructorTicketClassesLoaded,
    setInstructorTicketClassesLoaded: state.setInstructorTicketClassesLoaded,
    loadedTicketClassIds: state.loadedTicketClassIds,
    setLoadedTicketClassIds: state.setLoadedTicketClassIds
  });

  // Función para verificar si hay superposición de horarios
  const checkTimeOverlap = (slot: Slot, existingSlots: Slot[]): { overlaps: boolean, overlappingSlot?: Slot } => {
    const slotDate = slot.date;
    const slotStart = convertTo24HourFormat(slot.start);
    const slotEnd = convertTo24HourFormat(slot.end);
    
    const slotsOnSameDay = existingSlots.filter(existing => 
      existing.date === slotDate && 
      (!slot.ticketClassId || existing.ticketClassId !== slot.ticketClassId)
    );
    
    for (const existing of slotsOnSameDay) {
      const existingStart = convertTo24HourFormat(existing.start);
      const existingEnd = convertTo24HourFormat(existing.end);
      
      if (
        (slotStart < existingEnd && slotEnd > existingStart) ||
        (slotStart === existingStart && slotEnd === existingEnd)
      ) {
        return { overlaps: true, overlappingSlot: existing };
      }
    }
    
    return { overlaps: false };
  };

  // Obtener handlers del nuevo hook
  const handlers = useInstructorFormHandlers({
    schedule: state.schedule,
    setSchedule: state.setSchedule,
    setIsModalOpen: state.setIsModalOpen,
    setCurrentSlot: state.setCurrentSlot,
    setSelectedStudent: state.setSelectedStudent,
    setSelectedStudents: state.setSelectedStudents,
    setAvailableSpots: state.setAvailableSpots,
    setSlotType: state.setSlotType,
    setRecurrenceEnd: state.setRecurrenceEnd,
    assignedLocationIds: state.assignedLocationIds,
    selectedStudent: state.selectedStudent,
    selectedStudents: state.selectedStudents,
    availableSpots: state.availableSpots,
    slotType: state.slotType,
    currentSlot: state.currentSlot,
    recurrenceEnd: state.recurrenceEnd,
    initialData,
    enrichedTicketData: state.enrichedTicketData,
    setEnrichedTicketData: state.setEnrichedTicketData,
    loadedTicketClassIds: state.loadedTicketClassIds,
    setLoadedTicketClassIds: state.setLoadedTicketClassIds,
    allInstructorTicketClasses: state.allInstructorTicketClasses,
    setAllInstructorTicketClasses: state.setAllInstructorTicketClasses,
    instructorTicketClassesLoaded: state.instructorTicketClassesLoaded,
    checkTimeOverlap,
  });

  // Efectos simplificados
  useEffect(() => {
    let isMounted = true;
    async function loadSchedule() {
      if (!isMounted) return;
      state.setLoadingSchedule(true);
      try {
        await ticketCache.loadInstructorTicketClasses();
        if (!isMounted) return;
        const originalSchedule = normalizeSchedule(initialData?.schedule || []);
        if (isMounted) {
          state.setSchedule(originalSchedule);
          state.setLoadingSchedule(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('[LOAD] Error loading schedule:', error);
          state.setLoadingSchedule(false);
        }
      }
    }
    loadSchedule();
    return () => {
      isMounted = false;
    };
  }, [initialData]);

  useEffect(() => {
    if (typeof window !== "undefined" && state.scheduleDraftKey) {
      localStorage.setItem(state.scheduleDraftKey, JSON.stringify(state.schedule));
    }
  }, [state.schedule, state.scheduleDraftKey]);

  useEffect(() => {
    const originalSchedule = normalizeSchedule(initialData?.schedule || []);
    const changes = calculateScheduleChangesProfessional(originalSchedule, state.schedule);
    const hasRealChanges = changes.toCreate.length > 0 || changes.toUpdate.length > 0 || changes.toDelete.length > 0;
    state.setHasChanges(hasRealChanges);
  }, [state.schedule, initialData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        const filtered = users
          .filter((u: any) => u.role?.toLowerCase() === "user")
          .map((u: any) => ({
            ...u,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          }));
        state.setAllUsers(filtered);
      } catch {
        toast.error("Could not load students.");
      }
    };
    if (state.isModalOpen) {
      fetchUsers();
    }
  }, [state.isModalOpen]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        state.setLocations(data);
      } catch {
        toast.error("Could not load locations");
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (state.schedule.length > 0) {
      const hasTicketClasses = state.schedule.some(slot => slot.ticketClassId);
      if (hasTicketClasses && isMounted) {
        ticketCache.enrichCalendarEvents(state.schedule).catch(error => {
          if (isMounted) {
            console.error('[EFFECT] Error enriching calendar events:', error);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [state.schedule]);

  const calendarEvents = state.schedule.map((slot: Slot) => {
    let studentCount = 0;
    let totalCupos = 30;
    
    if (slot.ticketClassId && state.enrichedTicketData[slot.ticketClassId]) {
      const ticketData = state.enrichedTicketData[slot.ticketClassId];
      studentCount = Array.isArray(ticketData.students) ? ticketData.students.length : 0;
      totalCupos = ticketData.cupos || 30;
      
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
      
      if (ticketData.type && ["date", "bdi", "adi"].includes(ticketData.type.toLowerCase())) {
        slot.classType = ticketData.type.toUpperCase() === "DATE" ? "D.A.T.E" : 
                         ticketData.type.toUpperCase() === "BDI" ? "B.D.I" : 
                         ticketData.type.toUpperCase() === "ADI" ? "A.D.I" : 
                         slot.classType;
      }
    } else if (slot.students) {
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

  const clearScheduleDraft = () => {
    if (typeof window !== "undefined" && state.scheduleDraftKey) {
      localStorage.removeItem(state.scheduleDraftKey);
    }
  };

  const discardAllChanges = () => {
    const originalSchedule = normalizeSchedule(initialData?.schedule || []);
    state.setSchedule(originalSchedule);
    clearScheduleDraft();
    state.setIsModalOpen(false);
    state.setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    state.setSelectedStudent("");
    state.setSelectedStudents([]);
    state.setAvailableSpots(30);
    state.setSlotType("");
    state.setRecurrenceEnd(null);
  };

  const onSubmit = async (values: InstructorData) => {
    if (!initialData && !values.password) {
      toast.error("Password is required");
      return;
    }
    state.setLoading(true);
    state.setSavingChanges(true);
    toast.loading("Updating instructor calendar...", { id: 'saving-calendar' });
    
    try {
      let instructorId = initialData?._id;
      let isNew = !instructorId;
      let createdInstructor = null;
      let originalSchedule: Slot[] = [];
      
      if (isNew) {
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

      const changes = calculateScheduleChangesProfessional(originalSchedule, state.schedule);
      
      // Process deletions first
      for (const slot of changes.toDelete) {
        if (slot.ticketClassId && ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((slot.classType || "").toUpperCase())) {
          console.log('[UPDATE] Deleting ticket class:', slot.ticketClassId);
          await fetch(`/api/ticket/classes/${slot.ticketClassId}`, { method: 'DELETE' });
        }
      }
      
      // Process updates for ticket classes
      for (const update of changes.toUpdate) {
        const slot = update.new;
        if (slot.ticketClassId && ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((slot.classType || "").toUpperCase())) {
          console.log('[UPDATE] Updating ticket class:', slot.ticketClassId);
          const updatePayload = {
            locationId: slot.locationId,
            date: slot.date,
            hour: slot.start,
            endHour: slot.end,
            classId: slot.classId,
            type: mapClassTypeForBackend(slot.classType),
            duration: slot.duration,
            instructorId,
            students: Array.isArray(slot.students) ? slot.students : [],
            cupos: slot.cupos || 30,
          };
          const res = await fetch(`/api/ticket/classes/${slot.ticketClassId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });
          if (!res.ok) {
            const errorText = await res.text();
            console.error('[UPDATE] Failed to update ticket class:', errorText);
            throw new Error(`Failed to update ticket class: ${errorText}`);
          }
        }
      }
      
      let createdTicketClasses: any[] = [];
      const ticketClassTypes = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"];
      const toCreate = changes.toCreate.filter((slot: Slot) => ticketClassTypes.includes((slot.classType || "").toUpperCase()));
      
      toCreate.forEach((slot: Slot) => {
        if (!(slot as any).clientTempId) {
          (slot as any).clientTempId = `${Date.now()}-${Math.random()}`;
        }
      });
      
      if (toCreate.length === 1) {
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
          students: Array.isArray(slot.students) ? slot.students : [],
          cupos: slot.cupos || 30,
          clientTempId: (slot as any).clientTempId,
        };
        const res = await fetch('/api/ticket/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create ticket class');
        const created = await res.json();
        createdTicketClasses.push({ ...slot, ticketClassId: created._id, clientTempId: created.clientTempId });
      } else if (toCreate.length > 1) {
        const batchPayload = toCreate.map((slot: Slot) => ({
          locationId: slot.locationId,
          date: slot.date,
          hour: slot.start,
          endHour: slot.end,
          classId: slot.classId,
          type: mapClassTypeForBackend(slot.classType),
          duration: slot.duration,
          instructorId,
          students: Array.isArray(slot.students) ? slot.students : [],
          cupos: slot.cupos || 30,
          clientTempId: (slot as any).clientTempId,
        }));
        const res = await fetch('/api/ticket/classes/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload)
        });
        if (!res.ok) throw new Error('Failed to create ticket classes');
        const created = await res.json();
        for (let i = 0; i < created.length; i++) {
          createdTicketClasses.push({ ...toCreate[i], ticketClassId: created[i]._id, clientTempId: created[i].clientTempId });
        }
      }
      
      const finalSchedule: Slot[] = [
        ...changes.toKeep,
        ...changes.toUpdate.map((u: any) => u.new),
        ...changes.toCreate
      ].map(slot => {
        if (ticketClassTypes.includes((slot.classType || "").toUpperCase())) {
          const found = createdTicketClasses.find(s => s.clientTempId && (slot as any).clientTempId && s.clientTempId === (slot as any).clientTempId);
          if (found) {
            const { clientTempId, ...rest } = slot as any;
            return { ...rest, ticketClassId: found.ticketClassId };
          }
        }
        if ((slot.classType || "").toLowerCase() === "driving test" && slot.ticketClassId) {
          const { ticketClassId, clientTempId, ...rest } = slot as any;
          return rest;
        }
        if ((slot as any).clientTempId) {
          const { clientTempId, ...rest } = slot as any;
          return rest;
        }
        return slot;
      });

      const cleanSchedule = finalSchedule.map(slot => {
        const cleaned = { ...slot };
        if (typeof (cleaned as any).ticketClassId === 'string' && (cleaned as any).ticketClassId.startsWith('temp-')) {
          delete (cleaned as any).ticketClassId;
        }
        if (cleaned.date && cleaned.date.includes('T')) {
          cleaned.date = cleaned.date.split('T')[0];
        }
        if (cleaned.start && cleaned.start.length > 5) {
          cleaned.start = cleaned.start.slice(0,5);
        }
        if (cleaned.end && cleaned.end.length > 5) {
          cleaned.end = cleaned.end.slice(0,5);
        }
        return cleaned;
      });

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
      
      state.setLoading(false);
      state.setSavingChanges(false);
      toast.success('All changes saved!', { id: 'saving-calendar' });
      router.push('/instructors');
    } catch (error) {
      state.setLoading(false);
      state.setSavingChanges(false);
      toast.dismiss('saving-calendar');
      const err = error as Error;
      toast.error(err.message || 'Error saving instructor');
    }
  };

  return {
    form,
    loading: state.loading,
    loadingSchedule: state.loadingSchedule,
    savingChanges: state.savingChanges,
    hasChanges: state.hasChanges,
    recurrenceOptions: state.recurrenceOptions,
    recurrenceEnd: state.recurrenceEnd,
    setRecurrenceEnd: state.setRecurrenceEnd,
    schedule: state.schedule,
    setSchedule: state.setSchedule,
    calendarEvents,
    isModalOpen: state.isModalOpen,
    setIsModalOpen: state.setIsModalOpen,
    currentSlot: state.currentSlot,
    setCurrentSlot: state.setCurrentSlot,
    handleSaveSlot: handlers.handleSaveSlot,
    handleUpdateSlot: handlers.handleUpdateSlot,
    handleDeleteSlot: handlers.handleDeleteSlot,
    handleDateSelect: handlers.handleDateSelect,
    handleEventClick: handlers.handleEventClick,
    slotType: state.slotType,
    setSlotType: state.setSlotType,
    allUsers: state.allUsers,
    selectedStudent: state.selectedStudent,
    setSelectedStudent: state.setSelectedStudent,
    selectedStudents: state.selectedStudents,
    setSelectedStudents: state.setSelectedStudents,
    availableSpots: state.availableSpots,
    setAvailableSpots: state.setAvailableSpots,
    locations: state.filteredLocations,
    editModalOpen: state.editModalOpen,
    setEditModalOpen: state.setEditModalOpen,
    setEditAll: state.setEditAll,
    generatePassword,
    onSubmit,
    clearScheduleDraft,
    discardAllChanges,
    initialData,
    router,
  };
}
