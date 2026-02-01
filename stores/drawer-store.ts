import { create } from "zustand";
import type { ReactNode } from "react";

interface DrawerState {
  content: ReactNode | null;
  isOpen: boolean;
  openDrawer: (opts: { content: ReactNode }) => void;
  closeDrawer: () => void;
}

export const useDrawerStore = create<DrawerState>((set) => ({
  content: null,
  isOpen: false,
  openDrawer: ({ content }) => set({ content, isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
}));
