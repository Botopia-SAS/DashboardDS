import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un ID único para eventos de calendario
 * @param classType - Tipo de clase (driving_test o driving_lesson)
 * @param instructorId - ID del instructor
 * @param date - Fecha del evento
 * @param start - Hora de inicio
 * @returns ID único generado
 */
export function generateEventId(classType: string, instructorId: string, date: string, start: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${classType}_${instructorId}_${date}_${start}_${timestamp}_${random}`;
}
