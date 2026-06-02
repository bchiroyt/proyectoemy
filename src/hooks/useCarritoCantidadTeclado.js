import { useCallback, useEffect, useRef, useState } from "react";
import { digitoDesdeTecla, esTeclaBorrar } from "@/lib/posTecladoUtils";

/**
 * Teclas que llegan más rápido que esto (ms) se consideran parte de una ráfaga del
 * lector de código, no escritura manual. La escritura humana de una cantidad supera
 * ampliamente este valor; un lector envía cada carácter casi instantáneamente.
 */
const RAFAGA_LECTOR_MS = 80;

/**
 * Edición de cantidad en carrito POS sin input visible.
 * Delete: quita dígitos → 0 → elimina línea.
 */
export function useCarritoCantidadTeclado(
  carrito,
  setCarrito,
  { getMaxCantidad, getMinCantidad, getPuedeEliminarLinea } = {}
) {
  const [lineaId, setLineaId] = useState(null);
  const [draft, setDraft] = useState(null);
  const overwriteRef = useRef(true);
  const lastKeyTimeRef = useRef(0);

  const seleccionarLinea = useCallback((id) => {
    setLineaId(id);
    setDraft(null);
    overwriteRef.current = true;
  }, []);

  const deseleccionar = useCallback(() => {
    setLineaId(null);
    setDraft(null);
    overwriteRef.current = true;
  }, []);

  const actualizarCantidad = useCallback(
    (id, cantidad) => {
      setCarrito((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const maxCantidad = Math.max(
            0,
            Math.floor(
              Number(typeof getMaxCantidad === "function" ? getMaxCantidad(p) : 9999) || 9999
            )
          );
          const minCantidad = Math.max(
            0,
            Math.floor(
              Number(typeof getMinCantidad === "function" ? getMinCantidad(p) : 0) || 0
            )
          );
          const n = Math.floor(Number(cantidad)) || 0;
          const limitado = Math.max(minCantidad, Math.min(maxCantidad, n));
          return { ...p, cantidad: limitado };
        })
      );
    },
    [setCarrito, getMaxCantidad, getMinCantidad]
  );

  const eliminarLinea = useCallback(
    (id) => {
      setCarrito((prev) => prev.filter((p) => p.id !== id));
      setLineaId((actual) => (actual === id ? null : actual));
      setDraft(null);
      overwriteRef.current = true;
    },
    [setCarrito]
  );

  const cantidadVisible = useCallback(
    (item) => {
      if (item.id !== lineaId) return String(item.cantidad);
      if (draft !== null) return draft === "" ? "0" : draft;
      return String(item.cantidad);
    },
    [lineaId, draft]
  );

  useEffect(() => {
    if (lineaId == null) return undefined;

    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Si el foco está en un campo de texto (p. ej. el input de descuento), no tocamos
      // la cantidad: deja que el input maneje la tecla.
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) {
        return;
      }

      // Medimos el hueco respecto a la tecla anterior para distinguir lector vs. teclado.
      const ahora = Date.now();
      const gap = ahora - lastKeyTimeRef.current;
      lastKeyTimeRef.current = ahora;

      const item = carrito.find((p) => p.id === lineaId);
      if (!item) {
        deseleccionar();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        deseleccionar();
        return;
      }

      if (esTeclaBorrar(e)) {
        e.preventDefault();
        e.stopPropagation();

        const current = draft !== null ? draft : String(item.cantidad);

        if (current.length > 1) {
          const next = current.slice(0, -1);
          setDraft(next);
          overwriteRef.current = false;
          actualizarCantidad(lineaId, parseInt(next, 10) || 0);
          return;
        }

        if (item.cantidad > 0 || (current.length === 1 && current !== "0")) {
          setDraft("0");
          overwriteRef.current = false;
          actualizarCantidad(lineaId, 0);
          return;
        }

        const puedeEliminar =
          typeof getPuedeEliminarLinea !== "function" || getPuedeEliminarLinea(item);
        if (!puedeEliminar) {
          deseleccionar();
          return;
        }

        eliminarLinea(lineaId);
        return;
      }

      const digito = digitoDesdeTecla(e);
      if (!digito) return;

      // Ráfaga del lector: no es edición manual de cantidad. La dejamos pasar para que
      // el escáner arme el código; así escanear con una línea seleccionada no la pone en 0.
      if (gap < RAFAGA_LECTOR_MS) return;

      e.preventDefault();
      e.stopPropagation();

      let next;
      if (overwriteRef.current) {
        next = digito;
        overwriteRef.current = false;
      } else {
        const base = draft !== null ? draft : String(item.cantidad);
        next = base + digito;
      }

      if (next.length > 4) return;

      setDraft(next);
      actualizarCantidad(lineaId, parseInt(next, 10) || 0);
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [
    lineaId,
    draft,
    carrito,
    actualizarCantidad,
    eliminarLinea,
    deseleccionar,
    getPuedeEliminarLinea,
  ]);

  return {
    lineaSeleccionadaId: lineaId,
    edicionActiva: lineaId != null,
    seleccionarLinea,
    deseleccionar,
    cantidadVisible,
  };
}
