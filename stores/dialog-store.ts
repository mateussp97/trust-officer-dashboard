import { create } from "zustand";
import type { ReactNode } from "react";

interface DialogState {
  content: ReactNode | null;
  isOpen: boolean;
  openDialog: (opts: { content: ReactNode }) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  content: null,
  isOpen: false,
  openDialog: ({ content }) => set({ content, isOpen: true }),
  closeDialog: () => set({ isOpen: false }),
}));
