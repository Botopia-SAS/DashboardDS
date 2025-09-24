export interface InstructorData {
  _id?: string;
  username: string;
  name: string;
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
    status?: "available" | "cancelled" | "scheduled";
    classType?: "D.A.T.E" | "B.D.I" | "A.D.I" | "driving test";
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
  }[];
}