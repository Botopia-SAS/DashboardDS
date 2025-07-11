// types.ts
// Tipos TypeScript centralizados para los componentes de instructores.

export interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    recurrence: string;
    booked: boolean;
    studentId?: string | null;
  };
}

export interface Slot {
  date: string;
  start: string;
  end: string;
  booked?: boolean;
  recurrence?: string;
  slotId?: string;
  studentId?: string | string[] | null;
  selectedStudent?: string;
  status?: "available" | "cancelled" | "scheduled" | "full";
  classType?: "D.A.T.E" | "B.D.I" | "A.D.I" | "driving test";
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
  classId?: string;
  duration?: string;
  ticketClassId?: string;
  locationId?: string;
  cupos?: number;
  students?: string[];
  isTemporary?: boolean;
  // Campos para tracking de recurrencia independiente
  createdAsRecurrence?: boolean;
  originalRecurrenceGroup?: string;
  clientTempId?: string;
  // Campos para eliminación de recurrencia
  deletedFromRecurrence?: boolean;
  originalRecurrenceData?: {
    createdAsRecurrence?: boolean;
    originalRecurrenceGroup?: string;
  };
}

export interface User {
  _id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Add locationIds to InstructorData type for location assignment logic
export interface InstructorData {
  _id?: string;
  name?: string;
  dni?: string;
  username?: string;
  email?: string;
  password?: string;
  photo?: string;
  certifications?: string;
  experience?: string;
  schedule?: Slot[];
  locationIds?: string[];
}

export type SlotType = "" | "available" | "cancelled" | "booked" | "full";