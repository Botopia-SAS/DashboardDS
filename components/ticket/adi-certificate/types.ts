export interface AdiCertificateData {
  certificateNumber: string;
  courseDate: string;
  courseTime: string;
  courseAddress: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
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
