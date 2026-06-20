import { create } from "zustand";
import { aplicarInputCantidad, aplicarInputCosto } from "@/lib/compraVarianteUtils";

/**
 * Store independiente para mayoreo / cotizaciones.
 * precioNegociado: precio de la línea en esta cotización (no altera menudeo).
 * TODO: precargar desde precioVentaMayor cuando exista en catálogo/inventario.
 */
export const useMayoreoStore = create((set) => ({
  carrito: [],

  agregarProducto: (producto) => {
    set((state) => {
      const existe = state.carrito.find((p) => p.idVariante === producto.idVariante);
      if (existe) {
        return {
          carrito: state.carrito.map((p) => {
            if (p.idVariante !== producto.idVariante) return p;
            const cantidad = p.cantidad + 1;
            return {
              ...p,
              cantidad,
              cantidadText: String(cantidad),
            };
          }),
        };
      }
      const precio = Number(producto.precio) || 0;
      return {
        carrito: [
          ...state.carrito,
          {
            ...producto,
            cantidad: 1,
            cantidadText: "1",
            precioNegociado: precio,
            precioNegociadoText: precio > 0 ? String(precio) : "",
          },
        ],
      };
    });
  },

  setCantidadInput: (idVariante, valor) => {
    const parsed = aplicarInputCantidad(valor);
    if (!parsed) return;
    set((state) => ({
      carrito: state.carrito.map((p) =>
        p.idVariante === idVariante
          ? { ...p, cantidad: parsed.cantidad, cantidadText: parsed.cantidadText }
          : p
      ),
    }));
  },

  setPrecioNegociadoInput: (idVariante, valor) => {
    const parsed = aplicarInputCosto(valor);
    if (!parsed) return;
    set((state) => ({
      carrito: state.carrito.map((p) =>
        p.idVariante === idVariante
          ? { ...p, precioNegociado: parsed.costo, precioNegociadoText: parsed.costoText }
          : p
      ),
    }));
  },

  removerProducto: (idVariante) => {
    set((state) => ({
      carrito: state.carrito.filter((p) => p.idVariante !== idVariante),
    }));
  },

  limpiarCarrito: () => {
    set({ carrito: [] });
  },

  cargarCarrito: (items) => {
    set({ carrito: Array.isArray(items) ? items : [] });
  },
}));
