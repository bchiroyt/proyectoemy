import { create } from "zustand";

/**
 * Permite que una página registre una acción al hacer clic en el usuario del Header
 * (esquina superior derecha), sin acoplar el Header a esa página.
 * Ej.: en POS · Ventas se usa para abrir el cambio rápido de cajero.
 */
export const useHeaderUserActionStore = create((set) => ({
  onClick: null,
  hint: null,
  setAction: (onClick, hint = null) => set({ onClick, hint }),
  clearAction: () => set({ onClick: null, hint: null }),
}));
