import { create } from "zustand";

export type ToastTone = "info" | "error";

export interface Toast {
  id: string;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, opts?: { detail?: string; tone?: ToastTone }) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tone = opts.tone ?? "info";
    set((s) => ({ toasts: [...s.toasts, { id, message, detail: opts.detail, tone }] }));
    // Auto-dismiss after 6s.
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 6000);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
