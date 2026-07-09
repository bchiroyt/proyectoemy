import { fetchVentaCatalogo } from "@/services/ventaService";

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

/** Códigos de barras / externos de una variante (sin SKU). */
function codigosBarrasDeProducto(producto) {
  const codigos = [];
  if (producto?.codigoBarras) codigos.push(producto.codigoBarras);
  const externos = producto?.codigosExternos ?? [];
  for (const item of externos) {
    if (typeof item === "string") codigos.push(item);
    else if (item?.codigo) codigos.push(item.codigo);
  }
  return codigos.map(normalizarCodigo).filter(Boolean);
}

/**
 * Busca una variante por código de barras / código externo (vía catálogo de ventas).
 * No usa SKU para evitar traslapes con códigos de barra.
 * @param {string} codigo
 * @returns {Promise<object | null>}
 */
export async function fetchProductoByCodigo(codigo) {
  const q = String(codigo).trim();
  if (!q) return null;

  const { items } = await fetchVentaCatalogo({ page: 1, pageSize: 25, criterio: q });
  if (!items.length) return null;

  const qNorm = normalizarCodigo(q);
  const exactaPorBarras = items.find((p) => codigosBarrasDeProducto(p).includes(qNorm));
  return exactaPorBarras ?? null;
}
