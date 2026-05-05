import { apiClient } from "@/lib/apiClient";

/**
 * Busca variantes por nombre, SKU o código (coincide con PruebasDB / backend).
 * @param {string} criterio
 */
export async function buscarVariantesCompra(criterio) {
  const { data } = await apiClient.get("/api/Productos/variantes/buscar", {
    params: { criterio: criterio?.trim() || "" },
  });
  return data;
}
