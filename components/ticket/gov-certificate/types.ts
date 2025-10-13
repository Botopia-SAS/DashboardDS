export interface GovCertificateData {
  certificateNumber: string;
  courseTitle?: string;
  courseTime: "4hr" | "6hr" | "8hr";
  citationCaseNo?: string; // Alias for citationNumber
  citationNumber: string;
  court: string;
  county: string;
  attendanceReason: "court_order" | "volunteer" | "ticket";
  firstName: string;
  middleInitial?: string;
  lastName: string;
  driversLicenseNo?: string; // Alias for licenseNumber
  licenseNumber: string;
  completionDate: string;
  instructorSignature: string;
  instructorSignatureImage?: string; // Base64 image data URL
  instructorsSchoolName?: string; // Alias for instructorSchoolName
  instructorSchoolName: string;
  deliveryModeLabel?: string; // e.g., "In Person Class"
  providerName?: string; // e.g., "Affordable Driving & Traffic School"
  providerPhone?: string; // e.g., "(561) 969-0150"
  brandLeftLogoUrl?: string; // URL to left logo (DRIVER TRAINING)
  brandRightLogoUrl?: string; // URL to right logo (dt)
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
