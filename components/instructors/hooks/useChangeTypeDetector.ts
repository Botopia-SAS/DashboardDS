import { Slot } from "../types";

export type ChangeActionType = 
  | 'delete_ticket_and_slot_create_new'        // Ticket class modification (ADI, BDI, DATE)
  | 'delete_slot_create_ticket_and_slot'       // Driving Test → Ticket Class  
  | 'delete_ticket_and_slot_create_slot'       // Ticket Class → Driving Test
  | 'simple_slot_update'                       // Simple slot changes (time, etc.)
  | 'simple_slot_create'                       // New slot creation
  | 'simple_slot_delete';                      // Simple slot deletion

export type ChangeAnalysis = {
  actionType: ChangeActionType;
  description: string;
  requiresTicketClassDeletion: boolean;
  requiresTicketClassCreation: boolean;
  requiresSlotDeletion: boolean;
  requiresSlotCreation: boolean;
  isRecurrenceBreak: boolean;
  details: {
    originalType?: string;
    newType?: string;
    isTicketClassOriginal?: boolean;
    isTicketClassNew?: boolean;
    isDrivingTestOriginal?: boolean;
    isDrivingTestNew?: boolean;
    wasPartOfRecurrence?: boolean;
    recurrenceGroup?: string;
  };
};

export function useChangeTypeDetector() {
  
  // Determinar si un slot es una ticket class
  const isTicketClass = (slot: Slot | undefined): boolean => {
    if (!slot) return false;
    const ticketTypes = ["A.D.I", "B.D.I", "D.A.T.E", "ADI", "BDI", "DATE", "adi", "bdi", "date"];
    return ticketTypes.includes((slot.classType || "").toUpperCase());
  };

  // Determinar si un slot es un driving test
  const isDrivingTest = (slot: Slot | undefined): boolean => {
    if (!slot) return false;
    return (slot.classType || "").toLowerCase() === "driving test";
  };

  // Detectar si necesita romper recurrencia
  const needsRecurrenceBreak = (originalSlot: Slot | undefined): boolean => {
    return !!(originalSlot?.createdAsRecurrence || originalSlot?.originalRecurrenceGroup);
  };

  // Analizar tipo de cambio para CREATE
  const analyzeCreateChange = (newSlot: Slot): ChangeAnalysis => {
    const isNewTicketClass = isTicketClass(newSlot);
    const isNewDrivingTest = isDrivingTest(newSlot);

    return {
      actionType: 'simple_slot_create',
      description: isNewTicketClass 
        ? `Create ${newSlot.classType} ticket class on ${newSlot.date} at ${newSlot.start}`
        : `Create ${newSlot.classType || 'slot'} on ${newSlot.date} at ${newSlot.start}`,
      requiresTicketClassDeletion: false,
      requiresTicketClassCreation: isNewTicketClass,
      requiresSlotDeletion: false,
      requiresSlotCreation: true,
      isRecurrenceBreak: false,
      details: {
        newType: newSlot.classType,
        isTicketClassNew: isNewTicketClass,
        isDrivingTestNew: isNewDrivingTest,
      }
    };
  };

  // Analizar tipo de cambio para UPDATE
  const analyzeUpdateChange = (originalSlot: Slot, newSlot: Slot): ChangeAnalysis => {
    const isOriginalTicketClass = isTicketClass(originalSlot);
    const isNewTicketClass = isTicketClass(newSlot);
    const isOriginalDrivingTest = isDrivingTest(originalSlot);
    const isNewDrivingTest = isDrivingTest(newSlot);
    const isRecurrenceBreak = needsRecurrenceBreak(originalSlot);

    // Caso 1: Ticket Class → Ticket Class (modificación de ticket class)
    if (isOriginalTicketClass && isNewTicketClass) {
      return {
        actionType: 'delete_ticket_and_slot_create_new',
        description: `Modify ${originalSlot.classType} to ${newSlot.classType} class on ${newSlot.date} at ${newSlot.start}${isRecurrenceBreak ? ' (breaking recurrence)' : ''}`,
        requiresTicketClassDeletion: true,
        requiresTicketClassCreation: true,
        requiresSlotDeletion: true,
        requiresSlotCreation: true,
        isRecurrenceBreak,
        details: {
          originalType: originalSlot.classType,
          newType: newSlot.classType,
          isTicketClassOriginal: true,
          isTicketClassNew: true,
          isDrivingTestOriginal: false,
          isDrivingTestNew: false,
        }
      };
    }

    // Caso 2: Driving Test → Ticket Class
    if (isOriginalDrivingTest && isNewTicketClass) {
      return {
        actionType: 'delete_slot_create_ticket_and_slot',
        description: `Convert driving test to ${newSlot.classType} class on ${newSlot.date} at ${newSlot.start}${isRecurrenceBreak ? ' (breaking recurrence)' : ''}`,
        requiresTicketClassDeletion: false,
        requiresTicketClassCreation: true,
        requiresSlotDeletion: true,
        requiresSlotCreation: true,
        isRecurrenceBreak,
        details: {
          originalType: originalSlot.classType,
          newType: newSlot.classType,
          isTicketClassOriginal: false,
          isTicketClassNew: true,
          isDrivingTestOriginal: true,
          isDrivingTestNew: false,
        }
      };
    }

    // Caso 3: Ticket Class → Driving Test
    if (isOriginalTicketClass && isNewDrivingTest) {
      return {
        actionType: 'delete_ticket_and_slot_create_slot',
        description: `Convert ${originalSlot.classType} class to driving test on ${newSlot.date} at ${newSlot.start}${isRecurrenceBreak ? ' (breaking recurrence)' : ''}`,
        requiresTicketClassDeletion: true,
        requiresTicketClassCreation: false,
        requiresSlotDeletion: true,
        requiresSlotCreation: true,
        isRecurrenceBreak,
        details: {
          originalType: originalSlot.classType,
          newType: newSlot.classType,
          isTicketClassOriginal: true,
          isTicketClassNew: false,
          isDrivingTestOriginal: false,
          isDrivingTestNew: true,
        }
      };
    }

    // Caso 4: Cambios simples (horario, estudiantes, etc.) - mismo tipo
    return {
      actionType: 'simple_slot_update',
      description: `Update ${originalSlot.classType || 'slot'} on ${newSlot.date} at ${newSlot.start}${isRecurrenceBreak ? ' (breaking recurrence)' : ''}`,
      requiresTicketClassDeletion: false,
      requiresTicketClassCreation: false,
      requiresSlotDeletion: false,
      requiresSlotCreation: false,
      isRecurrenceBreak,
      details: {
        originalType: originalSlot.classType,
        newType: newSlot.classType,
        isTicketClassOriginal: isOriginalTicketClass,
        isTicketClassNew: isNewTicketClass,
        isDrivingTestOriginal: isOriginalDrivingTest,
        isDrivingTestNew: isNewDrivingTest,
      }
    };
  };

  // Analizar tipo de cambio para DELETE
  const analyzeDeleteChange = (slotToDelete: Slot): ChangeAnalysis => {
    const isTicketClassToDelete = isTicketClass(slotToDelete);
    const isDrivingTestToDelete = isDrivingTest(slotToDelete);
    const isRecurrenceBreak = needsRecurrenceBreak(slotToDelete);

    return {
      actionType: 'simple_slot_delete',
      description: `Delete ${slotToDelete.classType || 'slot'} on ${slotToDelete.date} at ${slotToDelete.start}${isRecurrenceBreak ? ' (breaking recurrence)' : ''}`,
      requiresTicketClassDeletion: isTicketClassToDelete,
      requiresTicketClassCreation: false,
      requiresSlotDeletion: true,
      requiresSlotCreation: false,
      isRecurrenceBreak,
      details: {
        originalType: slotToDelete.classType,
        isTicketClassOriginal: isTicketClassToDelete,
        isDrivingTestOriginal: isDrivingTestToDelete,
      }
    };
  };

  // Función principal para analizar cualquier tipo de cambio
  const analyzeChange = (
    type: 'create' | 'update' | 'delete',
    newSlot: Slot,
    originalSlot?: Slot
  ): ChangeAnalysis => {
    console.log(`[CHANGE DETECTOR] Analyzing ${type} change:`, {
      type,
      newSlot: {
        classType: newSlot.classType,
        date: newSlot.date,
        start: newSlot.start,
        ticketClassId: newSlot.ticketClassId,
      },
      originalSlot: originalSlot ? {
        classType: originalSlot.classType,
        date: originalSlot.date,
        start: originalSlot.start,
        ticketClassId: originalSlot.ticketClassId,
        createdAsRecurrence: originalSlot.createdAsRecurrence,
        originalRecurrenceGroup: originalSlot.originalRecurrenceGroup,
      } : null
    });

    let analysis: ChangeAnalysis;

    switch (type) {
      case 'create':
        analysis = analyzeCreateChange(newSlot);
        break;
      case 'update':
        if (!originalSlot) {
          throw new Error('Original slot is required for update analysis');
        }
        analysis = analyzeUpdateChange(originalSlot, newSlot);
        break;
      case 'delete':
        analysis = analyzeDeleteChange(newSlot);
        break;
      default:
        throw new Error(`Unknown change type: ${type}`);
    }

    console.log(`[CHANGE DETECTOR] Analysis result:`, {
      actionType: analysis.actionType,
      description: analysis.description,
      requirements: {
        deleteTicketClass: analysis.requiresTicketClassDeletion,
        createTicketClass: analysis.requiresTicketClassCreation,
        deleteSlot: analysis.requiresSlotDeletion,
        createSlot: analysis.requiresSlotCreation,
      },
      isRecurrenceBreak: analysis.isRecurrenceBreak,
      details: analysis.details
    });

    return analysis;
  };

  // Crear slot con recurrencia rota (para ediciones individuales)
  const createSlotWithBrokenRecurrence = (originalSlot: Slot, newSlotData: Partial<Slot>): Slot => {
    return {
      ...originalSlot,
      ...newSlotData,
      // CRITICAL: Romper enlaces de recurrencia para ediciones individuales
      createdAsRecurrence: undefined,
      originalRecurrenceGroup: undefined,
      recurrence: "None", // Reset recurrence for individual edits
    };
  };

  return {
    analyzeChange,
    createSlotWithBrokenRecurrence,
    isTicketClass,
    isDrivingTest,
    needsRecurrenceBreak,
  };
} 