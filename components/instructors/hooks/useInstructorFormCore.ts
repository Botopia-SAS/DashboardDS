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

    console.log('[DIFF] 🔍 Starting diff analysis');
    console.log('[DIFF] Schedule Summary:', {
      originalCount: originalSchedule.length,
      currentCount: currentSchedule.length
    });

    const hasRealUserChanges = currentSchedule.some(currentSlot => {
      // CRITICAL FIX: Only detect EDITS to existing slots, NOT new slots
      // isTemporary = NEW slot (should NOT trigger full diff)
      // originalSlotId = EDITED existing slot (SHOULD trigger full diff)
      const hasEditMetadata = (currentSlot as any).originalSlotId || 
                             (currentSlot as any).originalTicketClassId;
      
      const isNewSlot = (currentSlot as any).isTemporary || 
                        (currentSlot.ticketClassId && currentSlot.ticketClassId.toString().startsWith('temp-'));
      
      if (hasEditMetadata) {
        console.log('[DIFF] 🔍 Found EDITED existing slot (real user change):', {
          slotId: currentSlot.slotId,
          ticketClassId: currentSlot.ticketClassId,
          classType: currentSlot.classType,
          originalSlotId: (currentSlot as any).originalSlotId,
          originalTicketClassId: (currentSlot as any).originalTicketClassId,
          reason: 'Existing slot was edited'
        });
        return true;
      }
      
      if (isNewSlot) {
        console.log('[DIFF] 🆕 Found NEW slot (not an edit):', {
          slotId: currentSlot.slotId,
          ticketClassId: currentSlot.ticketClassId,
          classType: currentSlot.classType,
          isTemporary: (currentSlot as any).isTemporary,
          reason: 'New slot added (should use pure addition protection)'
        });
        // DON'T return true here - new slots should not trigger full diff
      }
      
      return false;
    });
    
    console.log('[DIFF] 🎯 REAL USER CHANGES DETECTION RESULT:', hasRealUserChanges);

    // Additional check: Look for new slots (different count or completely new slots)
    const lengthChanged = currentSchedule.length !== originalSchedule.length;
    const hasNewSlotsByContent = currentSchedule.some(currentSlot => 
      !originalSchedule.some(originalSlot => 
        originalSlot.date === currentSlot.date &&
        originalSlot.start === currentSlot.start &&
        originalSlot.end === currentSlot.end &&
        originalSlot.classType === currentSlot.classType
      )
    );
    const hasNewSlots = lengthChanged || hasNewSlotsByContent;
    
    console.log('[DIFF] 🔍 NEW SLOTS DETECTION:', {
      originalCount: originalSchedule.length,
      currentCount: currentSchedule.length,
      lengthChanged,
      hasNewSlotsByContent,
      hasNewSlots
    });

    // ENHANCED PROTECTION: Even if there are new slots, make sure we only process what's actually new
    if (!hasRealUserChanges && hasNewSlots) {
      console.log('[DIFF] 🔍 ENHANCED PROTECTION: Found new slots but no edit metadata');
      
      // Find truly new slots (those that don't exist in original)
      const trulyNewSlots = currentSchedule.filter(currentSlot => {
        const existsInOriginal = originalSchedule.some(originalSlot => 
          originalSlot.date === currentSlot.date &&
          originalSlot.start === currentSlot.start &&
          originalSlot.end === currentSlot.end &&
          originalSlot.classType === currentSlot.classType
        );
        
        const hasNewSlotMetadata = (currentSlot as any).isTemporary || 
                                   (currentSlot.ticketClassId && currentSlot.ticketClassId.toString().startsWith('temp-'));
        
        return !existsInOriginal || hasNewSlotMetadata;
      });
      
      console.log('[DIFF] 🎯 PURE ADDITION PROTECTION: Only processing truly new slots:', {
        totalCurrentSlots: currentSchedule.length,
        totalOriginalSlots: originalSchedule.length,
        trulyNewSlotsCount: trulyNewSlots.length,
        trulyNewSlots: trulyNewSlots.map(slot => ({
          date: slot.date,
          start: slot.start,
          classType: slot.classType,
          isTemporary: (slot as any).isTemporary,
          ticketClassId: slot.ticketClassId
        }))
      });
      
      // Return only the truly new slots, keep everything else unchanged
      return {
        toCreate: trulyNewSlots,
        toUpdate: [],
        toDelete: [],
        toKeep: originalSchedule  // Keep ALL original slots unchanged
      };
    }

    if (!hasRealUserChanges && !hasNewSlots) {
      console.log('[DIFF] 🛡️ PHANTOM CHANGE PROTECTION: No real user changes detected!');
      console.log('[DIFF] ✅ Returning empty changes to prevent unnecessary operations');
      return {
        toCreate: [],
        toUpdate: [],
        toDelete: [],
        toKeep: currentSchedule
      };
    }

    console.log('[DIFF] ✅ Real user changes detected, proceeding with diff:', {
      hasRealUserChanges,
      hasNewSlots,
      currentCount: currentSchedule.length,
      originalCount: originalSchedule.length
    });
    
    console.log('[DIFF] 🚨 PROTECTION SUMMARY - Will proceed with full diff algorithm:', {
      reason: hasRealUserChanges ? 'Real user changes detected' : 'New slots found with edit metadata',
      hasRealUserChanges,
      hasNewSlots,
      protection: 'BYPASSED - Changes detected'
    });

    // SAFETY CHECK: If schedules are identical, return empty changes immediately
    if (originalSchedule.length === currentSchedule.length) {
      let schedulesIdentical = true;
      for (let i = 0; i < originalSchedule.length; i++) {
        const orig = originalSchedule[i];
        const curr = currentSchedule[i];
        
        // Quick identity check
        if (orig.ticketClassId && curr.ticketClassId && 
            orig.ticketClassId === curr.ticketClassId &&
            orig.date === curr.date &&
            orig.start === curr.start &&
            orig.classType === curr.classType) {
          continue; // This slot is identical
        } else {
          schedulesIdentical = false;
          break;
        }
      }
      
      if (schedulesIdentical) {
        console.log('[DIFF] SCHEDULES ARE IDENTICAL - No changes detected, returning empty diff');
        return {
          toCreate: [],
          toUpdate: [],
          toDelete: [],
          toKeep: [...currentSchedule]
        };
      }
    }

    // FIXED: Simplified and consistent key generation for current schedule slots
    const getSlotKey = (slot: Slot): string => {
      console.log('[DIFF] getSlotKey for slot:', {
        date: slot.date,
        start: slot.start,
        classType: slot.classType,
        ticketClassId: slot.ticketClassId,
        slotId: slot.slotId,
        originalSlotId: (slot as any).originalSlotId,
        isTemporary: (slot as any).isTemporary
      });
      
      // Priority 1: Handle edited slots with originalSlotId (for type changes)
      const slotWithOriginal = slot as any;
      if (slotWithOriginal.originalSlotId) {
        // CRITICAL: Make each edited slot completely unique to prevent recurrence grouping
        const key = `edited:${slotWithOriginal.originalSlotId}:${slot.date}:${slot.start}:${slot.end}`;
        console.log('[DIFF] Using originalSlotId for edited slot with unique date/time:', key);
        return key;
      }
      
      // Priority 2: Real ticket class ID (most reliable for ticket classes)
      if (slot.ticketClassId && !slot.ticketClassId.toString().startsWith('temp-')) {
        const key = `ticket:${slot.ticketClassId}`;
        console.log('[DIFF] Using real ticketClassId key:', key);
        return key;
      }
      
      // Priority 3: Driving test slot ID (most reliable for driving tests)
      if (slot.slotId && (slot.classType === "driving test" || !["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || ""))) {
        const key = `slot:${slot.slotId}`;
        console.log('[DIFF] Using slotId key:', key);
        return key;
      }
      
      // Priority 4: Temporary ticket classes
      if ((slot.isTemporary || (slot.ticketClassId && slot.ticketClassId.toString().startsWith('temp-'))) && 
          ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        const key = `temp:${slot.ticketClassId || 'unknown'}`;
        console.log('[DIFF] Using temporary ticket class key:', key);
        return key;
      }
      
      // Priority 5: Fallback - very specific key to avoid collisions
      const key = `fallback:${slot.date}:${slot.start}:${slot.end}:${slot.classType || 'unknown'}:${slot.slotId || 'noid'}`;
      console.log('[DIFF] Using fallback key:', key);
      return key;
    };

    // FIXED: Simplified and consistent key generation for original schedule slots
    const getOriginalSlotKey = (slot: Slot): string => {
      console.log('[DIFF] getOriginalSlotKey for slot:', {
        slotId: slot.slotId,
        ticketClassId: slot.ticketClassId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start
      });
      
      // CRITICAL: Use same logic as getSlotKey but with "original:" prefix for unique tracking
      // This ensures keys are consistent between original and current schedules
      
      // Priority 1: Use slotId for driving tests and other non-ticket classes
      if (slot.slotId && (slot.classType === "driving test" || !["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || ""))) {
        const key = `slot:${slot.slotId}`;
        console.log('[DIFF] Using slotId for original slot:', key);
        return key;
      }
      
      // Priority 2: Use ticketClassId for ticket classes
      if (slot.ticketClassId && !slot.ticketClassId.toString().startsWith('temp-')) {
        const key = `ticket:${slot.ticketClassId}`;
        console.log('[DIFF] Using ticketClassId for original slot:', key);
        return key;
      }
      
      // Priority 3: For slots without proper IDs, create unique fallback
      const key = `original:${slot.date}:${slot.start}:${slot.end}:${slot.classType || 'unknown'}:${slot.ticketClassId || 'notid'}:${slot.slotId || 'nosid'}`;
      console.log('[DIFF] Using specific fallback key for original slot:', key);
      return key;
    };

    // Create lookup maps for efficient comparison
    const originalMap = new Map<string, Slot>();
    const currentMap = new Map<string, Slot>();
    const processedKeys = new Set<string>();

    // Index original schedule
    originalSchedule.forEach(slot => {
      const key = getOriginalSlotKey(slot);
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
    console.log('\n[DIFF] 🔍 PROCESSING CURRENT SCHEDULE SLOTS...');
    currentSchedule.forEach((slot, index) => {
      console.log(`\n[DIFF] ==================== PROCESSING SLOT ${index} ====================`);
      console.log('[DIFF] 📝 Current slot details:', {
        slotId: slot.slotId,
        ticketClassId: slot.ticketClassId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start,
        originalSlotId: (slot as any).originalSlotId,
        originalTicketClassId: (slot as any).originalTicketClassId,
        isTemporary: (slot as any).isTemporary
      });

      const key = getSlotKey(slot);
      console.log('[DIFF] 🔑 Generated key for current slot:', key);
      currentMap.set(key, slot);

      // Handle temporary slots (always create) - these are NEW ticket classes
      if (slot.isTemporary || (slot.ticketClassId && slot.ticketClassId.toString().startsWith('temp-'))) {
        console.log('[DIFF] ✅ DECISION: TEMPORARY SLOT → ADD TO CREATE');
        console.log('[DIFF] 📄 Temporary slot details:', {
          key,
          ticketClassId: slot.ticketClassId,
          classType: slot.classType,
          isTemporary: slot.isTemporary
        });
        changes.toCreate.push(slot);
        processedKeys.add(key);
        return;
      }

      // Try to find matching original slot
      const originalSlot = originalMap.get(key);
      console.log('[DIFF] 🔍 Looking for matching original slot with key:', key);
      console.log('[DIFF] 🔍 Found original slot?', originalSlot ? 'YES' : 'NO');
      
      if (!originalSlot) {
        // New slot - add to create
        console.log('[DIFF] ✅ DECISION: NEW SLOT → ADD TO CREATE');
        console.log('[DIFF] 📄 New slot details:', {
          key,
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId
        });
        changes.toCreate.push(slot);
      } else {
        // Existing slot found - check for changes
        console.log('[DIFF] 🔍 FOUND MATCHING ORIGINAL SLOT - ANALYZING CHANGES...');
        console.log('[DIFF] 📊 Comparison:', {
          key,
          originalType: originalSlot.classType,
          newType: slot.classType,
          originalTicketClassId: originalSlot.ticketClassId,
          newTicketClassId: slot.ticketClassId,
          originalDate: originalSlot.date,
          newDate: slot.date,
          originalStart: originalSlot.start,
          newStart: slot.start
        });
        
        // Check for class type changes
        const typeChanged = (originalSlot.classType || '').toLowerCase() !== (slot.classType || '').toLowerCase();
        console.log('[DIFF] 🔄 Type change check:', {
          original: originalSlot.classType,
          new: slot.classType,
          changed: typeChanged
        });

        if (typeChanged) {
          console.log('[DIFF] ✅ DECISION: TYPE CHANGED → DELETE OLD + CREATE NEW');
          console.log('[DIFF] 🗑️ Will delete:', {
            originalType: originalSlot.classType,
            ticketClassId: originalSlot.ticketClassId,
            date: originalSlot.date,
            start: originalSlot.start
          });
          console.log('[DIFF] ➕ Will create:', {
            newType: slot.classType,
            date: slot.date,
            start: slot.start
          });
          
          // Type changed - delete old and create new
          changes.toDelete.push(originalSlot);
          // Remove problematic IDs from the new slot to force clean creation
          const newSlotForCreation = { ...slot };
          delete (newSlotForCreation as any).ticketClassId;
          delete (newSlotForCreation as any).originalTicketClassId;
          changes.toCreate.push(newSlotForCreation);
        } else {
          const hasChanges = hasSignificantChanges(originalSlot, slot);
          console.log('[DIFF] 📊 Significant changes check:', hasChanges);
          
          if (hasChanges) {
            console.log('[DIFF] ✅ DECISION: SIGNIFICANT CHANGES → UPDATE');
            changes.toUpdate.push({ old: originalSlot, new: slot });
          } else {
            console.log('[DIFF] ✅ DECISION: NO CHANGES → KEEP');
            changes.toKeep.push(slot);
          }
        }
      }
      processedKeys.add(key);
      console.log(`[DIFF] ==================== END SLOT ${index} ====================\n`);
    });

    // Find deleted slots (in original but not in current) - ULTRA CONSERVATIVE APPROACH
    originalSchedule.forEach(slot => {
      const key = getOriginalSlotKey(slot);
      
      // ULTRA CONSERVATIVE: Only delete if we're 100% certain the slot was intentionally removed
      let hasMatchingCurrentSlot = false;
      
      // Method 1: Direct key matching
      if (processedKeys.has(key)) {
        hasMatchingCurrentSlot = true;
      }
      
      // Method 2: Exact ID matching (most reliable)
      if (!hasMatchingCurrentSlot) {
        hasMatchingCurrentSlot = currentSchedule.some(currentSlot => {
          // Exact ticketClassId match (most reliable for ticket classes)
          if (slot.ticketClassId && currentSlot.ticketClassId && 
              slot.ticketClassId === currentSlot.ticketClassId &&
              !slot.ticketClassId.toString().startsWith('temp-')) {
            return true;
          }
          
          // Exact slotId match (most reliable for driving tests)
          if (slot.slotId && currentSlot.slotId && slot.slotId === currentSlot.slotId) {
            return true;
          }
          
          return false;
        });
      }
      
      // Method 3: ULTRA CONSERVATIVE - Check if slot exists with same core properties
      if (!hasMatchingCurrentSlot) {
        hasMatchingCurrentSlot = currentSchedule.some(currentSlot => {
          return slot.date === currentSlot.date &&
                 slot.start === currentSlot.start &&
                 slot.end === currentSlot.end &&
                 slot.classType === currentSlot.classType &&
                 // For ticket classes, must also match ticketClassId
                 (slot.ticketClassId ? slot.ticketClassId === currentSlot.ticketClassId : true);
        });
        
        if (hasMatchingCurrentSlot) {
          console.log('[DIFF] CONSERVATIVE MATCH: Found slot with same properties - NOT deleting:', {
            ticketClassId: slot.ticketClassId,
            slotId: slot.slotId,
            date: slot.date,
            start: slot.start,
            classType: slot.classType
          });
        }
      }
      
      // Method 3: For ticket classes, do extra validation
      if (!hasMatchingCurrentSlot && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        // Check if there's ANY slot in current schedule with same date/time and ticket class properties
        hasMatchingCurrentSlot = currentSchedule.some(currentSlot => {
          return slot.date === currentSlot.date &&
                 slot.start === currentSlot.start &&
                 slot.end === currentSlot.end &&
                 slot.classType === currentSlot.classType &&
                 slot.ticketClassId === currentSlot.ticketClassId;
        });
        
        if (hasMatchingCurrentSlot) {
          console.log('[DIFF] Found ticket class match via date/time/type validation - NOT deleting:', {
            ticketClassId: slot.ticketClassId,
            date: slot.date,
            start: slot.start,
            classType: slot.classType
          });
        }
      }
      
      // CRITICAL: Method 4 - Check if this slot is being edited (has originalSlotId reference)
      if (!hasMatchingCurrentSlot && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        // Check if any current slot references this slot as its original
        const isBeingEdited = currentSchedule.some(currentSlot => {
          const slotWithOriginal = currentSlot as any;
          return slotWithOriginal.originalSlotId === slot.slotId ||
                 slotWithOriginal.originalTicketClassId === slot.ticketClassId;
        });
        
        if (isBeingEdited) {
          console.log('[DIFF] SLOT IS BEING EDITED - NOT deleting, keeping original in place:', {
            ticketClassId: slot.ticketClassId,
            slotId: slot.slotId,
            date: slot.date,
            start: slot.start,
            reason: 'Referenced by edited slot'
          });
          hasMatchingCurrentSlot = true;
          changes.toKeep.push(slot); // Keep the original slot
        }
      }
      
      // CRITICAL: Method 5 - Recurrence protection
      if (!hasMatchingCurrentSlot && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        // If this slot is part of a recurrence group, check if only ONE slot from the group is being edited
        const slotRecurrenceGroup = (slot as any).originalRecurrenceGroup;
        if (slotRecurrenceGroup) {
          const recurrenceGroupSlots = originalSchedule.filter(s => 
            (s as any).originalRecurrenceGroup === slotRecurrenceGroup
          );
          const editedSlotsFromGroup = currentSchedule.filter(currentSlot => {
            const slotWithOriginal = currentSlot as any;
            return recurrenceGroupSlots.some(groupSlot => 
              slotWithOriginal.originalSlotId === groupSlot.slotId ||
              slotWithOriginal.originalTicketClassId === groupSlot.ticketClassId
            );
          });
          
          console.log('[DIFF] Recurrence group analysis:', {
            slotRecurrenceGroup,
            totalInGroup: recurrenceGroupSlots.length,
            editedFromGroup: editedSlotsFromGroup.length,
            slotDate: slot.date,
            slotStart: slot.start
          });
          
          // If only some slots from the recurrence are being edited (not all deleted), keep the others
          if (editedSlotsFromGroup.length > 0 && editedSlotsFromGroup.length < recurrenceGroupSlots.length) {
            console.log('[DIFF] PARTIAL RECURRENCE EDIT - Keeping non-edited slots from recurrence group:', {
              ticketClassId: slot.ticketClassId,
              slotId: slot.slotId,
              date: slot.date,
              start: slot.start,
              reason: 'Part of partially edited recurrence group'
            });
            hasMatchingCurrentSlot = true;
            changes.toKeep.push(slot);
          }
        }
      }
      
      // EXTRA SAFETY: If this is a ticket class and we're about to delete it, 
      // make sure we're not just adding driving tests
      if (!hasMatchingCurrentSlot && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        const onlyAddingDrivingTests = changes.toCreate.every(newSlot => 
          (newSlot.classType || "").toLowerCase() === "driving test" ||
          (newSlot.isTemporary || (newSlot.ticketClassId && newSlot.ticketClassId.toString().startsWith('temp-')))
        );
        
        if (onlyAddingDrivingTests && changes.toCreate.length > 0) {
          console.warn('[DIFF] SAFETY CHECK: Preventing ticket class deletion when only adding driving tests:', {
            ticketClassId: slot.ticketClassId,
            slotClassType: slot.classType,
            newSlotsBeingAdded: changes.toCreate.map(s => ({ classType: s.classType, isTemporary: s.isTemporary }))
          });
          hasMatchingCurrentSlot = true; // Force keep this slot
          changes.toKeep.push(slot); // Explicitly add to keep list
        }
      }
      
      // FINAL SAFETY CHECK: If we still can't find a match, be EXTREMELY careful with ticket classes
      if (!hasMatchingCurrentSlot && ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")) {
        console.warn('[DIFF] CRITICAL: About to delete ticket class - final safety check:', {
          ticketClassId: slot.ticketClassId,
          slotId: slot.slotId,
          date: slot.date,
          start: slot.start,
          classType: slot.classType,
          totalOriginalSlots: originalSchedule.length,
          totalCurrentSlots: currentSchedule.length,
          currentSlotsWithSameType: currentSchedule.filter(s => s.classType === slot.classType).length
        });
        
        // If we have the same number of slots and same types, something is wrong - don't delete
        if (originalSchedule.length === currentSchedule.length) {
          console.error('[DIFF] SAFETY ABORT: Same number of slots but trying to delete - this suggests a matching error, keeping slot');
          hasMatchingCurrentSlot = true;
          changes.toKeep.push(slot);
        }
      }
      
      // CRITICAL SAFETY FOR DRIVING TESTS: Extra conservative approach
      if (!hasMatchingCurrentSlot && (slot.classType || "").toLowerCase() === "driving test") {
        console.warn('[DIFF] 🚨 EXTRA SAFETY CHECK FOR DRIVING TEST - About to delete driving test:', {
          slotId: slot.slotId,
          date: slot.date,
          start: slot.start,
          classType: slot.classType
        });
        
        // MEJORADO: Solo aplicar protección si se están eliminando MÁS de la mitad de todas las driving tests
        // Esto permite eliminaciones legítimas múltiples pero protege contra eliminaciones masivas sospechosas
        const allDrivingTestsInOriginal = originalSchedule.filter(s => 
          (s.classType || "").toLowerCase() === "driving test"
        );
        const allDrivingTestsInCurrent = currentSchedule.filter(s => 
          (s.classType || "").toLowerCase() === "driving test"
        );
        
        const deletionCount = allDrivingTestsInOriginal.length - allDrivingTestsInCurrent.length;
        const deletionPercentage = allDrivingTestsInOriginal.length > 0 ? 
          (deletionCount / allDrivingTestsInOriginal.length) * 100 : 0;
        
        console.warn('[DIFF] Driving test deletion analysis:', {
          originalDrivingTests: allDrivingTestsInOriginal.length,
          currentDrivingTests: allDrivingTestsInCurrent.length,
          deletionCount,
          deletionPercentage: Math.round(deletionPercentage),
          slotToDelete: {
            slotId: slot.slotId,
            date: slot.date,
            start: slot.start
          }
        });
        
        // NUEVA LÓGICA CORREGIDA: Solo proteger contra eliminaciones claramente sospechosas
        // Permitir eliminaciones legítimas múltiples pero proteger contra bugs que eliminen TODO
        const isSuspiciousMassDeletion = (
          // Solo proteger si se eliminan TODAS las driving tests Y hay más de 2 originales
          allDrivingTestsInCurrent.length === 0 && 
          allDrivingTestsInOriginal.length > 2 &&
          // Y no hay evidencia de que el usuario esté creando nuevas driving tests
          !currentSchedule.some(s => (s.classType || "").toLowerCase() === "driving test" && 
                                   (s as any).isTemporary === true)
        );
        
        if (isSuspiciousMassDeletion) {
          console.error('[DIFF] 🚨 SUSPICIOUS TOTAL DELETION: ALL driving tests being deleted - ABORTING to prevent data loss');
          console.error('[DIFF] This suggests a system bug. If intentional, delete them one by one.');
          console.error('[DIFF] Deletion stats:', {
            total: allDrivingTestsInOriginal.length,
            remaining: allDrivingTestsInCurrent.length,
            toDelete: deletionCount,
            percentage: Math.round(deletionPercentage)
          });
          hasMatchingCurrentSlot = true; // Force keep this slot
          changes.toKeep.push(slot); // Explicitly add to keep list
        } else {
          console.log('[DIFF] ✅ Driving test deletion approved:', {
            deletionCount,
            deletionPercentage: Math.round(deletionPercentage),
            reason: deletionCount === allDrivingTestsInOriginal.length ? 
              'Total deletion detected but appears intentional' : 
              'Partial deletion - within acceptable limits'
          });
        }
      }

      if (!hasMatchingCurrentSlot) {
        console.log('[DIFF] CONFIRMED DELETION after all safety checks:', { 
          key,
          ticketClassId: slot.ticketClassId,
          slotId: slot.slotId,
          date: slot.date, 
          start: slot.start, 
          classType: slot.classType,
          reason: 'No matching slot found in current schedule after exhaustive search'
        });
        changes.toDelete.push(slot);
      } else {
        console.log('[DIFF] KEEPING SLOT - Found matching current slot:', {
          key,
          ticketClassId: slot.ticketClassId,
          slotId: slot.slotId,
          date: slot.date,
          start: slot.start,
          classType: slot.classType
        });
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

    // FINAL SUMMARY WITH ULTRA DETAILED BREAKDOWN
    console.log('\n=====================================');
    console.log('[DIFF] 🎯 FINAL DIFF RESULT SUMMARY');
    console.log('=====================================');
    console.log('[DIFF] Counts:', {
      toCreate: changes.toCreate.length,
      toUpdate: changes.toUpdate.length,
      toDelete: changes.toDelete.length,
      toKeep: changes.toKeep.length,
      removedUnnecessaryUpdates: removedUpdates.length
    });

    console.log('\n[DIFF] 🗑️ DELETIONS (Will be deleted from database):');
    changes.toDelete.forEach((slot, index) => {
      console.log(`[DIFF] DELETE[${index}]:`, {
        ticketClassId: slot.ticketClassId,
        slotId: slot.slotId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start,
        reason: 'Either direct deletion or being replaced due to type change'
      });
    });

    console.log('\n[DIFF] ➕ CREATIONS (Will be created in database):');
    changes.toCreate.forEach((slot, index) => {
      console.log(`[DIFF] CREATE[${index}]:`, {
        ticketClassId: slot.ticketClassId,
        slotId: slot.slotId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start,
        isTemporary: (slot as any).isTemporary,
        originalSlotId: (slot as any).originalSlotId,
        originalTicketClassId: (slot as any).originalTicketClassId,
        reason: slot.isTemporary ? 'New temporary slot' : 
                (slot as any).originalSlotId ? 'Replacement for edited slot' : 'Completely new slot'
      });
    });

    console.log('\n[DIFF] 🔄 UPDATES (Will be updated in database):');
    changes.toUpdate.forEach((update, index) => {
      console.log(`[DIFF] UPDATE[${index}]:`, {
        old: {
          ticketClassId: update.old.ticketClassId,
          classType: update.old.classType,
          date: update.old.date,
          start: update.old.start
        },
        new: {
          ticketClassId: update.new.ticketClassId,
          classType: update.new.classType,
          date: update.new.date,
          start: update.new.start
        }
      });
    });

    console.log('\n[DIFF] ✅ KEEPING (No changes, staying as-is):');
    changes.toKeep.forEach((slot, index) => {
      console.log(`[DIFF] KEEP[${index}]:`, {
        ticketClassId: slot.ticketClassId,
        slotId: slot.slotId,
        classType: slot.classType,
        date: slot.date,
        start: slot.start
      });
    });

    console.log('\n=====================================');
    console.log('[DIFF] 🎯 EXPECTED RESULT:');
    console.log('=====================================');
    console.log(`[DIFF] Total slots before: ${originalSchedule.length}`);
    console.log(`[DIFF] Total slots after: ${changes.toKeep.length + changes.toCreate.length + changes.toUpdate.length}`);
    console.log(`[DIFF] Net change: ${(changes.toKeep.length + changes.toCreate.length + changes.toUpdate.length) - originalSchedule.length}`);
    
    if (changes.toDelete.length === 1 && changes.toCreate.length === 1 && changes.toUpdate.length === 0) {
      console.log('[DIFF] 🔄 This looks like a SINGLE SLOT TYPE CHANGE (BDI → ADI)');
    } else if (changes.toDelete.length === 0 && changes.toCreate.length === 1 && changes.toUpdate.length === 0) {
      console.log('[DIFF] ➕ This looks like a SINGLE NEW SLOT ADDITION');
    } else if (changes.toDelete.length === 1 && changes.toCreate.length === 0 && changes.toUpdate.length === 0) {
      console.log('[DIFF] 🗑️ This looks like a SINGLE SLOT DELETION');
    } else {
      console.log('[DIFF] 🔍 Complex change pattern - review above details');
    }
    console.log('=====================================\n');

    // DETAILED LOGGING FOR DEBUGGING
    console.log('[DIFF] DETAILED ANALYSIS:');
    console.log('[DIFF] TO DELETE:', changes.toDelete.map(slot => ({
      slotId: slot.slotId,
      ticketClassId: slot.ticketClassId,
      classType: slot.classType,
      date: slot.date,
      start: slot.start
    })));
    console.log('[DIFF] TO CREATE:', changes.toCreate.map(slot => ({
      slotId: slot.slotId,
      ticketClassId: slot.ticketClassId,
      classType: slot.classType,
      date: slot.date,
      start: slot.start,
      originalSlotId: (slot as any).originalSlotId,
      originalTicketClassId: (slot as any).originalTicketClassId
    })));
    console.log('[DIFF] TO UPDATE:', changes.toUpdate.map(update => ({
      old: {
        slotId: update.old.slotId,
        ticketClassId: update.old.ticketClassId,
        classType: update.old.classType,
        date: update.old.date,
        start: update.old.start
      },
      new: {
        slotId: update.new.slotId,
        ticketClassId: update.new.ticketClassId,
        classType: update.new.classType,
        date: update.new.date,
        start: update.new.start
      }
    })));

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