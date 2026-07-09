import { apiClient } from "@/lib/apiClient";

/**
 * Busca variantes por nombre / nombreVariante (coincide con backend).
 * @param {string} criterio
 * @param {{ idUbicacion?: number|null }} [opciones]
 */
export async function buscarVariantesCompra(criterio, opciones = {}) {
  const params = { criterio: criterio?.trim() || "" };
  const idUbicacion = opciones?.idUbicacion;
  if (idUbicacion != null && Number(idUbicacion) > 0) {
    params.idUbicacion = Number(idUbicacion);
  }
  const { data } = await apiClient.get("/api/Productos/variantes/buscar", { params });
  return data;
}
