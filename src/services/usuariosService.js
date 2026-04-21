import { apiClient } from "@/lib/apiClient";
import { mapUsuario, throwIfEnvelopeFailed, unwrapList } from "@/lib/apiNormalizer";

/** GET /api/Usuarios (paginado; pide hasta 100 por página) */
export async function fetchUsuarios(params = { page: 1, pageSize: 100 }) {
  const { data } = await apiClient.get("/api/Usuarios", { params });
  throwIfEnvelopeFailed(data, "No se pudieron obtener los usuarios.");
  return unwrapList(data).map(mapUsuario).filter((u) => u?.idUsuario != null);
}

/**
 * PUT /api/Usuarios/{id}/roles
 * Body: { idRoles: number[] }
 */
export async function updateUsuarioRoles(idUsuario, idRoles) {
  const { data } = await apiClient.put(`/api/Usuarios/${idUsuario}/roles`, {
    idRoles,
  });
  throwIfEnvelopeFailed(data, "No se pudieron actualizar los roles del usuario.");
  return data;
}
