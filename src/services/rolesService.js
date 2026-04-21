import { apiClient } from "@/lib/apiClient";
import { mapRol, throwIfEnvelopeFailed, unwrapList } from "@/lib/apiNormalizer";

/** GET /api/Roles */
export async function fetchRoles() {
  const { data } = await apiClient.get("/api/Roles");
  throwIfEnvelopeFailed(data, "No se pudieron obtener los roles.");
  return unwrapList(data).map(mapRol).filter((r) => r?.idRol != null);
}

/** POST /api/Roles */
export async function createRol(body) {
  const { data } = await apiClient.post("/api/Roles", body);
  throwIfEnvelopeFailed(data, "No se pudo crear el rol.");
  return data;
}

/** PUT /api/Roles/{id} */
export async function updateRol(idRol, body) {
  const { data } = await apiClient.put(`/api/Roles/${idRol}`, body);
  throwIfEnvelopeFailed(data, "No se pudo actualizar el rol.");
  return data;
}

/**
 * POST /api/Roles/copiar
 * Body: { idRolOrigen, codigo, nombre, descripcion? }
 */
export async function copiarRol(body) {
  const { data } = await apiClient.post("/api/Roles/copiar", body);
  throwIfEnvelopeFailed(data, "No se pudo copiar el rol.");
  return data;
}
