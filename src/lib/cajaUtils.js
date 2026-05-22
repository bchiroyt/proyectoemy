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
/** Agrupa movimientos para la pantalla de cierre de caja */
export function agruparMovimientosCierre(movimientos = []) {
  const gastos = movimientos.filter((m) => m.naturaleza?.toUpperCase() === "SALIDA");
  const entradas = movimientos.filter((m) => m.naturaleza?.toUpperCase() === "ENTRADA");
  const esVenta = (m) => /venta/i.test(m.tipoMovimientoNombre ?? "");
  const ventasEfectivo = entradas.filter(esVenta).reduce((acc, m) => acc + m.monto, 0);
  const otrasEntradas = entradas.filter((m) => !esVenta(m)).reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = gastos.reduce((acc, m) => acc + m.monto, 0);
  return {
    gastos,
    ventasEfectivo: Math.round(ventasEfectivo * 100) / 100,
    otrasEntradas: Math.round(otrasEntradas * 100) / 100,
    totalGastos: Math.round(totalGastos * 100) / 100,
  };
}

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
