"use client";

import { create } from "zustand";

interface UIState {
  registroManualOpen:  boolean;
  openRegistroManual:  () => void;
  closeRegistroManual: () => void;

  // Sidebar en pantallas < lg (en escritorio siempre está visible)
  sidebarOpen:   boolean;
  openSidebar:   () => void;
  closeSidebar:  () => void;
}

export const useUIStore = create<UIState>((set) => ({
  registroManualOpen:  false,
  openRegistroManual:  () => set({ registroManualOpen: true }),
  closeRegistroManual: () => set({ registroManualOpen: false }),

  sidebarOpen:  false,
  openSidebar:  () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
