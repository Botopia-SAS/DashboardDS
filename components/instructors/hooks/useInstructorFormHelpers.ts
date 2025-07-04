import { Slot, SlotType } from "../types";

export function getSlotStatus(slotType: SlotType, isTicketClass: boolean = false): "available" | "cancelled" | "scheduled" | "full" {
  if (isTicketClass) {
    if (slotType === "full") return "full";
    if (slotType === "cancelled") return "cancelled";
    return "available";
  } else {
    if (slotType === "booked") return "scheduled";
    if (slotType === "full") return "full";
    if (slotType === "cancelled") return "cancelled";
    return "available";
  }
}

export function generateRecurringDates(startDate: string, recurrence: string, endDate: string | null): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  dates.push(startDate);
  if (recurrence === "None" || !end) {
    return dates;
  }
  const current = new Date(start);
  while (current <= end) {
    if (recurrence === "Daily") {
      current.setDate(current.getDate() + 1);
    } else if (recurrence === "Weekly") {
      current.setDate(current.getDate() + 7);
    } else if (recurrence === "Monthly") {
      current.setMonth(current.getMonth() + 1);
    }
    if (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
    }
  }
  return dates;
}

export function normalizeSlotForComparison(slot: Slot): Slot {
  const normalized = { ...slot };
  const safeString = (value: any): string => {
    if (value === null || value === undefined || value === "null" || value === "undefined") {
      return "";
    }
    return String(value).trim();
  };
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === "null" || value === "undefined" || value === "") {
      return 0;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };
  const safeArray = (value: any): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item._id || item.id || String(item);
      }
      return String(item);
    }).filter(item => item !== "").sort();
  };
  if (normalized.locationId && typeof normalized.locationId === 'object' && 'locationId' in normalized.locationId) {
    normalized.locationId = (normalized.locationId as any)._id;
  }
  normalized.locationId = safeString(normalized.locationId);
  if (normalized.classId && typeof normalized.classId === 'object' && '_id' in normalized.classId) {
    normalized.classId = (normalized.classId as any)._id;
  }
  normalized.classId = safeString(normalized.classId);
  if (normalized.date) {
    try {
      const dateStr = normalized.date.split('T')[0];
      const dateObj = new Date(dateStr + 'T00:00:00.000Z');
      if (!isNaN(dateObj.getTime())) {
        normalized.date = dateObj.toISOString().split('T')[0];
      } else {
        normalized.date = safeString(normalized.date).split('T')[0];
      }
    } catch (e) {
      normalized.date = safeString(normalized.date).split('T')[0];
    }
  } else {
    normalized.date = "";
  }
  if (normalized.start) {
    const timePart = normalized.start.includes('T') ? normalized.start.split('T')[1] : normalized.start;
    const timeOnly = timePart.substring(0, 5);
    const [hours, minutes] = timeOnly.split(':');
    normalized.start = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } else {
    normalized.start = "";
  }
  if (normalized.end) {
    const timePart = normalized.end.includes('T') ? normalized.end.split('T')[1] : normalized.end;
    const timeOnly = timePart.substring(0, 5);
    const [hours, minutes] = timeOnly.split(':');
    normalized.end = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } else {
    normalized.end = "";
  }
  if (normalized.duration) {
    if (typeof normalized.duration === 'number') {
      normalized.duration = `${normalized.duration}h`;
    } else if (typeof normalized.duration === 'string') {
      const durationStr = normalized.duration.toLowerCase().trim();
      const match = durationStr.match(/(\d+)/);
      if (match) {
        normalized.duration = `${match[1]}h`;
      } else {
        normalized.duration = "1h";
      }
    } else {
      normalized.duration = "1h";
    }
  } else {
    normalized.duration = "1h";
  }
  normalized.students = safeArray(normalized.students);
  normalized.cupos = safeNumber(normalized.cupos) || 30;
  const originalClassType = normalized.classType;
  if (originalClassType && ["D.A.T.E", "B.D.I", "A.D.I", "driving test"].includes(originalClassType)) {
    normalized.classType = originalClassType;
  } else {
    normalized.classType = undefined;
  }
  return normalized;
} 