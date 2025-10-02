export interface GovCertificateData {
  certificateNumber: string;
  courseTime: "4hr" | "6hr" | "8hr";
  citationNumber: string;
  court: string;
  county: string;
  attendanceReason: "court_order" | "volunteer" | "ticket";
  firstName: string;
  middleInitial: string;
  lastName: string;
  licenseNumber: string;
  completionDate: string;
  instructorSignature: string;
  instructorSignatureImage?: string; // Base64 image data URL
  instructorSchoolName: string;
}

export interface User {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  licenseNumber?: string;
  birthDate?: string;
}
