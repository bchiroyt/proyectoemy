import { create } from "zustand";

export const MODOS_EDICION_DETALLE_PRODUCTO = {
  DETALLES: "detalles",
  NUEVA_VARIANTE: "nueva-variante",
  EDITAR_VARIANTE: "editar-variante",
};

export const useDetalleProductoEdicionStore = create((set, get) => ({
  modoActivo: null,
  idVarianteActiva: null,

  iniciarModo: (modo, { idVariante = null } = {}) => {
    const { modoActivo, idVarianteActiva } = get();
    const mismaEdicionVariante =
      modo === MODOS_EDICION_DETALLE_PRODUCTO.EDITAR_VARIANTE &&
      modoActivo === modo &&
      idVarianteActiva === idVariante;

    if (modoActivo && modoActivo !== modo && !mismaEdicionVariante) {
      return false;
    }

    if (modoActivo === modo && !mismaEdicionVariante) {
      return false;
    }

    set({ modoActivo: modo, idVarianteActiva: idVariante });
    return true;
  },

  finalizarModo: (modo = null) => {
    const { modoActivo } = get();
    if (modo && modoActivo !== modo) return;
    set({ modoActivo: null, idVarianteActiva: null });
  },

  reset: () => set({ modoActivo: null, idVarianteActiva: null }),
}));
