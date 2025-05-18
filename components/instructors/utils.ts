// utils.ts
// Funciones utilitarias para manejo de instructores y sus horarios.
import { Slot, User } from "./types";
import { addDays, addWeeks, addMonths, format } from "date-fns";

/**
 * Normaliza el formato del schedule recibido desde el backend o formularios.
 * Permite aceptar tanto un array plano de slots como un array agrupado por días.
 */
export function normalizeSchedule(data: unknown): Slot[] {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && (data[0] as Slot).start && (data[0] as Slot).end) return data as Slot[];
  return (data as { date: string; slots: Slot[] }[]).flatMap((day) =>
    Array.isArray(day.slots) && day.slots.length > 0
      ? day.slots.map((slot) => ({
          ...slot,
          date: day.date
        }))
      : []
  );
}

/**
 * Divide un rango horario en slots de media hora.
 */
export function splitIntoHalfHourSlots(startStr: string, endStr: string, baseSlot: Partial<Slot>): Slot[] {
  const slots: Slot[] = [];
  let start = new Date(startStr);
  const end = new Date(endStr);
  const date = startStr.split('T')[0];

  while (start < end) {
    let slotEnd = new Date(start.getTime() + 30 * 60000);
    if (slotEnd > end) slotEnd = end;
    slots.push({
      date,
      start: start.toTimeString().slice(0, 5),
      end: slotEnd.toTimeString().slice(0, 5),
      booked: false,
      studentId: null,
      ...Object.fromEntries(Object.entries(baseSlot).filter(([key]) => key !== 'status')),
      status: (baseSlot.status as "free" | "cancelled" | "scheduled") ?? "free",
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