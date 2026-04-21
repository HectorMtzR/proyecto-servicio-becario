import type { Role, Status, ScholarshipType } from "@prisma/client";

// Re-export Prisma enums for convenience
export type { Role, Status, ScholarshipType };

// Extended session user type
export interface SessionUser {
  id:                 string;
  name:               string;
  email:              string;
  role:               Role;
  mustChangePassword: boolean;
}

// Server Action response shape
export interface ActionResult<T = undefined> {
  success: boolean;
  error?:  string;
  data?:   T;
}

// Dashboard stats for Alumno
export interface AlumnoStats {
  thisMontHours:    number;
  weeklyAverage:    number;
  remainingHours:   number;
  status:           "En Tiempo" | "Atrasado";
  progressPercent:  number;
  accumulatedHours: number;
  targetHours:      number;
}
