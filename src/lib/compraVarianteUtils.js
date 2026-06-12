/** Costo de compra de una variante (nunca el precio de venta). */
export function resolverCostoCompraVariante(v) {
  const costo =
    v?.precioCompraActual ??
    v?.PrecioCompraActual ??
    v?.costoPromedioActual ??
    v?.CostoPromedioActual;
  if (costo == null || costo === "") return 0;
  const n = Number(costo);
  return Number.isFinite(n) ? n : 0;
}

/** Valor mostrado en input de cantidad (vacío si es 0 para poder escribir sin un 0 fijo). */
export function valorInputCantidad(cantidad, texto) {
  if (texto !== undefined && texto !== null) return String(texto);
  const n = Number(cantidad);
  return n > 0 ? String(n) : "";
}

/** Valor mostrado en input de costo (vacío si es 0). */
export function valorInputCosto(costo, texto) {
  if (texto !== undefined && texto !== null) return String(texto);
  const n = Number(costo);
  return n > 0 ? String(n) : "";
}

/** Parsea texto de cantidad; null si el formato no es válido. */
export function aplicarInputCantidad(valor) {
  const raw = String(valor ?? "").trim();
  if (raw === "") return { cantidad: 0, cantidadText: "" };
  if (!/^\d+$/.test(raw)) return null;
  const cantidad = parseInt(raw, 10);
  return { cantidad, cantidadText: raw };
}

/** Parsea texto de costo; admite decimales parciales (ej. "12."). */
export function aplicarInputCosto(valor) {
  const raw = String(valor ?? "")
    .trim()
    .replace(",", ".");
  if (raw === "") return { costo: 0, costoText: "" };
  if (!/^\d*\.?\d*$/.test(raw)) return null;
  const parcial = raw === "." || raw.endsWith(".");
  const costo = parcial ? parseFloat(raw.replace(/\.$/, "") || "0") : parseFloat(raw);
  if (!Number.isFinite(costo) && !parcial) return null;
  return {
    costo: Math.max(0, Number.isFinite(costo) ? costo : 0),
    costoText: raw,
  };
}

/** En compra directa: solicitada/estimado = recibida/real (campos ocultos en UI). */
export function sincronizarLineaCompraDirecta(linea) {
  const cantidad = Math.max(
    0,
    Number(linea?.cantidadRecibida ?? linea?.cantidadSolicitada ?? 0) || 0
  );
  const costo = Math.max(0, Number(linea?.costoReal ?? linea?.costoEstimado ?? 0) || 0);
  return {
    ...linea,
    cantidadRecibida: cantidad,
    cantidadSolicitada: cantidad,
    costoReal: costo,
    costoEstimado: costo,
  };
}

/** Variante devuelta por GET /api/Productos/variantes/buscar. */
export function varianteCompraElegible(v) {
  const id = v?.idVariante ?? v?.IdVariante;
  const disp = v?.disponibleParaCompra ?? v?.DisponibleParaCompra;
  return id != null && Number(id) > 0 && disp !== false;
}

/** Variante con id válido (ajustes, búsqueda general). */
export function varianteAjusteElegible(v) {
  const id = v?.idVariante ?? v?.IdVariante;
  return id != null && Number(id) > 0;
}

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

function codigosConocidosVariante(v) {
  const codigos = [v?.sku ?? v?.Sku, v?.codigoBarras ?? v?.CodigoBarras];
  const externos = v?.codigosExternos ?? v?.CodigosExternos ?? [];
  for (const item of externos) {
    if (typeof item === "string") codigos.push(item);
    else codigos.push(item?.codigo ?? item?.Codigo);
  }
  return codigos.map(normalizarCodigo).filter(Boolean);
}

/**
 * Prioriza coincidencia exacta de código (lector) y, si no, un único resultado o el primero elegible.
 */
export function elegirVariantePorCriterio(items, criterio, esElegible = varianteAjusteElegible) {
  const q = normalizarCodigo(criterio);
  if (!q) return null;

  const elegibles = (items ?? []).filter(esElegible);
  if (!elegibles.length) return null;

  const exacta = elegibles.find((v) => codigosConocidosVariante(v).includes(q));
  if (exacta) return exacta;

  if (elegibles.length === 1) return elegibles[0];

  return elegibles[0];
}

export function elegirVarianteParaAgregar(items, criterio) {
  return elegirVariantePorCriterio(items, criterio, varianteCompraElegible);
}
