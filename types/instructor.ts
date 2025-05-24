export interface InstructorData {
  _id?: string;
  username: string;
  name: string;
  dni: string;
  email: string;
  password?: string;
  photo: string;
  certifications?: string;
  experience?: string;
  schedule?: {
    date: string;
    start: string;
    end: string;
    booked?: boolean;
    studentId?: string | null;
    status?: "free" | "cancelled" | "scheduled";
  }[];
}