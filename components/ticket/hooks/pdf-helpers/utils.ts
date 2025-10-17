import { Student } from "../../columns";

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const getVariables = (user: Student): Record<string, string> => {
  const {
    first_name,
    last_name,
    midl,
    birthDate,
    certn,
    courseDate,
    classTitle,
    classType,
    licenseNumber,
    citation_number,
    address,
    courseAddress,
    courseTime,
    duration,
    instructorName,
  } = user;

  const studentName = `${(first_name || '').toUpperCase()} ${(midl || '').toUpperCase()} ${(last_name || '').toUpperCase()}`.trim();
  const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('en-US') : "";
  const formattedCourseDate = courseDate
    ? new Date(courseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

  return {
    studentName,
    firstName: (first_name || '').toUpperCase(),
    lastName: (last_name || '').toUpperCase(),
    middleName: (midl || '').toUpperCase(),
    certn: String(certn || ''),
    birthDate: formattedBirthDate,
    courseDate: formattedCourseDate,
    printDate,
    classTitle: classTitle || '',
    classType: (classType || '').toUpperCase(),
    licenseNumber: licenseNumber || '',
    citationNumber: citation_number || '',
    address: address || '',
    courseAddress: courseAddress || '',
    courseTime: duration || courseTime || '',
    instructorName: instructorName || '',
  };
};
