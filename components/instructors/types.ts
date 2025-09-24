// types.ts
// Tipos TypeScript centralizados para los componentes de instructores.

export interface User {
  _id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// InstructorData type simplified for basic instructor information
export interface InstructorData {
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  photo?: string;
  certifications?: string;
  experience?: string;
  canTeachTicketClass?: boolean;
  canTeachDrivingTest?: boolean;
  canTeachDrivingLesson?: boolean;
}