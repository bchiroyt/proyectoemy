import { apiClient } from "@/lib/apiClient";
import { mapUsuario, mapUsuarioDetallado, pick, throwIfEnvelopeFailed, unwrapList } from "@/lib/apiNormalizer";

/**
 * POST /api/Usuarios — UsuarioCrearRequest
 * Body: idTipoUsuario, username, email, password, nombres, apellidos?, telefono?, requiereCambioPassword, activo, idRoles, permisosExcepcionales
 */
export async function createUsuario(body) {
  const { data } = await apiClient.post("/api/Usuarios", body);
  throwIfEnvelopeFailed(data, "No se pudo crear el usuario.");
  return pick(data, "data", "Data") ?? data;
}

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

/** GET /api/Usuarios/{id} — UsuarioResponse completo */
export async function fetchUsuarioById(idUsuario) {
  const { data } = await apiClient.get(`/api/Usuarios/${idUsuario}`);
  throwIfEnvelopeFailed(data, "No se pudo cargar el usuario.");
  const inner = pick(data, "data", "Data");
  return mapUsuarioDetallado(inner ?? data);
}

/**
 * PATCH /api/Usuarios/{id}
 * Body parcial (UsuarioPatchRequest): idTipoUsuario, username, email, nombres, apellidos, telefono,
 * requiereCambioPassword, activo, password (opcional).
 */
export async function patchUsuario(idUsuario, body) {
  const { data } = await apiClient.patch(`/api/Usuarios/${idUsuario}`, body);
  throwIfEnvelopeFailed(data, "No se pudo actualizar el usuario.");
  return mapUsuarioDetallado(pick(data, "data", "Data") ?? data);
}

/** DELETE /api/Usuarios/{id} — desactiva (Activo = false) en el backend */
export async function desactivarUsuario(idUsuario) {
  const { data } = await apiClient.delete(`/api/Usuarios/${idUsuario}`);
  throwIfEnvelopeFailed(data, "No se pudo desactivar el usuario.");
  return data;
}

/**
 * PUT /api/Usuarios/{id}/permisos-excepcionales
 * permisosExcepcionales: { idModulo, idAccion, permitido }[] (sin submódulo; ver UsuarioPermisoAccionRequest)
 */
export async function updateUsuarioPermisosExcepcionales(idUsuario, permisosExcepcionales) {
  const { data } = await apiClient.put(`/api/Usuarios/${idUsuario}/permisos-excepcionales`, {
    permisosExcepcionales,
  });
  throwIfEnvelopeFailed(data, "No se pudieron guardar los permisos excepcionales.");
  return mapUsuarioDetallado(pick(data, "data", "Data") ?? data);
}
