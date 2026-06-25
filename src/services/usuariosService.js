import { apiClient } from "@/lib/apiClient";
import { mapUsuario, mapUsuarioDetallado, pick, throwIfEnvelopeFailed, unwrapList } from "@/lib/apiNormalizer";
import {
  filtrarUsuariosVisibles,
  ID_USUARIO_SISTEMA,
} from "@/lib/usuarioUtils";

/**
 * POST /api/Usuarios — UsuarioCrearRequest
 * Body: idTipoUsuario, username, email, password, nombres, apellidos?, telefono?, requiereCambioPassword, activo, idRoles, permisosExcepcionales
 */
export async function createUsuario(body) {
  const { data } = await apiClient.post("/api/Usuarios", body);
  throwIfEnvelopeFailed(data, "No se pudo crear el usuario.");
  return pick(data, "data", "Data") ?? data;
}

/** GET /api/Usuarios (paginado) */
export async function fetchUsuarios(params = { page: 1, pageSize: 10 }) {
  const { data } = await apiClient.get("/api/Usuarios", { params });
  throwIfEnvelopeFailed(data, "No se pudieron obtener los usuarios.");
  const inner = pick(data, "data", "Data") ?? data;
  const allItems = unwrapList(data).map(mapUsuario).filter((u) => u?.idUsuario != null);
  const items = filtrarUsuariosVisibles(allItems);
  const page = Number(pick(inner, "page", "Page") ?? params.page ?? 1) || 1;
  const pageSize = Number(pick(inner, "pageSize", "PageSize") ?? params.pageSize ?? 10) || 10;
  const rawTotalCount =
    Number(pick(inner, "totalCount", "TotalCount", "totalRecords", "TotalRecords") ?? allItems.length) ||
    allItems.length;
  const totalCount = Math.max(0, rawTotalCount - 1);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items, page, pageSize, totalCount, totalPages };
}

/**
 * PUT /api/Usuarios/{id}/roles
 * Body: { idRoles: number[] }
 */
export async function updateUsuarioRoles(idUsuario, idRoles) {
  if (Number(idUsuario) === ID_USUARIO_SISTEMA) {
    throw new Error("No se puede modificar el usuario del sistema.");
  }
  const { data } = await apiClient.put(`/api/Usuarios/${idUsuario}/roles`, {
    idRoles,
  });
  throwIfEnvelopeFailed(data, "No se pudieron actualizar los roles del usuario.");
  return data;
}

/** GET /api/Usuarios/{id} — UsuarioResponse completo */
export async function fetchUsuarioById(idUsuario) {
  if (Number(idUsuario) === ID_USUARIO_SISTEMA) {
    throw new Error("Usuario no encontrado.");
  }
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
  if (Number(idUsuario) === ID_USUARIO_SISTEMA) {
    throw new Error("No se puede modificar el usuario del sistema.");
  }
  const { data } = await apiClient.patch(`/api/Usuarios/${idUsuario}`, body);
  throwIfEnvelopeFailed(data, "No se pudo actualizar el usuario.");
  return mapUsuarioDetallado(pick(data, "data", "Data") ?? data);
}

/** DELETE /api/Usuarios/{id} — desactiva (Activo = false) en el backend */
export async function desactivarUsuario(idUsuario) {
  if (Number(idUsuario) === ID_USUARIO_SISTEMA) {
    throw new Error("No se puede desactivar el usuario del sistema.");
  }
  const { data } = await apiClient.delete(`/api/Usuarios/${idUsuario}`);
  throwIfEnvelopeFailed(data, "No se pudo desactivar el usuario.");
  return data;
}

/**
 * PUT /api/Usuarios/{id}/permisos-excepcionales
 * permisosExcepcionales: { idModulo, idAccion, permitido }[] (sin submódulo; ver UsuarioPermisoAccionRequest)
 */
export async function updateUsuarioPermisosExcepcionales(idUsuario, permisosExcepcionales) {
  if (Number(idUsuario) === ID_USUARIO_SISTEMA) {
    throw new Error("No se puede modificar el usuario del sistema.");
  }
  const { data } = await apiClient.put(`/api/Usuarios/${idUsuario}/permisos-excepcionales`, {
    permisosExcepcionales,
  });
  throwIfEnvelopeFailed(data, "No se pudieron guardar los permisos excepcionales.");
  return mapUsuarioDetallado(pick(data, "data", "Data") ?? data);
}
