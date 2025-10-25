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
    attendanceReason,
    hourt, // Add hourt to destructuring
    court, // Extract court directly
    county, // Extract county directly
    // Add any other dynamic fields
    ...otherFields
  } = user;

  console.log('🔍 getVariables - Raw user data:', { courseTime, attendanceReason, duration, hourt, court, county, otherFields });

  const studentName = `${(first_name || '').toUpperCase()} ${(midl || '').toUpperCase()} ${(last_name || '').toUpperCase()}`.trim();
  const formattedBirthDate = birthDate ? new Date(birthDate).toLocaleDateString('en-US') : "";
  const formattedCourseDate = courseDate
    ? new Date(courseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

  // Parse course time for checkbox variables (4hr, 6hr, 8hr)
  const courseTimeStr = (courseTime || duration || hourt || '').toLowerCase();
  const courseTime4hr = courseTimeStr.includes('4') ? 'true' : 'false';
  const courseTime6hr = courseTimeStr.includes('6') ? 'true' : 'false';
  const courseTime8hr = courseTimeStr.includes('8') ? 'true' : 'false';

  // Parse attendance reason for checkbox variables
  const attendanceStr = (attendanceReason || '').toLowerCase();
  const attendanceCourtOrder = attendanceStr.includes('court') ? 'true' : 'false';
  const attendanceVolunteer = attendanceStr.includes('volunteer') ? 'true' : 'false';
  const attendanceTicket = attendanceStr.includes('ticket') || attendanceStr.includes('citation') ? 'true' : 'false';

  const variables = {
    studentName,
    firstName: (first_name || '').toUpperCase(),
    lastName: (last_name || '').toUpperCase(),
    middleName: (midl || '').toUpperCase(),
    middleInitial: (midl || '').toUpperCase().charAt(0),
    certn: String(certn || ''),
    birthDate: formattedBirthDate,
    courseDate: formattedCourseDate,
    completionDate: formattedCourseDate,
    printDate,
    classTitle: classTitle || '',
    courseTitle: classTitle || '',
    classType: (classType || '').toUpperCase(),
    licenseNumber: licenseNumber || '',
    citationNumber: citation_number || '',
    address: address || '',
    courseAddress: courseAddress || '',
    courseTime: courseTime || duration || '',
    attendanceReason: attendanceReason || '',
    hourt: hourt || '', // Add hourt variable
    instructorName: instructorName || '',
    instructorSignature: instructorName || '',
    instructorSchoolName: 'Affordable Driving & Traffic School',
    providerName: 'Affordable Driving & Traffic School',
    providerPhone: '(561) 969-0150',
    court: String(court || ''),
    county: String(county || ''),
    // Checkbox variables for Youthful Offender template
    courseTime4hr,
    courseTime6hr,
    courseTime8hr,
    attendanceCourtOrder,
    attendanceVolunteer,
    attendanceTicket,
    // Add all other dynamic fields, converting to strings
    ...Object.fromEntries(
      Object.entries(otherFields).map(([key, value]) => [key, String(value || '')])
    ),
  };

  console.log('🔍 getVariables - Final variables:', variables);
  return variables;
};
