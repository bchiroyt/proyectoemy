/**
 * Métodos de pago (el backend valida por idMetodoPago en POST /api/Ventas).
 * Configure en .env con los IDs reales de su tabla metodo_pago:
 * VITE_METODOS_PAGO=[{"clave":"efectivo","idMetodoPago":1,"nombre":"EFECTIVO","permiteCambio":true},{"clave":"banco","idMetodoPago":2,"nombre":"BANCO","permiteCambio":false}]
 */
export function getMetodosPagoConfig() {
  try {
    const raw = import.meta.env.VITE_METODOS_PAGO?.trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((m) => ({
        clave: String(m.clave ?? m.Clave ?? "").toLowerCase(),
        idMetodoPago: Number(m.idMetodoPago ?? m.IdMetodoPago ?? m.id),
        nombre: String(m.nombre ?? m.Nombre ?? "").toUpperCase() || "PAGO",
        permiteCambio: Boolean(m.permiteCambio ?? m.PermiteCambio ?? false),
      }))
      .filter((m) => m.idMetodoPago > 0 && m.clave);
  } catch {
    return [];
  }
}

export function getMetodoPorClave(clave) {
  const k = String(clave ?? "").toLowerCase();
  return getMetodosPagoConfig().find((m) => m.clave === k) ?? null;
}
