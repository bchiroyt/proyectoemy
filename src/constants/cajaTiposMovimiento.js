/**
 * Tipos de movimiento de caja.
 * El backend aún no expone GET de catálogo; configure VITE_TIPOS_MOVIMIENTO_CAJA en .env
 * como JSON: [{"idTipoMovimientoCaja":1,"nombre":"Entrada","naturaleza":"ENTRADA","requiereMotivo":true}]
 */
export function getTiposMovimientoCajaConfig() {
  try {
    const raw = import.meta.env.VITE_TIPOS_MOVIMIENTO_CAJA?.trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t) => ({
        idTipoMovimientoCaja: Number(t.idTipoMovimientoCaja ?? t.id),
        nombre: t.nombre ?? t.Nombre ?? "",
        naturaleza: String(t.naturaleza ?? t.Naturaleza ?? "").toUpperCase(),
        requiereMotivo: Boolean(t.requiereMotivo ?? t.RequiereMotivo ?? true),
      }))
      .filter((t) => t.idTipoMovimientoCaja > 0 && t.nombre);
  } catch {
    return [];
  }
}

/** Fusiona config .env con tipos ya usados en movimientos de la caja */
export function mergeTiposMovimiento(configTipos, movimientos = []) {
  const map = new Map();
  for (const t of configTipos) {
    map.set(t.idTipoMovimientoCaja, t);
  }
  for (const m of movimientos) {
    if (!m.idTipoMovimientoCaja) continue;
    if (!map.has(m.idTipoMovimientoCaja)) {
      map.set(m.idTipoMovimientoCaja, {
        idTipoMovimientoCaja: m.idTipoMovimientoCaja,
        nombre: m.tipoMovimientoNombre || `Tipo #${m.idTipoMovimientoCaja}`,
        naturaleza: m.naturaleza || "ENTRADA",
        requiereMotivo: true,
      });
    }
  }
  return [...map.values()];
}

/** Tipos permitidos al registrar gasto/entrada manual desde POS (no ventas ni reembolsos). */
export function esTipoMovimientoManualPermitido(tipo) {
  const nombre = String(tipo?.nombre ?? "").trim().toLowerCase();
  return (
    nombre.includes("entrada manual") ||
    nombre.includes("gastos caja") ||
    nombre.includes("gasto caja")
  );
}

export function filtrarTiposMovimientoManual(tipos = []) {
  return tipos.filter(esTipoMovimientoManualPermitido);
}
