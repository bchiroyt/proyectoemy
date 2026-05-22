import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { digitoDesdeTecla, esTeclaBorrar, esTeclaEnter } from "@/lib/posTecladoUtils";

const MAX_MONTO = 9_999_999.99;

function parseDraft(draft) {
  if (!draft || draft === ".") return 0;
  const n = parseFloat(draft);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Entrada de monto con teclado: teclear 1 luego 2 → Q 12.00 (no modo centavos).
 * El primer dígito reemplaza; los siguientes se concatenan.
 */
export function useMontoTeclado({ enabled = true, onEnter } = {}) {
  const [draft, setDraft] = useState("");
  const overwriteRef = useRef(true);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  const monto = useMemo(() => Math.min(parseDraft(draft), MAX_MONTO), [draft]);

  const reset = useCallback(() => {
    setDraft("");
    overwriteRef.current = true;
  }, []);

  const activarOverwrite = useCallback(() => {
    overwriteRef.current = true;
  }, []);

  const textoMonto = useCallback(
    (negativo = false) => {
      const pref = negativo && monto > 0 ? "-" : "";
      return `${pref}Q ${monto.toFixed(2)}`;
    },
    [monto]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (esTeclaEnter(e)) {
        if (monto > 0) {
          e.preventDefault();
          e.stopPropagation();
          onEnterRef.current?.(monto);
        }
        return;
      }

      if (esTeclaBorrar(e)) {
        e.preventDefault();
        e.stopPropagation();
        setDraft((prev) => prev.slice(0, -1));
        overwriteRef.current = false;
        return;
      }

      const digito = digitoDesdeTecla(e);
      const esPunto = e.key === "." || e.key === "," || e.code === "NumpadDecimal";

      if (!digito && !esPunto) return;

      e.preventDefault();
      e.stopPropagation();

      setDraft((prev) => {
        let next;
        if (overwriteRef.current) {
          next = digito ?? (esPunto ? "0." : "");
          overwriteRef.current = false;
        } else {
          if (esPunto) {
            if (prev.includes(".")) return prev;
            next = prev === "" ? "0." : `${prev}.`;
          } else {
            next = prev + digito;
          }
        }

        if (!next) return "";

        if (next.includes(".")) {
          const [entero, dec = ""] = next.split(".");
          if (dec.length > 2) return prev;
          next = dec === "" ? `${entero}.` : `${entero}.${dec}`;
        } else if (next.length > 1 && next.startsWith("0")) {
          next = String(parseInt(next, 10));
        }

        if (parseDraft(next) > MAX_MONTO) return prev;
        return next;
      });
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [enabled, monto]);

  return {
    monto,
    draft,
    textoMonto,
    reset,
    activarOverwrite,
    edicionActiva: enabled,
  };
}
