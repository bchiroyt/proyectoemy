import { apiClient } from "@/lib/apiClient";

/**
 * Lista proveedores (paginado). Devuelve la envoltura `RespuestaBase` del backend.
 */
export async function fetchProveedores({ page = 1, pageSize = 200 } = {}) {
  const { data } = await apiClient.get("/api/Proveedores", { params: { page, pageSize } });
  return data;
}

/**
 * Crea un proveedor. Solamente `nombre` es obligatorio.
 */
export async function crearProveedor(body) {
  const { data } = await apiClient.post("/api/Proveedores", body);
  return data;
}
