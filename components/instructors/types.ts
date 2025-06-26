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
  studentId?: string | null;
  status?: "available" | "cancelled" | "scheduled";
  classType?: "D.A.T.E" | "B.D.I" | "A.D.I" | "driving test";
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface User {
  _id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

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
}

export type SlotType = "" | "available" | "cancelled" | "booked"; 