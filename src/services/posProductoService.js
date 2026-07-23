import { fetchVentaCatalogo } from "@/services/ventaService";

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

/** Códigos de barras / externos de una variante (sin SKU). */
export function codigosBarrasDeProducto(producto) {
  const codigos = [];
  if (producto?.codigoBarras) codigos.push(producto.codigoBarras);
  if (producto?.codigoPrincipal) codigos.push(producto.codigoPrincipal);
  const externos = producto?.codigosExternos ?? [];
  for (const item of externos) {
    if (typeof item === "string") codigos.push(item);
    else if (item?.codigo) codigos.push(item.codigo);
    else if (item?.Codigo) codigos.push(item.Codigo);
  }
  return [...new Set(codigos.map(normalizarCodigo).filter(Boolean))];
}

/** True si el criterio coincide con un código de barras (nunca con SKU). */
export function productoCoincideCodigoBarras(producto, criterio) {
  const qNorm = normalizarCodigo(criterio);
  if (!qNorm) return false;
  return codigosBarrasDeProducto(producto).some(
    (codigo) => codigo === qNorm || codigo.includes(qNorm) || qNorm.includes(codigo)
  );
}

/** Filtra el catálogo dejando solo coincidencias por código de barras. */
export function filtrarCatalogoPorCodigoBarras(items, criterio) {
  return (items ?? []).filter((p) => productoCoincideCodigoBarras(p, criterio));
}

/**
 * Busca una variante por código de barras / código externo (vía catálogo de ventas).
 * El backend filtra por CodigoBarras y ProductoCodigoExternos, pero el JSON del
 * catálogo suele no traer esos campos: si no hay códigos en el payload, se confía
 * en el filtro del API (Escenario A).
 * No usa SKU para evitar traslapes con códigos de barra.
 * @param {string} codigo
 * @returns {Promise<object | null>}
 */
export async function fetchProductoByCodigo(codigo) {
  const q = String(codigo).trim();
  if (!q) return null;

  const { items } = await fetchVentaCatalogo({ page: 1, pageSize: 50, criterio: q });
  if (!items.length) return null;

  const qNorm = normalizarCodigo(q);

  // 1) Match exacto si el payload trae códigos (principal / externos)
  const exactaPorBarras = items.find((p) => codigosBarrasDeProducto(p).includes(qNorm));
  if (exactaPorBarras) return exactaPorBarras;

  const algunProductoTraeCodigos = items.some((p) => codigosBarrasDeProducto(p).length > 0);

  // 2) Escenario A: el API ya filtró por secundario/principal, pero no devuelve códigos.
  //    Sin códigos en el payload, se usa el/los hits del catálogo.
  //    Si el payload SÍ trae códigos y ninguno coincidió, no adivinar (evita falsos por nombre).
  if (!algunProductoTraeCodigos) {
    return items[0];
  }

  return null;
}
