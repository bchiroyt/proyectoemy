import { create } from "zustand";

/** Muestra el selector de tickets en el Header (p. ej. POS · Ventas). */
export const useHeaderTicketsStore = create((set) => ({
  visible: false,
  onLimiteAlcanzado: null,
  setVisible: (visible) => set({ visible }),
  setOnLimiteAlcanzado: (fn) => set({ onLimiteAlcanzado: fn }),
  clear: () => set({ visible: false, onLimiteAlcanzado: null }),
}));
