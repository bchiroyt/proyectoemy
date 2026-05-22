import { create } from "zustand";

/** Carrito pendiente de cobro y última venta para ticket (memoria de sesión). */
export const usePosVentaStore = create((set) => ({
  carrito: null,
  total: 0,
  ultimaVenta: null,

  setPendiente: (carrito, total) => set({ carrito, total }),

  /** Guarda datos tras POST /api/Ventas para pantalla de ticket (respaldo si falla GET ticket). */
  setUltimaVenta: (venta) => set({ ultimaVenta: venta, carrito: null, total: 0 }),

  clear: () => set({ carrito: null, total: 0, ultimaVenta: null }),

  clearParaNuevaVenta: () => set({ carrito: null, total: 0, ultimaVenta: null }),
}));
