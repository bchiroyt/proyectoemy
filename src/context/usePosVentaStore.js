import { create } from "zustand";



const REEMBOLSO_SESION_VACIA = {

  activo: false,

  idVenta: null,

  motivo: "",

  observacion: "",

};



/** Carrito pendiente de cobro y última venta para ticket (memoria de sesión). */

export const usePosVentaStore = create((set) => ({

  carrito: null,

  total: 0,

  ultimaVenta: null,

  /** Snapshot del último reembolso aplicado, para mostrar/imprimir su ticket. */

  ultimoReembolso: null,

  operacion: { tipo: "venta", reembolso: null },

  /** Persiste al navegar ventas ↔ cobro (VentasPos se desmonta en cobro). */

  reembolsoSesion: { ...REEMBOLSO_SESION_VACIA },

  /** Cambia en cada ida a cobro para reiniciar la pantalla de pago. */

  pendienteKey: null,

  /** Incrementa al completar un reembolso; VentasPos reacciona y limpia la sesión. */

  reembolsoFinalizadoTick: 0,

  reembolsoCleanupPending: false,

  setReembolsoSesion: (partial) =>

    set((s) => ({

      reembolsoSesion: { ...s.reembolsoSesion, ...partial },

    })),



  resetReembolsoSesion: () => set({ reembolsoSesion: { ...REEMBOLSO_SESION_VACIA } }),



  setPendiente: (carrito, total, operacion = { tipo: "venta", reembolso: null }) =>

    set({

      carrito,

      total,

      operacion,

      pendienteKey: `${operacion?.tipo ?? "venta"}-${Date.now()}`,

    }),



  /** Libera el snapshot de cobro; no toca reembolsoSesion ni el carrito del ticket. */

  clearPendiente: () =>

    set({

      carrito: null,

      total: 0,

      operacion: { tipo: "venta", reembolso: null },

      pendienteKey: null,

    }),



  notificarReembolsoFinalizado: () =>
    set((s) => ({
      reembolsoFinalizadoTick: s.reembolsoFinalizadoTick + 1,
      reembolsoCleanupPending: true,
    })),

  consumeReembolsoCleanup: () => set({ reembolsoCleanupPending: false }),



  /** Guarda datos tras POST /api/Ventas para pantalla de ticket (respaldo si falla GET ticket). */

  setUltimaVenta: (venta) =>

    set({

      ultimaVenta: venta,

      carrito: null,

      total: 0,

      operacion: { tipo: "venta", reembolso: null },

    }),



  /** Guarda el snapshot del reembolso para su ticket; libera el carrito de cobro. */

  setUltimoReembolso: (reembolso) =>

    set({

      ultimoReembolso: reembolso,

      carrito: null,

      total: 0,

      operacion: { tipo: "venta", reembolso: null },

    }),



  clear: () =>

    set({

      carrito: null,

      total: 0,

      ultimaVenta: null,

      ultimoReembolso: null,

      operacion: { tipo: "venta", reembolso: null },

      reembolsoSesion: { ...REEMBOLSO_SESION_VACIA },

    }),



  clearParaNuevaVenta: () =>

    set({

      carrito: null,

      total: 0,

      ultimaVenta: null,

      ultimoReembolso: null,

      operacion: { tipo: "venta", reembolso: null },

      pendienteKey: null,

      reembolsoSesion: { ...REEMBOLSO_SESION_VACIA },

    }),

}));


