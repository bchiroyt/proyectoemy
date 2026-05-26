import { fetchVentaCatalogo } from "@/services/ventaService";

/**
 * Busca una variante por SKU o código externo (vía criterio del catálogo de ventas).
 * @param {string} codigo
 * @returns {Promise<object | null>}
 */
export async function fetchProductoByCodigo(codigo) {
  const q = String(codigo).trim();
  if (!q) return null;

  const { items } = await fetchVentaCatalogo({ page: 1, pageSize: 25, criterio: q });
  if (!items.length) return null;

  const qLower = q.toLowerCase();
  const exactSku = items.find((p) => (p.sku || "").toLowerCase() === qLower);
  return exactSku ?? items[0];
}
