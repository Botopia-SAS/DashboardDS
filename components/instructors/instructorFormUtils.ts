import { Slot } from "./types";

export type ClassType = NonNullable<Slot["classType"]>;
export const validClassTypes: ClassType[] = ["driving test", "D.A.T.E", "B.D.I", "A.D.I"];

export function toValidClassType(val: any): ClassType | undefined {
  if (typeof val !== "string") return undefined;
  if ((validClassTypes as string[]).includes(val)) return val as ClassType;
  if (val === "date") return "D.A.T.E";
  if (val === "bdi") return "B.D.I";
  if (val === "adi") return "A.D.I";
  return undefined;
}

export function mapClassTypeForBackend(type: string | undefined) {
  if (type === 'D.A.T.E') return 'date';
  if (type === 'B.D.I') return 'bdi';
  if (type === 'A.D.I') return 'adi';
  if (type === 'driving test') return 'driving test';
  return type;
}

export function normalizeDuration(duration: string | undefined): "2h" | "4h" | "8h" | "12h" | undefined {
  if (!duration) return undefined;
  if (duration.includes("2")) return "2h";
  if (duration.includes("4")) return "4h";
  if (duration.includes("8")) return "8h";
  if (duration.includes("12")) return "12h";
  return undefined;
}
