/**
 * Helper functions for TicketCalendar
 */

export interface TicketClassResponse {
  _id: string;
  date: string;
  hour: string;
  endHour?: string;
  type: string;
  status: string;
  instructorId: string | { _id: string; name: string };
  students: string[];
  spots: number;
  classId?: string | { _id: string; title: string };
  duration?: string;
  locationId?: string | { _id: string; title: string };
  studentRequests?: string[];
}

export interface TicketCalendarEvent {
  id?: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps?: {
    classType?: string;
    student?: string;
    status?: string;
    ticketClass?: TicketClassResponse;
    studentCount?: number;
    totalSpots?: number;
  };
}

/**
 * Normalize class type name for URLs (spaces to hyphens)
 */
export const normalizeClassType = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

/**
 * Get status display name
 */
export const getStatusDisplay = (status: string): string => {
  if (status === "full") return "Full";
  if (status === "cancel") return "Cancelled";
  if (status === "expired") return "Expired";
  return "Available";
};

/**
 * Get status colors
 */
export const getStatusColors = (status: string): { bg: string; border: string } => {
  switch (status) {
    case "Full":
      return { bg: "#7c3aed", border: "#6d28d9" };
    case "Cancelled":
      return { bg: "#ef4444", border: "#dc2626" };
    case "Available":
      return { bg: "#10b981", border: "#059669" };
    default:
      return { bg: "#6b7280", border: "#4b5563" };
  }
};

/**
 * Calculate end hour based on start hour and duration
 */
export const calculateEndHour = (hour: string, endHour: string | undefined, duration?: string): string => {
  if (endHour && endHour.trim() !== "" && endHour !== "00:00") {
    return endHour;
  }

  const [startHour, startMinute] = hour.split(':').map(num => parseInt(num, 10));
  let durationHours = 2;

  if (duration) {
    const durationMatch = duration.match(/(\d+(?:\.\d+)?)/);
    if (durationMatch) {
      durationHours = parseFloat(durationMatch[1]);
    }
  }

  const endHourNumber = Math.min(startHour + durationHours, 23);
  const endMinuteNumber = startMinute;

  return `${endHourNumber.toString().padStart(2, '0')}:${endMinuteNumber.toString().padStart(2, '0')}`;
};

/**
 * Get instructor name from instructor data
 */
export const getInstructorName = (
  instructorId: string | { _id: string; name: string } | undefined,
  instructors: { _id: string; name: string }[]
): string => {
  if (!instructorId) return "Sin Asignar";

  if (typeof instructorId === 'object' && instructorId.name) {
    return instructorId.name;
  }

  if (typeof instructorId === 'string') {
    const instructor = instructors.find(inst => inst._id === instructorId);
    return instructor?.name || "Unknown";
  }

  return "Sin Asignar";
};
