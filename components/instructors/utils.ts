// utils.ts
// Funciones utilitarias para manejo de instructores y sus horarios.
import { Slot, User } from "./types";
import { addDays, addWeeks, addMonths, format } from "date-fns";

// Función para convertir horas a formato 24 horas solo si es necesario
export function convertTo24HourFormat(time: string): string {
  if (!time || typeof time !== 'string') return time;
  
  // Si ya está en formato correcto (HH:MM), no hacer nada
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.trim())) {
    const [hours, minutes] = time.trim().split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Limpiar el input: remover timezone, segundos, y espacios extra
  let cleanTime = time.trim();
  
  // Remover timezone si existe (ej: "11:30:00-05:00" -> "11:30:00")
  cleanTime = cleanTime.replace(/[+-]\d{2}:\d{2}$/, '');
  
  // Remover segundos si existen (ej: "11:30:00" -> "11:30")
  cleanTime = cleanTime.replace(/:\d{2}$/, '');
  
  // Si después de limpiar ya está en formato correcto, retornarlo
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(cleanTime)) {
    const [hours, minutes] = cleanTime.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Si tiene AM/PM, convertir a 24 horas
  const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = cleanTime.match(timePattern);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Si no coincide con ningún patrón, intentar parsear como Date
  try {
    const date = new Date(`2000-01-01T${cleanTime}`);
    if (!isNaN(date.getTime())) {
      return date.toTimeString().slice(0, 5);
    }
  } catch (e) {
    // Ignorar errores de parsing
  }
  
  // Como último recurso, retornar tal como está
  return cleanTime;
}

/**
 * Normaliza el formato del schedule recibido desde el backend o formularios.
 * Permite aceptar tanto un array plano de slots como un array agrupado por días.
 */
export function normalizeSchedule(data: unknown): Slot[] {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && (data[0] as Slot).start && (data[0] as Slot).end) {
    // Si el slot tiene _id, lo asignamos a slotId
    return (data as any[]).map(slot => {
      const slotId = (slot as any)._id ? (slot as any)._id.toString() : slot.slotId;
      
      // Solo aplicar conversión si las horas no están en formato correcto
      const needsStartConversion = slot.start && (
        slot.start.includes(':00-') || // tiene timezone
        slot.start.includes(':00:') || // tiene segundos
        /\s*(AM|PM)$/i.test(slot.start) || // tiene AM/PM
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.start.trim()) // no está en formato HH:MM
      );
      
      const needsEndConversion = slot.end && (
        slot.end.includes(':00-') || // tiene timezone
        slot.end.includes(':00:') || // tiene segundos
        /\s*(AM|PM)$/i.test(slot.end) || // tiene AM/PM
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.end.trim()) // no está en formato HH:MM
      );
      
      return { 
        ...slot, 
        slotId,
        start: needsStartConversion ? convertTo24HourFormat(slot.start) : slot.start,
        end: needsEndConversion ? convertTo24HourFormat(slot.end) : slot.end
      };
    });
  }
  return (data as { date: string; slots: Slot[] }[]).flatMap((day) =>
    Array.isArray(day.slots) && day.slots.length > 0
      ? day.slots.map((slot) => {
          const slotId = (slot as any)._id ? (slot as any)._id.toString() : slot.slotId;
          
          // Solo aplicar conversión si las horas no están en formato correcto
          const needsStartConversion = slot.start && (
            slot.start.includes(':00-') || // tiene timezone
            slot.start.includes(':00:') || // tiene segundos
            /\s*(AM|PM)$/i.test(slot.start) || // tiene AM/PM
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.start.trim()) // no está en formato HH:MM
          );
          
          const needsEndConversion = slot.end && (
            slot.end.includes(':00-') || // tiene timezone
            slot.end.includes(':00:') || // tiene segundos
            /\s*(AM|PM)$/i.test(slot.end) || // tiene AM/PM
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.end.trim()) // no está en formato HH:MM
          );
          
          return { 
            ...slot, 
            date: day.date, 
            slotId,
            start: needsStartConversion ? convertTo24HourFormat(slot.start) : slot.start,
            end: needsEndConversion ? convertTo24HourFormat(slot.end) : slot.end
          };
        })
      : []
  );
}

/**
 * Divide un rango horario en slots de 2 horas.
 */
export function splitIntoTwoHourSlots(startStr: string, endStr: string, baseSlot: Partial<Slot>): Slot[] {
  const slots: Slot[] = [];
  let start = new Date(startStr);
  const end = new Date(endStr);
  const date = startStr.split('T')[0];

  while (start < end) {
    let slotEnd = new Date(start.getTime() + 2 * 60 * 60000); // 2 horas
    if (slotEnd > end) slotEnd = end;
    slots.push({
      date,
      start: start.toTimeString().slice(0, 5),
      end: slotEnd.toTimeString().slice(0, 5),
      booked: false,
      studentId: null,
      ...Object.fromEntries(Object.entries(baseSlot).filter(([key]) => key !== 'status')),
      status: (baseSlot.status as "available" | "cancelled" | "scheduled") ?? "available",
    });
    start = slotEnd;
  }
  return slots;
}

/**
 * Normaliza un string de hora quitando la parte de la fecha si existe.
 */
export function normalizeTime(dateString: string): string {
  return dateString.includes("-") ? dateString.split("-")[0] : dateString;
}

/**
 * Devuelve el nombre completo y email del estudiante dado su id.
 */
export function getStudentName(studentId: string, allUsers: User[]): string {
  const user = allUsers.find(u => u._id === studentId);
  return user ? `${user.name || ((user.firstName || "") + " " + (user.lastName || ""))} (${user.email})` : "Scheduled";
}

/**
 * Genera slots recurrentes (Daily, Weekly, Monthly) a partir de un slot base.
 * @param start Fecha y hora de inicio (string ISO)
 * @param end Fecha y hora de fin (string ISO)
 * @param recurrence Tipo de recurrencia
 * @param count Número de repeticiones
 * @param baseSlot Datos base del slot
 */
export function generateRecurringSlots(
  start: string,
  end: string,
  recurrence: "Daily" | "Weekly" | "Monthly",
  count: number,
  baseSlot: Partial<Slot>
): Slot[] {
  const slots: Slot[] = [];
  let currentStart = new Date(start);
  let currentEnd = new Date(end);

  for (let i = 0; i < count; i++) {
    slots.push({
      ...baseSlot,
      date: format(currentStart, "yyyy-MM-dd"),
      start: format(currentStart, "HH:mm"),
      end: format(currentEnd, "HH:mm"),
      status: baseSlot.status ?? "free",
    } as Slot);

    if (recurrence === "Daily") {
      currentStart = addDays(currentStart, 1);
      currentEnd = addDays(currentEnd, 1);
    } else if (recurrence === "Weekly") {
      currentStart = addWeeks(currentStart, 1);
      currentEnd = addWeeks(currentEnd, 1);
    } else if (recurrence === "Monthly") {
      currentStart = addMonths(currentStart, 1);
      currentEnd = addMonths(currentEnd, 1);
    }
  }
  return slots;
}