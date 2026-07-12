import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { obtenerProductoPorId } from "@/services/productos";
import { buscarVariantesCompra } from "@/services/productosService";
import { unwrapProductoDetalleBody } from "@/lib/productoUtils";
import { pickNombreVariante } from "@/lib/varianteUtils";

const CAMPOS_COSTO_COMPRA = [
  "precioCompraActual",
  "PrecioCompraActual",
  "costoPromedioActual",
  "CostoPromedioActual",
  "precioCompra",
  "PrecioCompra",
  "ultimoPrecioCompra",
  "UltimoPrecioCompra",
  "ultimoCostoCompra",
  "UltimoCostoCompra",
];

/** Costo de compra de una variante (nunca el precio de venta). */
export function resolverCostoCompraVariante(v) {
  if (!v || typeof v !== "object") return 0;

  for (const campo of CAMPOS_COSTO_COMPRA) {
    const n = toNumberOrNull(v[campo]);
    if (n != null && n > 0) return n;
  }

  return 0;
}

/** Normaliza variante de GET /api/Productos/variantes/buscar para compras. */
export function normalizarVarianteCompraBusqueda(raw) {
  if (!raw || typeof raw !== "object") return null;

  const costo = resolverCostoCompraVariante(raw);
  const stockActual =
    toNumberOrNull(pick(raw, "stockActual", "StockActual", "stock", "Stock")) ?? 0;

  return {
    ...raw,
    idVariante: toNumberOrNull(pick(raw, "idVariante", "IdVariante")),
    idProducto: toNumberOrNull(pick(raw, "idProducto", "IdProducto")),
    productoNombre:
      pick(raw, "productoNombre", "ProductoNombre", "nombre", "Nombre") ?? "",
    nombreVariante: pickNombreVariante(raw) ?? "",
    sku: pick(raw, "sku", "Sku", "codigoPrincipal", "CodigoPrincipal") ?? "",
    stockActual,
    stock: stockActual,
    precioCompraActual:
      toNumberOrNull(pick(raw, "precioCompraActual", "PrecioCompraActual")) ??
      (costo > 0 ? costo : null),
    costoPromedioActual:
      toNumberOrNull(pick(raw, "costoPromedioActual", "CostoPromedioActual")) ??
      (costo > 0 ? costo : null),
  };
}

export function unwrapVariantesCompraBuscar(raw) {
  return unwrapList(raw).map(normalizarVarianteCompraBusqueda).filter(Boolean);
}

function normalizarTextoBusqueda(valor) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-GT");
}

function valoresCodigoBarrasVariante(v) {
  return [
    pick(v, "codigoBarras", "CodigoBarras"),
    pick(v, "codigoBarra", "CodigoBarra"),
    pick(v, "codigoPrincipal", "CodigoPrincipal"),
  ]
    .map(normalizarCodigo)
    .filter(Boolean);
}

function valoresCodigosExternosVariante(v) {
  const externos = v?.codigosExternos ?? v?.CodigosExternos ?? [];
  if (!Array.isArray(externos)) return [];

  return externos
    .map((item) => (typeof item === "string" ? item : item?.codigo ?? item?.Codigo))
    .map(normalizarCodigo)
    .filter(Boolean);
}

function obtenerNombreProductoVariante(v) {
  return (
    pick(v, "productoNombre", "ProductoNombre", "nombreProducto", "NombreProducto", "nombre", "Nombre") ??
    ""
  );
}

function prioridadBusquedaCompra(v, criterio) {
  const qCodigo = normalizarCodigo(criterio);
  const qTexto = normalizarTextoBusqueda(criterio);
  if (!qTexto) return Number.POSITIVE_INFINITY;

  if (qCodigo && valoresCodigoBarrasVariante(v).includes(qCodigo)) return 1;
  if (qCodigo && valoresCodigosExternosVariante(v).includes(qCodigo)) return 2;

  const nombreVariante = normalizarTextoBusqueda(pickNombreVariante(v));
  if (nombreVariante && nombreVariante.includes(qTexto)) return 3;

  const nombreProducto = normalizarTextoBusqueda(obtenerNombreProductoVariante(v));
  if (nombreProducto && nombreProducto.includes(qTexto)) return 4;

  return Number.POSITIVE_INFINITY;
}

export function aplicarCriteriosBusquedaCompra(items, criterio) {
  return (items ?? [])
    .map((item, index) => ({
      item,
      index,
      prioridad: prioridadBusquedaCompra(item, criterio),
    }))
    .filter((x) => Number.isFinite(x.prioridad))
    .sort((a, b) => a.prioridad - b.prioridad || a.index - b.index)
    .map((x) => x.item);
}

const cacheVariantesPorProducto = new Map();

export function invalidarCacheDetalleProductoVariantes() {
  cacheVariantesPorProducto.clear();
}

export function resolverUbicacionDefaultAjuste(catalogos, variante) {
  const ubicaciones = catalogos?.ubicaciones ?? [];
  const idVarianteUbicacion = toNumberOrNull(
    pick(
      variante,
      "idUbicacionDefault",
      "IdUbicacionDefault",
      "ubicacion",
      "Ubicacion",
      "idUbicacion",
      "IdUbicacion"
    )
  );

  if (
    idVarianteUbicacion &&
    ubicaciones.some((u) => Number(u.idUbicacion) === idVarianteUbicacion)
  ) {
    return idVarianteUbicacion;
  }

  return ubicaciones[0]?.idUbicacion ?? null;
}

/** Stock de la variante en una ubicación (si el backend lo soporta en buscar). */
export async function consultarStockVarianteUbicacion(
  idVariante,
  idUbicacion,
  sku,
  buscar = buscarVariantesCompra
) {
  const idVar = toNumberOrNull(idVariante);
  const idUbi = toNumberOrNull(idUbicacion);
  const codigo = String(sku ?? "").trim();
  if (!idVar || !idUbi || !codigo) return null;

  try {
    const raw = await buscar(codigo, { idUbicacion: idUbi });
    const items = unwrapVariantesCompraBuscar(raw);
    const match = items.find(
      (v) => toNumberOrNull(pick(v, "idVariante", "IdVariante")) === idVar
    );
    if (!match) return null;
    return toNumberOrNull(pick(match, "stockActual", "StockActual", "stock", "Stock"));
  } catch {
    return null;
  }
}

/**
 * Alinea stock/costo de la variante con GET /api/Productos/{idProducto}.
 * La búsqueda puede traer stock desactualizado o incompleto.
 */
export async function enriquecerVarianteDesdeDetalleProducto(
  variante,
  obtenerDetalle = obtenerProductoPorId
) {
  const base = normalizarVarianteCompraBusqueda(variante);
  if (!base) return variante;

  const idProducto = toNumberOrNull(pick(base, "idProducto", "IdProducto"));
  const idVariante = toNumberOrNull(pick(base, "idVariante", "IdVariante"));
  if (!idProducto || !idVariante) return base;

  try {
    let variantesDetalle = cacheVariantesPorProducto.get(idProducto);
    if (!variantesDetalle) {
      const raw = await obtenerDetalle(idProducto);
      const detalle = unwrapProductoDetalleBody(raw);
      variantesDetalle = Array.isArray(detalle?.variantes) ? detalle.variantes : [];
      cacheVariantesPorProducto.set(idProducto, variantesDetalle);
    }

    const match = variantesDetalle.find(
      (vv) => toNumberOrNull(pick(vv, "idVariante", "IdVariante")) === idVariante
    );
    if (!match) return base;

    const stockDetalle =
      toNumberOrNull(pick(match, "stockActual", "StockActual", "stock", "Stock")) ?? 0;

    return normalizarVarianteCompraBusqueda({
      ...base,
      ...match,
      stockActual: stockDetalle,
      stock: stockDetalle,
    });
  } catch {
    return base;
  }
}

/** @deprecated Alias: usar enriquecerVarianteDesdeDetalleProducto */
export async function enriquecerVarianteCompraConCosto(
  variante,
  obtenerDetalle = obtenerProductoPorId
) {
  return enriquecerVarianteDesdeDetalleProducto(variante, obtenerDetalle);
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

function codigosConocidosVariante(v, { incluirSku = true } = {}) {
  const codigos = [
    ...(incluirSku ? [v?.sku ?? v?.Sku] : []),
    ...valoresCodigoBarrasVariante(v),
    ...valoresCodigosExternosVariante(v),
  ];
  return Array.from(new Set(codigos.map(normalizarCodigo).filter(Boolean)));
}

function nombreVarianteNormalizado(v) {
  return normalizarCodigo(pickNombreVariante(v) ?? v?.nombreVariante ?? v?.NombreVariante);
}

/**
 * Prioriza coincidencia exacta de código (lector) y, si no, un único resultado o el primero elegible.
 */
export function elegirVariantePorCriterio(
  items,
  criterio,
  esElegible = varianteAjusteElegible,
  opciones = {}
) {
  const q = normalizarCodigo(criterio);
  if (!q) return null;

  const elegibles = (items ?? []).filter(esElegible);
  if (!elegibles.length) return null;

  const exacta = elegibles.find((v) => codigosConocidosVariante(v, opciones).includes(q));
  if (exacta) return exacta;

  if (elegibles.length === 1) return elegibles[0];

  return elegibles[0];
}

/**
 * Selección para ajustes: prioriza nombreVariante (ya no se busca por SKU).
 */
export function elegirVarianteAjustePorNombre(items, criterio) {
  const q = normalizarCodigo(criterio);
  if (!q) return null;

  const elegibles = (items ?? []).filter(varianteAjusteElegible);
  if (!elegibles.length) return null;

  const exacta = elegibles.find((v) => nombreVarianteNormalizado(v) === q);
  if (exacta) return exacta;

  const parciales = elegibles.filter((v) => {
    const nombre = nombreVarianteNormalizado(v);
    return nombre && nombre.includes(q);
  });
  if (parciales.length === 1) return parciales[0];
  if (parciales.length > 1) return parciales[0];

  if (elegibles.length === 1) return elegibles[0];
  return elegibles[0];
}

export function elegirVarianteParaAgregar(items, criterio) {
  return elegirVariantePorCriterio(items, criterio, varianteCompraElegible, { incluirSku: false });
}
