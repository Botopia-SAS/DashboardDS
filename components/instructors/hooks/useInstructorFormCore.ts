import { InstructorData, Slot } from "../types";
import { normalizeSlotForComparison } from "./useInstructorFormHelpers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "../instructorFormSchema";
import toast from "react-hot-toast";

export function useInstructorFormCore(initialData?: InstructorData) {
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
      
      // Priority 3: For ticket classes, handle both existing and modified slots
      if (["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        // For editing scenarios, preserve the original ticket class ID even if it's not in the current slot
        const slotWithOriginal = slot as any;
        
        // Check if we have an originalTicketClassId (preserved during edit)
        if (slotWithOriginal.originalTicketClassId && !slotWithOriginal.originalTicketClassId.toString().startsWith('temp-')) {
          return `ticket:${slotWithOriginal.originalTicketClassId}`;
        }
        
        // Check if this slot has an originalSlotId (indicating it's being edited)
        if (slotWithOriginal.originalSlotId) {
          // For editing scenarios, try to find the original ticket class ID
          const originalSlotInSchedule = originalSchedule.find(s => s.slotId === slotWithOriginal.originalSlotId);
          if (originalSlotInSchedule?.ticketClassId && !originalSlotInSchedule.ticketClassId.toString().startsWith('temp-')) {
            return `ticket:${originalSlotInSchedule.ticketClassId}`;
          }
        }
        
        // If no ticketClassId available, use date/time/type combination - but make it very specific
        // This helps prevent false matches during updates
        return `tickettime:${slot.date}:${slot.start}:${slot.end}:${slot.classType}:${slot.classId || 'noclass'}:${slot.locationId || 'noloc'}:${slot.duration || '60'}`;
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
        changes.toCreate.push(slot);
        processedKeys.add(key);
        return;
      }

      const originalSlot = originalMap.get(key);
      
      if (!originalSlot) {
        // New slot - could be driving test or new ticket class
        changes.toCreate.push(slot);
      } else {
        // Detecta cambio de tipo de clase
        if ((originalSlot.classType || '').toLowerCase() !== (slot.classType || '').toLowerCase()) {
          // Si cambia de ticketclass a driving test, o entre ticketclasses, elimina y crea
          changes.toDelete.push(originalSlot);
          changes.toCreate.push(slot);
        } else if (hasSignificantChanges(originalSlot, slot)) {
          changes.toUpdate.push({ old: originalSlot, new: slot });
        } else {
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

  return {
    form,
    ensureInstructorAssignedToLocation,
    calculateScheduleChangesProfessional,
  };
} 