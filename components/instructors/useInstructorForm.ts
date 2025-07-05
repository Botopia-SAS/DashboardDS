import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { InstructorData, Slot } from "./types";
import { normalizeSchedule, convertTo24HourFormat } from "./utils";
import { mapClassTypeForBackend } from "./instructorFormUtils";
import { useInstructorFormState } from "./hooks/useInstructorFormState";
import { useTicketClassCache } from "./hooks/useTicketClassCache";
import { useInstructorFormCore } from "./hooks/useInstructorFormCore";
import { useInstructorFormHandlers } from "./hooks/useInstructorFormHandlers";
import { useVisualFeedback } from "./hooks/useVisualFeedback";

export function useInstructorForm(initialData?: InstructorData) {
  const router = useRouter();
  
  // Usar los hooks modulares
  const state = useInstructorFormState(initialData);
  const { form, calculateScheduleChangesProfessional } = useInstructorFormCore(initialData);
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

  // Hook para retroalimentación visual inmediata
  const visualFeedback = useVisualFeedback({
    schedule: state.schedule,
    setSchedule: state.setSchedule,
    enrichedTicketData: state.enrichedTicketData,
    setEnrichedTicketData: state.setEnrichedTicketData,
    loadedTicketClassIds: state.loadedTicketClassIds,
    setLoadedTicketClassIds: state.setLoadedTicketClassIds,
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
    visualFeedback, // CRÍTICO: Pasar el visualFeedback al hook handlers
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
  }, [initialData]); // Solo recargar cuando cambian los datos iniciales del instructor

  useEffect(() => {
    if (typeof window !== "undefined" && state.scheduleDraftKey) {
      localStorage.setItem(state.scheduleDraftKey, JSON.stringify(state.schedule));
    }
  }, [state.schedule, state.scheduleDraftKey]);

  // CRÍTICO: Efecto separado para detectar cambios del visual feedback
  useEffect(() => {
    const pendingChangesCount = visualFeedback.getPendingChangesCount();
    console.log('[Visual Feedback] Pending changes count changed:', pendingChangesCount);
    
    if (pendingChangesCount > 0) {
      state.setHasChanges(true);
      console.log('[Visual Feedback] ✅ Has changes set to TRUE due to pending changes');
    }
  }, [visualFeedback.getPendingChangesCount()]);

  useEffect(() => {
    const originalSchedule = normalizeSchedule(initialData?.schedule || []);
    const changes = calculateScheduleChangesProfessional(originalSchedule, state.schedule);
    const hasTraditionalChanges = changes.toCreate.length > 0 || changes.toUpdate.length > 0 || changes.toDelete.length > 0;
    
    // CRÍTICO: También considerar cambios pendientes del sistema de visual feedback
    const pendingChangesCount = visualFeedback.getPendingChangesCount();
    const hasVisualChanges = pendingChangesCount > 0;
    
    // Hay cambios si hay cambios tradicionales O cambios pendientes del sistema visual
    const hasRealChanges = hasTraditionalChanges || hasVisualChanges;
    
    console.log('[hasChanges] Changes state:', {
      traditional: hasTraditionalChanges,
      visual: hasVisualChanges,
      pendingCount: pendingChangesCount,
      final: hasRealChanges
    });
    
    state.setHasChanges(hasRealChanges);
  }, [state.schedule, initialData, calculateScheduleChangesProfessional]); // Sin visualFeedback como dependencia para evitar loops

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const users = await res.json();
        const filtered = users
          .filter((u: Record<string, unknown>) => u.role?.toString().toLowerCase() === "user")
          .map((u: Record<string, unknown>) => ({
            ...u,
            name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.toString().trim(),
          }));
        state.setAllUsers(filtered);
      } catch {
        toast.error("Could not load students.");
      }
    };
    // Solo fetchear usuarios cuando se abre el modal y aún no hay usuarios cargados
    if (state.isModalOpen && state.allUsers.length === 0) {
      fetchUsers();
    }
  }, [state.isModalOpen, state.allUsers.length]); // Solo dependencias específicas

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
  }, []); // Solo cargar locations una vez al montar el componente

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
  }, [state.schedule]); // Solo cuando cambia el schedule para enriquecer los eventos

  const calendarEvents = state.schedule.map((slot: Slot) => {
    let studentCount = 0;
    let totalCupos = 30;
    
    // Mejorar la sincronización de datos enriquecidos usando el nuevo sistema
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
    
    // DETECTAR si solo se están agregando driving tests (NO eliminaciones)
    const isOnlyAddingDrivingTests = (() => {
      const originalDrivingTests = (initialData?.schedule || []).filter(s => s.classType?.toLowerCase() === 'driving test');
      const currentDrivingTests = state.schedule.filter(s => s.classType?.toLowerCase() === 'driving test');
      
      console.log('[EARLY DETECTION] Analyzing driving test changes:', {
        originalCount: originalDrivingTests.length,
        currentCount: currentDrivingTests.length,
        difference: currentDrivingTests.length - originalDrivingTests.length
      });
      
      // CRÍTICO: Si hay menos driving tests ahora que antes, es una ELIMINACIÓN, no una adición
      if (currentDrivingTests.length <= originalDrivingTests.length) {
        console.log('[EARLY DETECTION] ❌ Not only adding - driving tests decreased or stayed same');
        return false;
      }
      
      // Verificar que TODAS las driving tests originales están presentes
      const allOriginalDrivingTestsPresent = originalDrivingTests.every(originalDT => {
        return currentDrivingTests.some(currentDT => {
          if (originalDT.slotId && currentDT.slotId && originalDT.slotId === currentDT.slotId) {
            return true;
          }
          return originalDT.date === currentDT.date &&
                 originalDT.start === currentDT.start &&
                 originalDT.end === currentDT.end &&
                 originalDT.classType?.toLowerCase() === currentDT.classType?.toLowerCase();
        });
      });
      
      console.log('[EARLY DETECTION] All original driving tests present:', allOriginalDrivingTestsPresent);
      
      // CRÍTICO: Si NO están todas las originales presentes, es una ELIMINACIÓN
      if (!allOriginalDrivingTestsPresent) {
        console.log('[EARLY DETECTION] ❌ Not only adding - some original driving tests missing (DELETION detected)');
        return false;
      }
      
      // Verificar que solo se agregaron driving tests nuevas
      const newSlots = state.schedule.filter(currentSlot => {
        return !(initialData?.schedule || []).some(originalSlot => {
          if (originalSlot.slotId && currentSlot.slotId && originalSlot.slotId === currentSlot.slotId) {
            return true;
          }
          return originalSlot.date === currentSlot.date &&
                 originalSlot.start === currentSlot.start &&
                 originalSlot.end === currentSlot.end &&
                 originalSlot.classType === currentSlot.classType;
        });
      });
      
      const onlyDrivingTestsAdded = newSlots.every(slot => 
        (slot.classType || "").toLowerCase() === "driving test"
      );
      
      console.log('[EARLY DETECTION] New slots analysis:', {
        newSlotsCount: newSlots.length,
        onlyDrivingTestsAdded,
        newSlots: newSlots.map(s => ({ classType: s.classType, date: s.date, start: s.start }))
      });
      
      const result = allOriginalDrivingTestsPresent && onlyDrivingTestsAdded && newSlots.length > 0;
      console.log('[EARLY DETECTION] Final result - is only adding driving tests:', result);
      
      return result;
    })();
    
    console.log('[SAVE CHANGES] 🚨 EARLY DETECTION - Is only adding driving tests:', isOnlyAddingDrivingTests);
    
    // Obtener los cambios pendientes del sistema de visual feedback
    const pendingChanges = visualFeedback.getAllPendingChanges();
    
    console.log('[SAVE] Pending changes detected:', {
      total: pendingChanges.all.length,
      creates: pendingChanges.creates.length,
      updates: pendingChanges.updates.length,
      deletes: pendingChanges.deletes.length
    });
    
    toast.loading(`Saving ${pendingChanges.all.length} changes...`, { id: 'saving-calendar' });
    
    try {
      let instructorId = initialData?._id;
      const isNew = !instructorId;
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

      // CRÍTICO: Verificar si hay cambios reales en el schedule aunque no haya pending changes registrados
      const hasScheduleChanges = state.schedule.length !== originalSchedule.length || 
        !state.schedule.every(currentSlot => 
          originalSchedule.some(originalSlot => 
            originalSlot.slotId === currentSlot.slotId &&
            originalSlot.date === currentSlot.date &&
            originalSlot.start === currentSlot.start &&
            originalSlot.end === currentSlot.end &&
            originalSlot.classType === currentSlot.classType
          )
        );

      console.log('[SAVE CHANGES] Change detection analysis:', {
        pendingChangesCount: pendingChanges.all.length,
        hasScheduleChanges,
        originalScheduleLength: originalSchedule.length,
        currentScheduleLength: state.schedule.length,
        lengthDifference: state.schedule.length - originalSchedule.length
      });

      let changes;
      
      // Función para detectar eliminación específica directa - SIN LÍMITES, CUALQUIER CANTIDAD
      const detectSpecificSlotDeletions = () => {
        // Detectar si se eliminaron 1 o más slots específicos comparando schedules
        const originalCount = normalizeSchedule(initialData?.schedule || []).length;
        const currentCount = state.schedule.length;
        const difference = originalCount - currentCount;
        
        console.log('[SPECIFIC DELETIONS] Detection analysis:', {
          originalCount,
          currentCount,
          difference
        });
        
        // SIN LÍMITES: Manejar cualquier cantidad de eliminaciones específicas (1, 2, 10, 30, etc.)
        if (difference >= 1) {
          console.log(`[SPECIFIC DELETIONS] Detected ${difference} slot deletions - analyzing...`);
          
          // Encontrar TODOS los slots eliminados
          const originalSchedule = normalizeSchedule(initialData?.schedule || []);
          const deletedSlots = originalSchedule.filter(origSlot => 
            !state.schedule.some(currSlot => {
              // MÉTODO 1: Comparación por slotId (más confiable para driving tests)
              if (origSlot.slotId && currSlot.slotId && origSlot.slotId === currSlot.slotId) {
                return true;
              }
              
              // MÉTODO 2: Comparación por ticketClassId (para ticket classes)
              if (origSlot.ticketClassId && currSlot.ticketClassId && origSlot.ticketClassId === currSlot.ticketClassId) {
                return true;
              }
              
              // MÉTODO 3: Comparación exacta por propiedades (fallback)
              if (origSlot.date === currSlot.date && 
                  origSlot.start === currSlot.start && 
                  origSlot.end === currSlot.end && 
                  origSlot.classType === currSlot.classType) {
                // Para driving tests, también verificar otros campos si existen
                if ((origSlot.classType || "").toLowerCase() === "driving test") {
                  // Comparación más estricta para driving tests
                  return origSlot.booked === currSlot.booked &&
                         origSlot.status === currSlot.status;
                }
                return true;
              }
              
              return false;
            })
          );
          
          console.log(`[SPECIFIC DELETIONS] Found ${deletedSlots.length} deleted slots:`, 
            deletedSlots.map(slot => ({
              slotId: slot.slotId,
              classType: slot.classType,
              date: slot.date,
              start: slot.start,
              ticketClassId: slot.ticketClassId
            }))
          );
          
          // Verificar que el número coincide con la diferencia detectada
          if (deletedSlots.length === difference) {
            // Analizar los tipos de slots eliminados
            const drivingTestDeletions = deletedSlots.filter(slot => 
              (slot.classType || "").toLowerCase() === "driving test"
            );
            const ticketClassDeletions = deletedSlots.filter(slot => 
              ["D.A.T.E", "B.D.I", "A.D.I"].includes(slot.classType || "")
            );
            
            console.log('[SPECIFIC DELETIONS] Deletion analysis:', {
              totalDeleted: deletedSlots.length,
              drivingTestDeletions: drivingTestDeletions.length,
              ticketClassDeletions: ticketClassDeletions.length,
              drivingTestDetails: drivingTestDeletions.map(dt => ({
                date: dt.date,
                start: dt.start,
                slotId: dt.slotId,
                recurrenceGroup: dt.originalRecurrenceGroup
              }))
            });
            
            // ESPECIAL PARA DRIVING TESTS: Verificación adicional cuando hay múltiples
            if (drivingTestDeletions.length > 0) {
              console.log(`[SPECIFIC DELETIONS] 🚗 ${drivingTestDeletions.length} DRIVING TEST deletions confirmed - bypassing complex logic`);
              
              // Para recurrencia: análisis informativo (no bloqueante)
              const recurrenceGroups = new Set(
                drivingTestDeletions
                  .filter(dt => dt.originalRecurrenceGroup)
                  .map(dt => dt.originalRecurrenceGroup)
              );
              
              if (recurrenceGroups.size > 0) {
                console.log('[SPECIFIC DELETIONS] 🔄 RECURRENCE GROUP deletions analysis (informational)');
                
                // Para cada grupo de recurrencia, mostrar estadísticas
                for (const groupId of recurrenceGroups) {
                  const originalGroupSlots = originalSchedule.filter(slot => 
                    slot.originalRecurrenceGroup === groupId
                  );
                  const currentGroupSlots = state.schedule.filter(slot => 
                    slot.originalRecurrenceGroup === groupId
                  );
                  const deletedFromGroup = originalGroupSlots.length - currentGroupSlots.length;
                  
                  console.log(`[SPECIFIC DELETIONS] Group ${groupId} analysis:`, {
                    originalInGroup: originalGroupSlots.length,
                    currentInGroup: currentGroupSlots.length,
                    deletedFromGroup,
                    percentageDeleted: Math.round((deletedFromGroup / originalGroupSlots.length) * 100)
                  });
                  
                  // INFORMATIVO: Solo mostrar advertencia si se eliminó todo el grupo
                  if (deletedFromGroup === originalGroupSlots.length) {
                    console.log(`[SPECIFIC DELETIONS] ℹ️ Info: Entire recurrence group ${groupId} was deleted (${deletedFromGroup} slots)`);
                  }
                }
              }
              
              // Verificar que realmente no hay otros cambios no relacionados
              const otherOriginalSlots = originalSchedule.filter(origSlot => 
                !deletedSlots.some(deleted => 
                  deleted.slotId === origSlot.slotId ||
                  deleted.ticketClassId === origSlot.ticketClassId ||
                  (deleted.date === origSlot.date && deleted.start === origSlot.start && 
                   deleted.end === origSlot.end && deleted.classType === origSlot.classType)
                )
              );
              
              const otherChanges = otherOriginalSlots.filter(origSlot => 
                !state.schedule.some(currSlot => 
                  origSlot.slotId === currSlot.slotId ||
                  origSlot.ticketClassId === currSlot.ticketClassId ||
                  (origSlot.date === currSlot.date && origSlot.start === currSlot.start && 
                   origSlot.end === currSlot.end && origSlot.classType === currSlot.classType)
                )
              );
              
              console.log('[SPECIFIC DELETIONS] Other changes analysis:', {
                otherOriginalSlots: otherOriginalSlots.length,
                otherChanges: otherChanges.length,
                onlySpecificDeletions: otherChanges.length === 0
              });
              
              if (otherChanges.length === 0) {
                console.log(`[SPECIFIC DELETIONS] ✅ CONFIRMED: Only ${deletedSlots.length} specific slots deleted, no other changes`);
                
                // MENSAJE ESPECIAL para eliminaciones masivas
                if (deletedSlots.length >= 10) {
                  console.log(`[SPECIFIC DELETIONS] 📢 LARGE DELETION: Processing ${deletedSlots.length} specific deletions as requested`);
                }
                
                return {
                  toCreate: [],
                  toUpdate: [],
                  toDelete: deletedSlots, // TODOS los slots específicamente eliminados (sin límite)
                  toKeep: state.schedule  // TODOS los demás permanecen
                };
              } else {
                console.log('[SPECIFIC DELETIONS] ⚠️ Other changes detected alongside specific deletions:', {
                  otherChangesCount: otherChanges.length,
                  otherChanges: otherChanges.map(c => ({
                    classType: c.classType,
                    date: c.date,
                    start: c.start
                  }))
                });
                
                // PERMISIVO: Aún así procesar las eliminaciones específicas
                console.log('[SPECIFIC DELETIONS] 🔄 Processing specific deletions despite other changes');
                return {
                  toCreate: [],
                  toUpdate: [],
                  toDelete: deletedSlots, // TODOS los slots específicamente eliminados
                  toKeep: state.schedule  // TODOS los demás permanecen
                };
              }
            }
            
            // Para casos mixtos o solo ticket classes (también sin límite)
            console.log(`[SPECIFIC DELETIONS] ✅ Processing ${deletedSlots.length} mixed/ticket class deletions`);
            return {
              toCreate: [],
              toUpdate: [],
              toDelete: deletedSlots,
              toKeep: state.schedule
            };
          } else {
            console.log(`[SPECIFIC DELETIONS] ⚠️ Mismatch: Expected ${difference} deletions but found ${deletedSlots.length} deleted slots`);
            
            // NUEVO: Si hay discrepancia, aún así intentar procesar si no es muy grande
            if (Math.abs(difference - deletedSlots.length) <= 2 && deletedSlots.length > 0) {
              console.log(`[SPECIFIC DELETIONS] 🔄 Small discrepancy (${Math.abs(difference - deletedSlots.length)}), proceeding with detected deletions`);
              return {
                toCreate: [],
                toUpdate: [],
                toDelete: deletedSlots,
                toKeep: state.schedule
              };
            }
          }
        } else if (difference < 0) {
          console.log('[SPECIFIC DELETIONS] More slots now than before (additions), not a deletion case');
        } else {
          console.log('[SPECIFIC DELETIONS] Same count, no deletions detected');
        }
        
        return null;
      };

      // PRIORITARIO: Detectar eliminaciones específicas antes que cualquier otra lógica
      const specificDeletionChanges = detectSpecificSlotDeletions();
      if (specificDeletionChanges) {
        console.log('[SAVE CHANGES] 🎯 SPECIFIC SLOT DELETIONS DETECTED - Using direct approach');
        changes = specificDeletionChanges;
      } else if (isOnlyAddingDrivingTests) {
        console.log('[SAVE CHANGES] 🎯 OVERRIDE: Using additive approach for driving test additions');
        
        const newDrivingTests = state.schedule.filter(currentSlot => {
          // Solo incluir slots que NO existen en el schedule original
          return !(initialData?.schedule || []).some(originalSlot => {
            if (originalSlot.slotId && currentSlot.slotId && originalSlot.slotId === currentSlot.slotId) {
              return true;
            }
            
            return originalSlot.date === currentSlot.date &&
                   originalSlot.start === currentSlot.start &&
                   originalSlot.end === currentSlot.end &&
                   originalSlot.classType === currentSlot.classType;
          });
        });
        
        console.log('[SAVE CHANGES] New driving tests detected:', {
          count: newDrivingTests.length,
          details: newDrivingTests.map(dt => ({
            classType: dt.classType,
            date: dt.date,
            start: dt.start,
            slotId: dt.slotId
          }))
        });
        
        changes = {
          toCreate: newDrivingTests,
          toUpdate: [],
          toDelete: [],
          toKeep: normalizeSchedule(initialData?.schedule || [])
        };
        
        console.log('[SAVE CHANGES] Additive approach applied:', {
          toKeep: changes.toKeep.length,
          toCreate: changes.toCreate.length,
          toUpdate: changes.toUpdate.length,
          toDelete: changes.toDelete.length
        });
        
      } else if (pendingChanges.all.length === 0 && !hasScheduleChanges) {
        console.log('[SAVE CHANGES] No changes detected - neither pending changes nor schedule differences');
        // Truly no changes, return early
        toast.success('No changes to save', { id: 'saving-calendar' });
        state.setLoading(false);
        state.setSavingChanges(false);
        return;
      } else if (pendingChanges.all.length === 0 && hasScheduleChanges) {
        console.log('[SAVE CHANGES] ⚠️ FALLBACK: Schedule changes detected but no pending changes recorded - using diff algorithm');
        console.log('[SAVE CHANGES] This indicates a visual feedback system bug - investigating...');
        
        // CRÍTICO: Protección especial para driving tests - VERSIÓN MEJORADA
        const drivingTestDeletions = originalSchedule.filter(orig => {
          if (orig.classType?.toLowerCase() !== 'driving test') return false;
          
          // Buscar slot correspondiente en el horario actual usando múltiples métodos
          const hasMatchingSlot = state.schedule.some(curr => {
            // Método 1: Coincidencia exacta de slotId (más confiable)
            if (orig.slotId && curr.slotId && orig.slotId === curr.slotId) {
              return true;
            }
            
            // Método 2: Coincidencia por fecha, hora y tipo (para driving tests sin slotId)
            if (curr.classType?.toLowerCase() === 'driving test' &&
                orig.date === curr.date &&
                orig.start === curr.start &&
                orig.end === curr.end) {
              return true;
            }
            
            // Método 3: Coincidencia por fecha, hora y tipo, con pequeña tolerancia en el tiempo
            if (curr.classType?.toLowerCase() === 'driving test' &&
                orig.date === curr.date &&
                Math.abs(timeToMinutes(orig.start) - timeToMinutes(curr.start)) <= 30 &&
                Math.abs(timeToMinutes(orig.end) - timeToMinutes(curr.end)) <= 30) {
              return true;
            }
            
            return false;
          });
          
          return !hasMatchingSlot;
        });
        
        // Helper function para convertir tiempo a minutos
        const timeToMinutes = (time: string): number => {
          const cleanTime = convertTo24HourFormat(time);
          const [hours, minutes] = cleanTime.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        console.log('[SAVE CHANGES] Análisis de eliminaciones de driving tests:', {
          originalDrivingTests: originalSchedule.filter(s => s.classType?.toLowerCase() === 'driving test').length,
          currentDrivingTests: state.schedule.filter(s => s.classType?.toLowerCase() === 'driving test').length,
          detectedDeletions: drivingTestDeletions.length,
          deletionDetails: drivingTestDeletions.map(d => ({
            slotId: d.slotId,
            date: d.date,
            start: d.start,
            end: d.end
          }))
        });
        
        // Solo activar protección si hay múltiples eliminaciones REALES y NO se están creando nuevos driving tests
        const newDrivingTestsBeingCreated = state.schedule.filter(s => 
          s.classType?.toLowerCase() === 'driving test' && 
          !originalSchedule.some(orig => 
            orig.slotId === s.slotId || 
            (orig.date === s.date && orig.start === s.start && orig.classType?.toLowerCase() === 'driving test')
          )
        ).length;
        
        console.log('[SAVE CHANGES] Análisis completo de driving tests:', {
          eliminacionesDetectadas: drivingTestDeletions.length,
          nuevosCreandose: newDrivingTestsBeingCreated,
          deberiaActivarProteccion: drivingTestDeletions.length > 1 && newDrivingTestsBeingCreated === 0
        });
        
        // Solo activar protección si hay múltiples eliminaciones Y NO se están creando nuevos
        if (drivingTestDeletions.length > 1 && newDrivingTestsBeingCreated === 0) {
          console.error('[SAVE CHANGES] 🚨 EMERGENCY PROTECTION: Multiple driving test deletions detected WITHOUT new creations!');
          console.error('[SAVE CHANGES] This is likely a bug - preventing mass deletion');
          console.error('[SAVE CHANGES] Detected deletions:', drivingTestDeletions.map(d => ({
            slotId: d.slotId,
            date: d.date,
            start: d.start
          })));
          
          toast.error('Multiple driving test deletions detected without new creations. Please try one at a time.', { id: 'saving-calendar' });
          state.setLoading(false);
          state.setSavingChanges(false);
          return;
        } else if (drivingTestDeletions.length > 1 && newDrivingTestsBeingCreated > 0) {
          console.log('[SAVE CHANGES] ✅ Multiple driving test changes detected, but new ones are being created - allowing operation');
        }
        
        // Usar el algoritmo de diff normal para otros casos (no adding driving tests)
        changes = calculateScheduleChangesProfessional(originalSchedule, state.schedule);
      } else {
        // NUEVO: Usar la lógica específica basada en el tipo de acción requerida
        console.log('[SAVE CHANGES] Aplicando lógica específica basada en tipos de acción');
        
        const actionTypes = visualFeedback.getChangesByActionType();
        
        console.log('[SAVE CHANGES] Distribución de acciones específicas:', {
          deleteTicketAndSlotCreateNew: actionTypes.deleteTicketAndSlotCreateNew.length,
          deleteSlotCreateTicketAndSlot: actionTypes.deleteSlotCreateTicketAndSlot.length,
          deleteTicketAndSlotCreateSlot: actionTypes.deleteTicketAndSlotCreateSlot.length,
          simpleSlotUpdate: actionTypes.simpleSlotUpdate.length,
          simpleSlotCreate: actionTypes.simpleSlotCreate.length,
          simpleSlotDelete: actionTypes.simpleSlotDelete.length,
          recurrenceBreaks: actionTypes.recurrenceBreaks.length,
        });

        // Construir la estructura de cambios según la lógica específica
        const toDelete: Slot[] = [];
        const toCreate: Slot[] = [];
        const toUpdate: Array<{ old: Slot, new: Slot }> = [];

        // 1. Ticket Class modificaciones → DELETE ticket+slot, CREATE new ticket+slot  
        actionTypes.deleteTicketAndSlotCreateNew.forEach(change => {
          if (change.originalSlot) {
            toDelete.push(change.originalSlot); // Eliminar original
            toCreate.push(change.slot); // Crear nuevo
            console.log(`[SAVE CHANGES] Ticket class modification: ${change.originalSlot.classType} → ${change.slot.classType}`);
          }
        });

        // 2. Driving Test → Ticket Class → DELETE slot, CREATE ticket+slot
        actionTypes.deleteSlotCreateTicketAndSlot.forEach(change => {
          if (change.originalSlot) {
            toDelete.push(change.originalSlot); // Eliminar driving test slot
            toCreate.push(change.slot); // Crear ticket class
            console.log(`[SAVE CHANGES] Driving Test → Ticket Class: ${change.originalSlot.classType} → ${change.slot.classType}`);
          }
        });

        // 3. Ticket Class → Driving Test → DELETE ticket+slot, CREATE slot
        actionTypes.deleteTicketAndSlotCreateSlot.forEach(change => {
          if (change.originalSlot) {
            toDelete.push(change.originalSlot); // Eliminar ticket class
            toCreate.push(change.slot); // Crear driving test slot
            console.log(`[SAVE CHANGES] Ticket Class → Driving Test: ${change.originalSlot.classType} → ${change.slot.classType}`);
          }
        });

        // 4. Updates simples (sin cambio de tipo)
        actionTypes.simpleSlotUpdate.forEach(change => {
          if (change.originalSlot) {
            toUpdate.push({ old: change.originalSlot, new: change.slot });
            console.log(`[SAVE CHANGES] Simple update: ${change.slot.classType} on ${change.slot.date}`);
          }
        });

        // 5. Creaciones simples
        actionTypes.simpleSlotCreate.forEach(change => {
          toCreate.push(change.slot);
          console.log(`[SAVE CHANGES] Simple creation: ${change.slot.classType} on ${change.slot.date}`);
        });

        // 6. Eliminaciones simples
        actionTypes.simpleSlotDelete.forEach(change => {
          toDelete.push(change.slot);
          console.log(`[SAVE CHANGES] Simple deletion: ${change.slot.classType} on ${change.slot.date}`);
        });

        changes = {
          toCreate,
          toUpdate,
          toDelete,
          toKeep: state.schedule.filter(slot => 
            !pendingChanges.all.some(change => 
              change.slot.slotId === slot.slotId || 
              change.slot.ticketClassId === slot.ticketClassId ||
              (change.slot.date === slot.date && change.slot.start === slot.start && change.slot.end === slot.end)
            )
          )
        };

        console.log('[SAVE CHANGES] Estructura final de cambios específicos:', {
          toDelete: changes.toDelete.length,
          toCreate: changes.toCreate.length,
          toUpdate: changes.toUpdate.length,
          toKeep: changes.toKeep.length
        });
      }
      
      console.log('\n🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
      console.log('[EXECUTION] 🎬 STARTING EXECUTION PHASE');
      console.log('🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀');
      console.log('[EXECUTION] Diff results received:', {
        toDelete: changes.toDelete.length,
        toCreate: changes.toCreate.length,
        toUpdate: changes.toUpdate.length,
        toKeep: changes.toKeep.length
      });

      // NUEVO APPROACH: Convert all updates to DELETE + CREATE approach
      // This ensures consistency and avoids API limitations with PATCH operations
      
      // Step 1: Process ALL deletions (including updates and actual deletions)
      const allSlotsToDelete = [
        ...changes.toDelete,
        ...changes.toUpdate.map(update => update.old) // Add old versions of updated slots to deletion list
      ];
      
      console.log('\n[EXECUTION] 🗑️ PROCESSING DELETIONS');
      console.log('[EXECUTION] Total slots to delete:', allSlotsToDelete.length);
      console.log('[EXECUTION] Direct deletions:', changes.toDelete.length);
      console.log('[EXECUTION] Update deletions (old versions):', changes.toUpdate.length);
      
      for (let i = 0; i < allSlotsToDelete.length; i++) {
        const slot = allSlotsToDelete[i];
        console.log(`\n[DELETE] ========== DELETING SLOT ${i + 1}/${allSlotsToDelete.length} ==========`);
        console.log('[DELETE] Analyzing slot for deletion:', {
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId,
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          shouldDeleteTicketClass: slot.ticketClassId && ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((slot.classType || "").toUpperCase()),
          isDrivingTest: (slot.classType || "").toLowerCase() === "driving test",
          source: changes.toDelete.includes(slot) ? 'direct_deletion' : 'update_deletion'
        });
        
        // Handle ticket class deletion (external database + instructor schedule)
        if (slot.ticketClassId && ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((slot.classType || "").toUpperCase())) {
          console.log('[DELETE] STEP 1: Deleting ticket class from external collection:', {
            ticketClassId: slot.ticketClassId,
            classType: slot.classType,
            date: slot.date,
            start: slot.start,
            reason: changes.toDelete.includes(slot) ? 'Direct deletion' : 'Update via DELETE+CREATE'
          });
          
          // CRITICAL: Delete from external ticket classes collection first
          try {
            const deleteResponse = await fetch(`/api/ticket/classes/${slot.ticketClassId}`, { method: 'DELETE' });
            if (deleteResponse.ok) {
              console.log('[DELETE] ✅ External ticket class deleted successfully');
            } else {
              console.log('[DELETE] ⚠️ Failed to delete external ticket class:', await deleteResponse.text());
            }
          } catch (error) {
            console.log('[DELETE] ⚠️ Error deleting external ticket class:', error);
          }
          
          console.log('[DELETE] STEP 2: Removing slot from instructor schedule:', {
            slotId: slot.slotId,
            ticketClassId: slot.ticketClassId,
            beforeRemoval: state.schedule.length
          });
          
          // CRITICAL: Remove slot from current schedule state immediately
          state.setSchedule(prevSchedule => {
            const filteredSchedule = prevSchedule.filter(s => {
              // Remove by ticketClassId match (most reliable for ticket classes)
              if (s.ticketClassId && slot.ticketClassId && s.ticketClassId === slot.ticketClassId) {
                console.log('[DELETE] 🗑️ Removing slot by ticketClassId match:', {
                  removedSlotId: s.slotId,
                  removedTicketClassId: s.ticketClassId,
                  removedDate: s.date,
                  removedStart: s.start
                });
                return false;
              }
              
              // Fallback: Remove by slotId if available
              if (s.slotId && slot.slotId && s.slotId === slot.slotId) {
                console.log('[DELETE] 🗑️ Removing slot by slotId match:', {
                  removedSlotId: s.slotId,
                  removedDate: s.date,
                  removedStart: s.start
                });
                return false;
              }
              
              // Keep slot
              return true;
            });
            
            console.log('[DELETE] ✅ Schedule updated:', {
              beforeCount: prevSchedule.length,
              afterCount: filteredSchedule.length,
              removedCount: prevSchedule.length - filteredSchedule.length
            });
            
            return filteredSchedule;
          });
        } 
        // Handle driving test deletion (only instructor schedule - no external deletion needed)
        else if ((slot.classType || "").toLowerCase() === "driving test") {
          console.log('[DELETE] DRIVING TEST - removing from instructor schedule:', {
            slotId: slot.slotId,
            classType: slot.classType,
            date: slot.date,
            start: slot.start,
            reason: changes.toDelete.includes(slot) ? 'Direct deletion' : 'Update via DELETE+CREATE'
          });
          
          // Remove driving test slot from schedule
          state.setSchedule(prevSchedule => {
            const filteredSchedule = prevSchedule.filter(s => {
              if (s.slotId && slot.slotId && s.slotId === slot.slotId) {
                console.log('[DELETE] 🗑️ Removing driving test slot:', {
                  removedSlotId: s.slotId,
                  removedDate: s.date,
                  removedStart: s.start
                });
                return false;
              }
              return true;
            });
            
            console.log('[DELETE] ✅ Driving test schedule updated:', {
              beforeCount: prevSchedule.length,
              afterCount: filteredSchedule.length
            });
            
            return filteredSchedule;
          });
        } else {
          console.log('[DELETE] SKIPPING slot - not a recognized type for deletion:', {
            ticketClassId: slot.ticketClassId,
            classType: slot.classType,
            slotId: slot.slotId
          });
        }
      }
      
      // Step 2: Prepare all slots for creation (direct creates + updated slots)
      const allSlotsToCreate = [
        ...changes.toCreate,
        ...changes.toUpdate.map(update => {
          const newSlot = { ...update.new };
          // Mark updated slots for creation - ensure they get temporary IDs if they're ticket classes
          if (["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((newSlot.classType || "").toUpperCase())) {
            // Remove old ticketClassId to force creation of new ticket class
            delete (newSlot as any).ticketClassId;
            (newSlot as any).isTemporary = true; // Mark as temporary to ensure it goes through creation process
          }
          return newSlot;
        })
      ];
      
      console.log('\n[EXECUTION] ➕ PROCESSING CREATIONS');
      console.log('[EXECUTION] Total slots to create:', allSlotsToCreate.length);
      console.log('[EXECUTION] Direct creations:', changes.toCreate.length);
      console.log('[EXECUTION] Update creations (new versions):', changes.toUpdate.length);
      
      const createdTicketClasses: Record<string, unknown>[] = [];
      const ticketClassTypes = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"];
      
      // DIAGNÓSTICO COMPLETO: Log TODOS los slots for creation (direct + updates)
      console.log('[DIAGNOSTIC] ALL slots for creation BEFORE filtering:', {
        totalSlots: allSlotsToCreate.length,
        directCreates: changes.toCreate.length,
        updatedSlots: changes.toUpdate.length,
        slots: allSlotsToCreate.map((slot, index) => ({
          index,
          classType: slot.classType,
          locationId: slot.locationId,
          classId: slot.classId,
          duration: slot.duration,
          ticketClassId: slot.ticketClassId,
          isTemporary: (slot as any).isTemporary,
          originalSlotId: (slot as any).originalSlotId,
          date: slot.date,
          start: slot.start,
          end: slot.end,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        }))
      });

      const toCreate = allSlotsToCreate.filter((slot: Slot) => {
        const isTicketType = ticketClassTypes.includes((slot.classType || "").toUpperCase());
        const isTemporary = (slot as any).isTemporary === true;
        const hasTicketClassId = slot.ticketClassId && slot.ticketClassId.toString().startsWith('temp-');
        const isDrivingTest = (slot.classType || "").toLowerCase() === "driving test";
        
        // SOLO incluir ticket classes, NO driving tests
        const shouldInclude = (isTicketType || isTemporary || hasTicketClassId) && !isDrivingTest;
        
        // Log CADA slot individual para depuración
        console.log('[FILTER] Slot filter result:', {
          slot: {
            classType: slot.classType,
            ticketClassId: slot.ticketClassId,
            isTemporary: (slot as any).isTemporary,
            date: slot.date,
            start: slot.start
          },
          checks: {
            isTicketType,
            isTemporary,
            hasTicketClassId,
            isDrivingTest
          },
          shouldInclude
        });
        
        return shouldInclude;
      });
      
      // DIAGNÓSTICO COMPLETO: Log slots filtrados
      console.log('[DIAGNOSTIC] FILTERED slots for creation AFTER filtering:', {
        originalCount: allSlotsToCreate.length,
        filteredCount: toCreate.length,
        directCreates: changes.toCreate.length,
        updatedSlots: changes.toUpdate.length,
        filteredSlots: toCreate.map((slot, index) => ({
          index,
          classType: slot.classType,
          locationId: slot.locationId,
          classId: slot.classId,
          duration: slot.duration,
          ticketClassId: slot.ticketClassId,
          isTemporary: (slot as any).isTemporary,
          date: slot.date,
          start: slot.start,
          end: slot.end,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        }))
      });
      
      console.log('[CREATE] Analyzing slots for creation (DELETE+CREATE approach):', {
        totalSlotsForCreation: allSlotsToCreate.length,
        ticketClassesToCreate: toCreate.length,
        breakdown: {
          directCreates: changes.toCreate.length,
          updateCreates: changes.toUpdate.length
        },
        allSlotsForCreation: allSlotsToCreate.map(slot => ({
          classType: slot.classType,
          locationId: slot.locationId,
          classId: slot.classId,
          duration: slot.duration,
          ticketClassId: slot.ticketClassId,
          isTemporary: (slot as any).isTemporary,
          originalSlotId: (slot as any).originalSlotId,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        })),
        filteredTicketClasses: toCreate.map(slot => ({
          classType: slot.classType,
          locationId: slot.locationId,
          classId: slot.classId,
          duration: slot.duration,
          ticketClassId: slot.ticketClassId,
          isTemporary: (slot as any).isTemporary,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        }))
      });
      
      // CRITICAL: Check for and remove duplicate slots before creation
      const uniqueSlots = new Map<string, Slot>();
      const duplicateAnalysis: Array<{original: Slot, duplicate: Slot, key: string}> = [];
      
      toCreate.forEach((slot: Slot) => {
        // Create unique key based on date+hour+instructor+classType (matching DB constraint)
        const duplicateKey = `${slot.date}:${slot.start}:${instructorId}:${slot.classType}`;
        
        if (uniqueSlots.has(duplicateKey)) {
          const existingSlot = uniqueSlots.get(duplicateKey)!;
          console.warn('[DUPLICATE CHECK] Found duplicate - keeping first, removing duplicate:', {
            duplicateKey,
            keeping: {
              date: existingSlot.date,
              start: existingSlot.start,
              classType: existingSlot.classType,
              source: (existingSlot as any).source || 'unknown',
              isTemporary: (existingSlot as any).isTemporary,
              originalSlotId: (existingSlot as any).originalSlotId
            },
            removing: {
              date: slot.date,
              start: slot.start,
              classType: slot.classType,
              source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create',
              isTemporary: (slot as any).isTemporary,
              originalSlotId: (slot as any).originalSlotId
            }
          });
          
          duplicateAnalysis.push({
            original: existingSlot,
            duplicate: slot,
            key: duplicateKey
          });
        } else {
          uniqueSlots.set(duplicateKey, slot);
        }
        
        if (!(slot as unknown as Record<string, unknown>).clientTempId) {
          (slot as unknown as Record<string, unknown>).clientTempId = `${Date.now()}-${Math.random()}`;
        }
      });
      
      const deduplicatedToCreate = Array.from(uniqueSlots.values());
      console.log('[DUPLICATE CHECK] Comprehensive deduplication analysis:', {
        originalCount: toCreate.length,
        deduplicatedCount: deduplicatedToCreate.length,
        removedDuplicates: toCreate.length - deduplicatedToCreate.length,
        duplicateDetails: duplicateAnalysis.map(d => ({
          key: d.key,
          originalSource: changes.toCreate.includes(d.original) ? 'direct_create' : 'update_create',
          duplicateSource: changes.toCreate.includes(d.duplicate) ? 'direct_create' : 'update_create'
        }))
      });
      
      if (deduplicatedToCreate.length === 1) {
        const slot = deduplicatedToCreate[0];
        const payload = {
          locationId: slot.locationId,
          date: slot.date,
          hour: slot.start,
          endHour: slot.end,
          classId: slot.classId,
          type: mapClassTypeForBackend(slot.classType),
          duration: slot.duration || "4h",
          instructorId,
          students: Array.isArray(slot.students) ? slot.students : [],
          cupos: slot.cupos || 30,
          clientTempId: (slot as unknown as Record<string, unknown>).clientTempId,
        };
        
        console.log('[API CALL] Creating SINGLE ticket class with payload:', payload);
        
        const res = await fetch('/api/ticket/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        console.log('[API CALL] Single ticket class API response:', {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[API CALL] Failed to create single ticket class:', errorText);
          throw new Error(`Failed to create ticket class: ${errorText}`);
        }
        
        const created = await res.json();
        console.log('[API CALL] Single ticket class created successfully:', created);
        
        const createdTicketClass = {
          ...slot,
          ticketClassId: created._id,
          clientTempId: (slot as unknown as Record<string, unknown>).clientTempId
        };
        
        console.log('[API CALL] Adding to createdTicketClasses:', {
          originalSlot: {
            clientTempId: (slot as unknown as Record<string, unknown>).clientTempId,
            classType: slot.classType,
            date: slot.date,
            start: slot.start
          },
          createdTicketClass: {
            ticketClassId: created._id,
            clientTempId: createdTicketClass.clientTempId
          }
        });
        
        createdTicketClasses.push(createdTicketClass);
      } else if (deduplicatedToCreate.length > 1) {
        const batchPayload = deduplicatedToCreate.map((slot: Slot) => ({
          locationId: slot.locationId,
          date: slot.date,
          hour: slot.start,
          endHour: slot.end,
          classId: slot.classId,
          type: mapClassTypeForBackend(slot.classType),
          duration: slot.duration || "4h",
          instructorId,
          students: Array.isArray(slot.students) ? slot.students : [],
          cupos: slot.cupos || 30,
          clientTempId: (slot as unknown as Record<string, unknown>).clientTempId,
        }));
        
        console.log('[API CALL] Creating BATCH ticket classes with payload:', batchPayload);
        
        const res = await fetch('/api/ticket/classes/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchPayload)
        });
        
        console.log('[API CALL] Batch ticket classes API response:', {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[API CALL] Failed to create batch ticket classes:', errorText);
          throw new Error(`Failed to create ticket classes: ${errorText}`);
        }
        
        const created = await res.json();
        console.log('[API CALL] Batch ticket classes created successfully:', created);
        
        for (let i = 0; i < created.length; i++) {
          const createdTicketClass = {
            ...deduplicatedToCreate[i],
            ticketClassId: created[i]._id,
            clientTempId: (deduplicatedToCreate[i] as unknown as Record<string, unknown>).clientTempId
          };
          
          console.log('[API CALL] Adding to createdTicketClasses:', {
            originalSlot: {
              clientTempId: (deduplicatedToCreate[i] as unknown as Record<string, unknown>).clientTempId,
              classType: deduplicatedToCreate[i].classType,
              date: deduplicatedToCreate[i].date,
              start: deduplicatedToCreate[i].start
            },
            createdTicketClass: {
              ticketClassId: created[i]._id,
              clientTempId: createdTicketClass.clientTempId
            }
          });
          
          createdTicketClasses.push(createdTicketClass);
        }
      } else {
        console.log('[API CALL] NO ticket classes to create - deduplicatedToCreate.length is 0');
      }
      
      console.log('[FINAL SCHEDULE] Building final schedule with created ticket classes (DELETE+CREATE approach):', {
        createdTicketClasses: createdTicketClasses.map(tc => ({
          clientTempId: (tc as any).clientTempId,
          ticketClassId: (tc as any).ticketClassId,
          date: (tc as any).date,
          start: (tc as any).start
        })),
        allSlotsForCreation: allSlotsToCreate.map(slot => ({
          clientTempId: (slot as any).clientTempId,
          ticketClassId: slot.ticketClassId,
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        }))
      });

      // IMPORTANT: With DELETE+CREATE approach, updates are not in finalSchedule separately
      console.log('[FINAL SCHEDULE] Slots being included in final schedule:', {
        toKeepCount: changes.toKeep.length,
        toKeepSlots: changes.toKeep.map(slot => ({
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId
        })),
        allSlotsForCreationCount: allSlotsToCreate.length,
        allSlotsForCreation: allSlotsToCreate.map(slot => ({
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId,
          source: changes.toCreate.includes(slot) ? 'direct_create' : 'update_create'
        }))
      });

      console.log('[FINAL SCHEDULE] Slots being EXCLUDED from final schedule (DELETE+CREATE approach):', {
        totalExcluded: allSlotsToDelete.length,
        directDeletions: changes.toDelete.length,
        updateDeletions: changes.toUpdate.length,
        excludedSlots: allSlotsToDelete.map(slot => ({
          classType: slot.classType,
          date: slot.date,
          start: slot.start,
          slotId: slot.slotId,
          ticketClassId: slot.ticketClassId,
          reason: changes.toDelete.includes(slot) ? 'Direct deletion' : 'Update deletion (old version)'
        }))
      });

      // CRITICAL FIX: Para el enfoque aditivo (solo agregando driving tests), usar lógica diferente
      let finalSchedule: Slot[];
      
      if (isOnlyAddingDrivingTests) {
        console.log('[FINAL SCHEDULE] 🎯 USING ADDITIVE APPROACH - preserving all original slots');
        
        // Enfoque aditivo: mantener TODOS los originales + agregar solo nuevas driving tests
        finalSchedule = [
          ...changes.toKeep,    // TODAS las clases originales (incluyendo driving tests existentes)
          ...changes.toCreate   // Solo las nuevas driving tests
        ];
        
        console.log('[FINAL SCHEDULE] Additive final schedule composition:', {
          totalSlots: finalSchedule.length,
          originalKept: changes.toKeep.length,
          newAdded: changes.toCreate.length,
          breakdown: {
            originalDrivingTests: changes.toKeep.filter(s => (s.classType || "").toLowerCase() === "driving test").length,
            originalTicketClasses: changes.toKeep.filter(s => ["D.A.T.E", "B.D.I", "A.D.I"].includes(s.classType || "")).length,
            newDrivingTests: changes.toCreate.filter(s => (s.classType || "").toLowerCase() === "driving test").length
          }
        });
        
      } else {
        console.log('[FINAL SCHEDULE] Using standard DELETE+CREATE approach');
        
        // Enfoque estándar: toKeep + allSlotsToCreate (con procesamiento de ticket classes)
        finalSchedule = [
          ...changes.toKeep,
          ...allSlotsToCreate
        ];
      }
      
      // Aplicar transformaciones solo cuando sea necesario
      finalSchedule = finalSchedule.map(slot => {
        if (ticketClassTypes.includes((slot.classType || "").toUpperCase())) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = createdTicketClasses.find(s => (s as any).clientTempId && (slot as any).clientTempId && (s as any).clientTempId === (slot as any).clientTempId);
          if (found) {
            console.log('[FINAL SCHEDULE] MATCHING ticket class to slot:', {
              slotClientTempId: (slot as any).clientTempId,
              foundTicketClassId: (found as any).ticketClassId,
              slotDate: slot.date,
              slotStart: slot.start
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { clientTempId: _, ...rest } = slot as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...rest, ticketClassId: (found as any).ticketClassId } as Slot;
          } else {
            console.warn('[FINAL SCHEDULE] NO MATCH found for ticket class slot:', {
              slotClientTempId: (slot as any).clientTempId,
              slotClassType: slot.classType,
              slotDate: slot.date,
              slotStart: slot.start,
              availableCreatedTicketClasses: createdTicketClasses.length
            });
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((slot.classType || "").toLowerCase() === "driving test" && (slot as any).ticketClassId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { ticketClassId: _, clientTempId: __, ...rest } = slot as any;
          return rest as Slot;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((slot as any).clientTempId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { clientTempId: _, ...rest } = slot as any;
          return rest as Slot;
        }
        return slot;
      });

      const cleanSchedule = finalSchedule.map(slot => {
        const cleaned = { ...slot };
        
        // LIMPIEZA PARA DRIVING TESTS: NO deben tener ticketClassId ni duration
        if ((cleaned.classType || "").toLowerCase() === "driving test") {
          console.log('[CLEAN] Cleaning driving test slot:', {
            date: cleaned.date,
            start: cleaned.start,
            originalTicketClassId: (cleaned as any).ticketClassId,
            originalDuration: (cleaned as any).duration
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (cleaned as any).ticketClassId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (cleaned as any).duration;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (cleaned as any).cupos;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (cleaned as any).students;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (cleaned as any).ticketClassId === 'string' && ((cleaned as any).ticketClassId as string).startsWith('temp-')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      
      console.log('\n✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅');
      console.log('[EXECUTION] 🎉 SUCCESS! ALL OPERATIONS COMPLETED');
      console.log('✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅');
      console.log('[EXECUTION] Final summary:');
      console.log(`[EXECUTION] ✅ Deleted ${allSlotsToDelete.length} slots`);
      console.log(`[EXECUTION] ✅ Created ${deduplicatedToCreate.length} new ticket classes`);
      console.log(`[EXECUTION] ✅ Updated instructor schedule with ${cleanSchedule.length} total slots`);
      
      // Mostrar resumen de cambios aplicados basados en visual feedback
      if (pendingChanges.all.length > 0) {
        console.log(`[EXECUTION] 📋 Changes applied from visual feedback system:`);
        console.log(`[EXECUTION]   - ${pendingChanges.creates.length} creations`);
        console.log(`[EXECUTION]   - ${pendingChanges.updates.length} updates`);
        console.log(`[EXECUTION]   - ${pendingChanges.deletes.length} deletions`);
      }
      
      console.log('✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅\n');

      // Limpiar cambios pendientes del sistema de retroalimentación visual
      visualFeedback.clearPendingChanges();
      
      // Limpiar datos temporales del caché
      ticketCache.clearTemporaryTicketClasses();
      
      // Limpiar draft del localStorage
      clearScheduleDraft();

      state.setLoading(false);
      state.setSavingChanges(false);
      
      // Mensaje de éxito más específico basado en los cambios aplicados
      let successMessage = 'All changes saved!';
      if (pendingChanges.all.length > 0) {
        const parts = [];
        if (pendingChanges.creates.length > 0) parts.push(`${pendingChanges.creates.length} created`);
        if (pendingChanges.updates.length > 0) parts.push(`${pendingChanges.updates.length} updated`);
        if (pendingChanges.deletes.length > 0) parts.push(`${pendingChanges.deletes.length} deleted`);
        
        if (parts.length > 0) {
          successMessage = `Successfully saved: ${parts.join(', ')}!`;
        }
      }
      
      toast.success(successMessage, { id: 'saving-calendar' });
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
    // Funciones del sistema de retroalimentación visual
    visualFeedback: {
      getPendingChangesCount: visualFeedback.getPendingChangesCount,
      getPendingChangesSummary: visualFeedback.getPendingChangesSummary,
      getAllPendingChanges: visualFeedback.getAllPendingChanges,
      getPendingChangesDetails: visualFeedback.getPendingChangesDetails,
      getChangesByActionType: visualFeedback.getChangesByActionType,
      syncEnrichedDataWithSchedule: visualFeedback.syncEnrichedDataWithSchedule,
    },
  };
}

