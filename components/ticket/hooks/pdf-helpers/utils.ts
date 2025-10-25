import { Student } from "../../columns";

// Convert hex color to RGB object
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

// Get variables from student data for template replacement
export function getVariables(user: Student): Record<string, string> {
  return {
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    middleName: user.midl || '',
    birthDate: user.birthDate || '',
    licenseNumber: user.licenseNumber || '',
    courseDate: user.courseDate || '',
    classType: user.classType || '',
    certn: String(user.certn || ''),
    address: user.address || '',
    courseTime: user.courseTime || user.duration || '',
    classTitle: user.classTitle || '',
    citationNumber: user.citation_number || '',
    court: user.court || '',
    county: user.county || '',
    attendanceReason: user.attendanceReason || '',
  };
}
