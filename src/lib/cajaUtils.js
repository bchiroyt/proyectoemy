/** Inicializa cantidades en cero para cada denominación */
export function initCantidades(denominaciones = []) {
  return denominaciones.reduce(
    (acc, d) => ({ ...acc, [d.idDenominacion]: 0 }),
    {}
  );
}

export function esDenominacionMoneda(denominacion) {
  return String(denominacion?.tipo ?? "")
    .toUpperCase()
    .includes("MONEDA");
}

export function filtrarBilletes(denominaciones = []) {
  return denominaciones.filter((d) => !esDenominacionMoneda(d));
}

/** Parsea monto de monedas (un solo campo); devuelve NaN si el texto no es válido */
export function parseMontoMonedas(value) {
  const s = String(value ?? "")
    .trim()
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  if (!s || s === ".") return 0;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100) / 100;
}
