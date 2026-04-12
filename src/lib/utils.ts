import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convierte minutos a horas con un decimal (solo presentación)
 */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Formatea minutos como "Xh Ym"
 */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formatea segundos como HH:MM:SS
 */
export function formatElapsed(seconds: number): { hours: string; minutes: string; secs: string } {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return {
    hours:   String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    secs:    String(s).padStart(2, "0"),
  };
}
