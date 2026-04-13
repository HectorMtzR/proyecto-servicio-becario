"use client";

import { create } from "zustand";

interface UIState {
  registroManualOpen: boolean;
  openRegistroManual:  () => void;
  closeRegistroManual: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  registroManualOpen:  false,
  openRegistroManual:  () => set({ registroManualOpen: true }),
  closeRegistroManual: () => set({ registroManualOpen: false }),
}));
