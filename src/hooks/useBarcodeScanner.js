import { useEffect, useRef } from "react";

/** Ráfaga típica Zebra/USB: huecos entre teclas por debajo de ~40 ms; por encima se asume escritura humana. */
export const BARCODE_DEFAULT_MAX_INTER_KEY_MS = 40;

function isTypingTarget(target) {
  if (!target || typeof target !== "object") return false;
  const el = target;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(el.closest?.("[data-barcode-listener='off']"));
}

function appendKeyToBuffer(buffer, e) {
  if (e.key.length === 1) return buffer + e.key;
  if (e.code && /^Numpad[0-9]$/.test(e.code)) return buffer + e.code.slice(6);
  return buffer;
}

/**
 * Lector HID (p. ej. Zebra): escribe el código muy rápido y suele terminar con
 * **Enter** o **Tab**. Hay que atrapar ese terminador con `preventDefault` +
 * `stopPropagation` (y `stopImmediatePropagation` aquí) para evitar pérdida de
 * foco, “clic” en botón shadcn o submit accidental.
 *
 * Escucha en **document** fase **captura** para interceptar antes que Radix/shadcn.
 *
 * @param {(codigo: string) => void} onScan — Código leído (sin sufijo Enter/Tab).
 * @param {{ maxInterKeyMs?: number; minLength?: number; enabled?: boolean }} [options]
 */
export function useBarcodeScanner(onScan, options = {}) {
  const {
    maxInterKeyMs = BARCODE_DEFAULT_MAX_INTER_KEY_MS,
    minLength = 3,
    enabled = true,
  } = options;

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;

    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > maxInterKeyMs) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      const isTerminator =
        e.key === "Enter" ||
        e.key === "Tab" ||
        e.key === "NumpadEnter" ||
        e.code === "NumpadEnter";

      if (isTerminator) {
        if (buffer.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const code = buffer;
          buffer = "";
          onScanRef.current(code);
        }
        return;
      }

      buffer = appendKeyToBuffer(buffer, e);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [enabled, maxInterKeyMs, minLength]);
}
