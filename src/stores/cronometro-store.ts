"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CronometroState {
  sessionId:    string | null;
  assignmentId: string | null;
  /** ISO string — fuente de verdad proviene del server. Se cachea aquí para UI tras recarga. */
  startTime:    string | null;
  setActive:    (s: { sessionId: string; assignmentId: string; startTime: string }) => void;
  clear:        () => void;
}

export const useCronometroStore = create<CronometroState>()(
  persist(
    (set) => ({
      sessionId:    null,
      assignmentId: null,
      startTime:    null,
      setActive: ({ sessionId, assignmentId, startTime }) =>
        set({ sessionId, assignmentId, startTime }),
      clear: () => set({ sessionId: null, assignmentId: null, startTime: null }),
    }),
    { name: "anahuac-cronometro" },
  ),
);
