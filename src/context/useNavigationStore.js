import { create } from "zustand";

/** Destino especial para confirmar salida con el botón Atrás del navegador. */
export const NAV_GUARD_BACK = "__BACK__";

export const useNavigationStore = create((set, get) => ({
  titulo: "Panel de Control",

  setTitulo: (nuevoTitulo) => set({ titulo: nuevoTitulo }),

  unsavedChangesGuard: null,
  confirmExitOpen: false,
  pendingNav: null,

  setUnsavedChangesGuard: (guard) => set({ unsavedChangesGuard: guard }),

  attemptNavigation: (to) => {
    const guard = get().unsavedChangesGuard;
    if (typeof guard === "function" && guard()) {
      set({ confirmExitOpen: true, pendingNav: to });
      return false;
    }
    return true;
  },

  cancelExit: () => set({ confirmExitOpen: false, pendingNav: null }),

  consumePendingNavigation: () => {
    const to = get().pendingNav;
    set({ confirmExitOpen: false, pendingNav: null, unsavedChangesGuard: null });
    return to;
  },
}));
