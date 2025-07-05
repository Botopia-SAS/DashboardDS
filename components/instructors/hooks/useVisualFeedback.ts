import { useCallback, useEffect, useRef, useState } from "react";
import { Slot } from "../types";
import { mapClassTypeForBackend } from "../instructorFormUtils";
import { useChangeTypeDetector, ChangeAnalysis } from "./useChangeTypeDetector";

type UseVisualFeedbackParams = {
  schedule: Slot[];
  setSchedule: React.Dispatch<React.SetStateAction<Slot[]>>;
  enrichedTicketData: Record<string, any>;
  setEnrichedTicketData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  loadedTicketClassIds: Set<string>;
  setLoadedTicketClassIds: React.Dispatch<React.SetStateAction<Set<string>>>;
};

type DeleteOptions = {
  breakRecurrence?: boolean;
  deleteType?: 'single' | 'all';
  recurrenceKey?: string;
};

type PendingChange = {
  id: string;
  type: 'create' | 'update' | 'delete';
  slot: Slot;
  originalSlot?: Slot; // Para updates, guardar el slot original
  ticketData?: any;
  timestamp: number;
  description: string; // Descripción human-readable del cambio
  analysis: ChangeAnalysis; // Análisis detallado del tipo de cambio
};

export function useVisualFeedback({
  schedule,
  setSchedule,
  enrichedTicketData,
  setEnrichedTicketData,
  loadedTicketClassIds,
  setLoadedTicketClassIds,
}: UseVisualFeedbackParams) {
  // Mantener un registro de cambios pendientes para mejor retroalimentación
  const pendingChanges = useRef<Map<string, PendingChange>>(new Map());
  
  // CRÍTICO: Estado para activar re-renders cuando cambian los pending changes
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  
  // Usar el detector de tipos de cambio
  const changeDetector = useChangeTypeDetector();
  
  // Función helper para actualizar el count de cambios pendientes
  const updatePendingChangesCount = useCallback(() => {
    const count = pendingChanges.current.size;
    setPendingChangesCount(count);
    console.log('[VISUAL FEEDBACK] ✅ Updated pending changes count to:', count);
  }, []);
  
  // Función para sincronizar inmediatamente los datos enriquecidos con cambios del schedule
  const syncEnrichedDataWithSchedule = useCallback(() => {
    const ticketClassSlots = schedule.filter(slot => 
      slot.ticketClassId && 
      ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes((slot.classType || "").toUpperCase())
    );
    
    const updatedEnrichedData = { ...enrichedTicketData };
    let hasChanges = false;
    
    ticketClassSlots.forEach(slot => {
      if (slot.ticketClassId) {
        const currentData = updatedEnrichedData[slot.ticketClassId];
        
        // Crear o actualizar datos enriquecidos basados en el slot actual
        const newData = {
          students: slot.students || currentData?.students || [],
          cupos: slot.cupos || currentData?.cupos || 30,
          classId: slot.classId || currentData?.classId,
          locationId: slot.locationId || currentData?.locationId,
          amount: slot.amount || currentData?.amount,
          duration: slot.duration || currentData?.duration,
          type: mapClassTypeForBackend(slot.classType),
          date: slot.date,
          hour: slot.start,
          endHour: slot.end,
          isTemporary: slot.ticketClassId?.startsWith('temp-') || false,
          // Mantener datos originales si existen
          fullData: currentData?.fullData || null,
        };
        
        // Solo actualizar si hay cambios reales
        if (!currentData || JSON.stringify(currentData) !== JSON.stringify(newData)) {
          updatedEnrichedData[slot.ticketClassId] = newData;
          hasChanges = true;
        }
      }
    });
    
    // Actualizar el estado si hay cambios
    if (hasChanges) {
      setEnrichedTicketData(updatedEnrichedData);
    }
  }, [schedule, enrichedTicketData, setEnrichedTicketData]);
  
  // Función para crear un slot visual inmediato
  const createVisualSlot = useCallback((
    slotData: Partial<Slot> & { date: string; start: string; end: string }
  ): Slot => {
    const isTicketClass = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes(
      (slotData.classType || "").toUpperCase()
    );
    
    const slotId = slotData.slotId || `visual-${Date.now()}-${Math.random()}`;
    let ticketClassId = slotData.ticketClassId;
    
    // Crear ID temporal para ticket classes si no existe
    if (isTicketClass && !ticketClassId) {
      ticketClassId = `temp-${slotData.date}-${slotData.start}-${Date.now()}`;
    }
    
    const newSlot: Slot = {
      slotId,
      date: slotData.date,
      start: slotData.start,
      end: slotData.end,
      classType: slotData.classType,
      status: slotData.status || (isTicketClass ? "available" : "scheduled"),
      booked: slotData.booked || false,
      ticketClassId: isTicketClass ? ticketClassId : undefined,
      isTemporary: isTicketClass ? true : undefined,
      // Datos adicionales
      classId: slotData.classId,
      locationId: slotData.locationId,
      duration: slotData.duration,
      amount: slotData.amount,
      paid: slotData.paid,
      pickupLocation: slotData.pickupLocation,
      dropoffLocation: slotData.dropoffLocation,
      students: slotData.students || [],
      cupos: slotData.cupos || 30,
      studentId: slotData.studentId,
      recurrence: slotData.recurrence || "None",
      createdAsRecurrence: slotData.createdAsRecurrence,
      originalRecurrenceGroup: slotData.originalRecurrenceGroup,
    };
    
    // Analizar el tipo de cambio
    const analysis = changeDetector.analyzeChange('create', newSlot);
    
    pendingChanges.current.set(slotId, {
      id: slotId,
      type: 'create',
      slot: newSlot,
      ticketData: isTicketClass ? {
        students: slotData.students || [],
        cupos: slotData.cupos || 30,
        classId: slotData.classId,
        locationId: slotData.locationId,
        amount: slotData.amount,
        duration: slotData.duration,
        type: mapClassTypeForBackend(slotData.classType),
        date: slotData.date,
        hour: slotData.start,
        endHour: slotData.end,
        isTemporary: true,
      } : undefined,
      timestamp: Date.now(),
      description: analysis.description,
      analysis,
    });
    
    // CRÍTICO: Agregar automáticamente al schedule cuando se crea visual slot
    setSchedule(prevSchedule => {
      // Verificar que no exista ya un slot idéntico para evitar duplicados
      const exists = prevSchedule.some(existingSlot => 
        existingSlot.slotId === newSlot.slotId ||
        (existingSlot.date === newSlot.date && 
         existingSlot.start === newSlot.start && 
         existingSlot.end === newSlot.end &&
         existingSlot.classType === newSlot.classType)
      );
      
      if (exists) {
        console.log('[CREATE VISUAL SLOT] ⚠️ Slot already exists, not adding duplicate');
        return prevSchedule;
      }
      
      console.log('[CREATE VISUAL SLOT] ➕ Adding to schedule:', {
        slotId: newSlot.slotId,
        classType: newSlot.classType,
        date: newSlot.date,
        start: newSlot.start
      });
      
      return [...prevSchedule, newSlot];
    });
    
    // CRÍTICO: Actualizar el count para activar re-renders
    updatePendingChangesCount();
    
    return newSlot;
  }, [updatePendingChangesCount]);
  
  // Función para actualizar un slot visual inmediato
  const updateVisualSlot = useCallback((
    originalSlot: Slot,
    updateData: Partial<Slot>
  ): Slot => {
    const isTicketClass = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes(
      (updateData.classType || originalSlot.classType || "").toUpperCase()
    );
    
    const updatedSlot: Slot = {
      ...originalSlot,
      ...updateData,
      // Mantener IDs importantes
      slotId: originalSlot.slotId,
      ticketClassId: isTicketClass ? (updateData.ticketClassId || originalSlot.ticketClassId) : undefined,
      isTemporary: isTicketClass ? true : undefined,
    };
    
    // Aplicar ruptura de recurrencia si es necesario
    const finalUpdatedSlot = changeDetector.needsRecurrenceBreak(originalSlot) 
      ? changeDetector.createSlotWithBrokenRecurrence(originalSlot, updatedSlot)
      : updatedSlot;

    // Analizar el tipo de cambio
    const analysis = changeDetector.analyzeChange('update', finalUpdatedSlot, originalSlot);
    const changeId = originalSlot.slotId || `update-${Date.now()}`;
      
    pendingChanges.current.set(changeId, {
      id: changeId,
      type: 'update',
      slot: finalUpdatedSlot,
      originalSlot,
      ticketData: isTicketClass ? {
        students: finalUpdatedSlot.students || [],
        cupos: finalUpdatedSlot.cupos || 30,
        classId: finalUpdatedSlot.classId,
        locationId: finalUpdatedSlot.locationId,
        amount: finalUpdatedSlot.amount,
        duration: finalUpdatedSlot.duration,
        type: mapClassTypeForBackend(finalUpdatedSlot.classType),
        date: finalUpdatedSlot.date,
        hour: finalUpdatedSlot.start,
        endHour: finalUpdatedSlot.end,
        isTemporary: true,
      } : undefined,
      timestamp: Date.now(),
      description: analysis.description,
      analysis,
    });

    // CRÍTICO: Actualizar el count para activar re-renders
    updatePendingChangesCount();

         return finalUpdatedSlot;
  }, [updatePendingChangesCount]);
  
  // Función para eliminar un slot visual inmediato
  const deleteVisualSlot = useCallback((slotToDelete: Slot, options: DeleteOptions = {}) => {
    const { 
      breakRecurrence = false,
      deleteType = 'single',
      recurrenceKey 
    } = options;

    console.log('\n🚨 DELETE VISUAL SLOT - STARTING');
    console.log('[DELETE] Slot to delete:', {
      slotId: slotToDelete.slotId,
      ticketClassId: slotToDelete.ticketClassId,
      classType: slotToDelete.classType,
      date: slotToDelete.date,
      start: slotToDelete.start,
      options
    });

    const changeId = `delete-${slotToDelete.slotId || slotToDelete.ticketClassId || `${slotToDelete.date}-${slotToDelete.start}`}`;
    
    // FOR DRIVING TESTS WITH RECURRENCE: Break recurrence if needed
    if (breakRecurrence && slotToDelete.classType?.toLowerCase() === 'driving test') {
      console.log('[DELETE] Breaking recurrence for driving test');
      const updatedSlot = { ...slotToDelete };
      delete updatedSlot.recurrence;
      delete updatedSlot.originalRecurrenceGroup;
      updatedSlot.deletedFromRecurrence = true;
      
      setSchedule(prevSchedule => {
        return prevSchedule.map(slot => {
          if (slot.slotId === slotToDelete.slotId) {
            return updatedSlot;
          }
          return slot;
        });
      });
      
      slotToDelete = updatedSlot;
    }

    // Analizar el tipo de cambio usando el detector
    const analysis = changeDetector.analyzeChange('delete', slotToDelete);

    // Register the deletion in pending changes
    const pendingChange: PendingChange = {
      id: changeId,
      type: 'delete',
      slot: slotToDelete,
      description: analysis.description,
      timestamp: Date.now(),
      analysis,
    };

    pendingChanges.current.set(changeId, pendingChange);
    
    // CRÍTICO: Usar updatePendingChangesCount para consistency
    updatePendingChangesCount();

    console.log('[DELETE] ✅ Pending change registered:', {
      changeId,
      mapSize: pendingChanges.current.size,
      description: analysis.description
    });

    // Remove from current schedule
    setSchedule(prevSchedule => {
      const newSchedule = prevSchedule.filter(slot => {
        if (slot.slotId === slotToDelete.slotId) {
          console.log('[DELETE] 🗑️ Removing slot from schedule:', {
            slotId: slot.slotId,
            date: slot.date,
            start: slot.start,
            classType: slot.classType
          });
          return false;
        }
        return true;
      });
      
      console.log('[DELETE] Schedule updated:', {
        beforeCount: prevSchedule.length,
        afterCount: newSchedule.length
      });
      
      return newSchedule;
    });

    // Remove from enriched data if it's a ticket class
    if (slotToDelete.ticketClassId) {
      setEnrichedTicketData(prevData => {
        const newData = { ...prevData };
        delete newData[slotToDelete.ticketClassId!];
        return newData;
      });
    }

    console.log('🚨 DELETE VISUAL SLOT - COMPLETED\n');
  }, [setSchedule, setEnrichedTicketData, changeDetector, updatePendingChangesCount]);
  
  // Función para obtener el estado actual de cambios pendientes
  const getPendingChangesCount = useCallback(() => {
    const count = pendingChanges.current.size;
    console.log('[GET COUNT] Pending changes count:', count);
    return count;
  }, [pendingChangesCount]); // CRÍTICO: Depender del state para que se actualice
  
  // Función para limpiar cambios pendientes (llamar después de guardar)
  const clearPendingChanges = useCallback(() => {
    pendingChanges.current.clear();
    setPendingChangesCount(0);
    console.log('[CLEAR] All pending changes cleared');
  }, []);
  
  // Función para obtener resumen de cambios pendientes
  const getPendingChangesSummary = useCallback(() => {
    const changes = Array.from(pendingChanges.current.values());
    return {
      total: changes.length,
      creates: changes.filter(c => c.type === 'create').length,
      updates: changes.filter(c => c.type === 'update').length,
      deletes: changes.filter(c => c.type === 'delete').length,
      ticketClasses: changes.filter(c => c.ticketData).length,
      drivingTests: changes.filter(c => !c.ticketData).length,
    };
  }, []);

  // Función para obtener todos los cambios pendientes organizados por tipo
  const getAllPendingChanges = useCallback(() => {
    const changes = Array.from(pendingChanges.current.values());
    return {
      creates: changes.filter(c => c.type === 'create'),
      updates: changes.filter(c => c.type === 'update'),
      deletes: changes.filter(c => c.type === 'delete'),
      all: changes,
    };
  }, []);

  // Función para obtener cambios pendientes con detalles para logging
  const getPendingChangesDetails = useCallback(() => {
    const changes = Array.from(pendingChanges.current.values());
    return changes.map(change => ({
      id: change.id,
      type: change.type,
      description: change.description,
      timestamp: change.timestamp,
      isTicketClass: !!change.ticketData,
      analysis: change.analysis,
      slot: {
        date: change.slot.date,
        start: change.slot.start,
        end: change.slot.end,
        classType: change.slot.classType,
        ticketClassId: change.slot.ticketClassId,
      },
      originalSlot: change.originalSlot ? {
        date: change.originalSlot.date,
        start: change.originalSlot.start,
        end: change.originalSlot.end,
        classType: change.originalSlot.classType,
        ticketClassId: change.originalSlot.ticketClassId,
      } : null,
    }));
  }, []);
  
  // Efecto para sincronizar datos enriquecidos cuando cambia el schedule
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncEnrichedDataWithSchedule();
    }, 50); // Pequeño delay para evitar múltiples sincronizaciones
    
    return () => clearTimeout(timeoutId);
  }, [schedule, syncEnrichedDataWithSchedule]);
  
  // Efecto para actualizar IDs cargados cuando se agregan ticket classes temporales
  useEffect(() => {
    const tempTicketClassIds = schedule
      .filter(slot => slot.ticketClassId?.startsWith('temp-'))
      .map(slot => slot.ticketClassId!)
      .filter(id => !loadedTicketClassIds.has(id));
    
    if (tempTicketClassIds.length > 0) {
      setLoadedTicketClassIds(prev => new Set([...prev, ...tempTicketClassIds]));
    }
  }, [schedule, loadedTicketClassIds, setLoadedTicketClassIds]);
  
  // Función para obtener cambios organizados por tipo de acción específica
  const getChangesByActionType = useCallback(() => {
    const changes = Array.from(pendingChanges.current.values());
    return {
      deleteTicketAndSlotCreateNew: changes.filter(c => c.analysis.actionType === 'delete_ticket_and_slot_create_new'),
      deleteSlotCreateTicketAndSlot: changes.filter(c => c.analysis.actionType === 'delete_slot_create_ticket_and_slot'),
      deleteTicketAndSlotCreateSlot: changes.filter(c => c.analysis.actionType === 'delete_ticket_and_slot_create_slot'),
      simpleSlotUpdate: changes.filter(c => c.analysis.actionType === 'simple_slot_update'),
      simpleSlotCreate: changes.filter(c => c.analysis.actionType === 'simple_slot_create'),
      simpleSlotDelete: changes.filter(c => c.analysis.actionType === 'simple_slot_delete'),
      recurrenceBreaks: changes.filter(c => c.analysis.isRecurrenceBreak),
    };
  }, []);

  // Función para crear múltiples slots visuales de una vez (evita race conditions)
  const createMultipleVisualSlots = useCallback((
    slotsData: Array<Partial<Slot> & { date: string; start: string; end: string }>
  ): Slot[] => {
    console.log('[CREATE MULTIPLE] Creating multiple visual slots:', slotsData.length);
    
    const newSlots: Slot[] = [];
    const newPendingChanges: PendingChange[] = [];
    
    // Preparar todos los slots y pending changes
    slotsData.forEach((slotData, index) => {
      const isTicketClass = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"].includes(
        (slotData.classType || "").toUpperCase()
      );
      
      const slotId = slotData.slotId || `visual-${Date.now()}-${Math.random()}-${index}`;
      let ticketClassId = slotData.ticketClassId;
      
      // Crear ID temporal para ticket classes si no existe
      if (isTicketClass && !ticketClassId) {
        ticketClassId = `temp-${slotData.date}-${slotData.start}-${Date.now()}-${index}`;
      }
      
      const newSlot: Slot = {
        slotId,
        date: slotData.date,
        start: slotData.start,
        end: slotData.end,
        classType: slotData.classType,
        status: slotData.status || (isTicketClass ? "available" : "scheduled"),
        booked: slotData.booked || false,
        ticketClassId: isTicketClass ? ticketClassId : undefined,
        isTemporary: isTicketClass ? true : undefined,
        // Datos adicionales
        classId: slotData.classId,
        locationId: slotData.locationId,
        duration: slotData.duration,
        amount: slotData.amount,
        paid: slotData.paid,
        pickupLocation: slotData.pickupLocation,
        dropoffLocation: slotData.dropoffLocation,
        students: slotData.students || [],
        cupos: slotData.cupos || 30,
        studentId: slotData.studentId,
        recurrence: slotData.recurrence || "None",
        createdAsRecurrence: slotData.createdAsRecurrence,
        originalRecurrenceGroup: slotData.originalRecurrenceGroup,
      };
      
      newSlots.push(newSlot);
      
      // Analizar el tipo de cambio
      const analysis = changeDetector.analyzeChange('create', newSlot);
      
      const pendingChange: PendingChange = {
        id: slotId,
        type: 'create',
        slot: newSlot,
        ticketData: isTicketClass ? {
          students: slotData.students || [],
          cupos: slotData.cupos || 30,
          classId: slotData.classId,
          locationId: slotData.locationId,
          amount: slotData.amount,
          duration: slotData.duration,
          type: mapClassTypeForBackend(slotData.classType),
          date: slotData.date,
          hour: slotData.start,
          endHour: slotData.end,
          isTemporary: true,
        } : undefined,
        timestamp: Date.now(),
        description: analysis.description,
        analysis,
      };
      
      newPendingChanges.push(pendingChange);
    });
    
    // Agregar todos los slots al schedule de una vez
    setSchedule(prevSchedule => {
      console.log('[CREATE MULTIPLE] Before adding to schedule:', {
        existingSlots: prevSchedule.length,
        newSlots: newSlots.length,
        existingTypes: prevSchedule.map(s => `${s.classType}-${s.date}-${s.start}`),
        newTypes: newSlots.map(s => `${s.classType}-${s.date}-${s.start}`)
      });
      
      // Verificar duplicados
      const slotsToAdd = newSlots.filter(newSlot => {
        const exists = prevSchedule.some(existingSlot => 
          existingSlot.slotId === newSlot.slotId ||
          (existingSlot.date === newSlot.date && 
           existingSlot.start === newSlot.start && 
           existingSlot.end === newSlot.end &&
           existingSlot.classType === newSlot.classType)
        );
        
        if (exists) {
          console.log('[CREATE MULTIPLE] ⚠️ Slot already exists, skipping:', {
            date: newSlot.date,
            start: newSlot.start,
            classType: newSlot.classType
          });
        }
        
        return !exists;
      });
      
      console.log('[CREATE MULTIPLE] Adding to schedule:', {
        filtered: slotsToAdd.length,
        total: prevSchedule.length + slotsToAdd.length
      });
      
      return [...prevSchedule, ...slotsToAdd];
    });
    
    // Registrar todos los pending changes de una vez
    newPendingChanges.forEach(pendingChange => {
      pendingChanges.current.set(pendingChange.id, pendingChange);
    });
    
    // Actualizar el count una sola vez
    updatePendingChangesCount();
    
    console.log('[CREATE MULTIPLE] ✅ Successfully created multiple visual slots:', {
      slotsCreated: newSlots.length,
      pendingChangesRegistered: newPendingChanges.length,
      totalPendingChanges: pendingChanges.current.size
    });
    
    return newSlots;
  }, [setSchedule, changeDetector, updatePendingChangesCount]);

  return {
    createVisualSlot,
    updateVisualSlot,
    deleteVisualSlot,
    syncEnrichedDataWithSchedule,
    getPendingChangesCount,
    getPendingChangesSummary,
    getAllPendingChanges,
    getPendingChangesDetails,
    getChangesByActionType,
    clearPendingChanges,
    createMultipleVisualSlots,
  };
} 