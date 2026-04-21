import { apiClient } from "@/lib/apiClient";
import { mapAccion, mapModulo, mapRolPermiso, pick, throwIfEnvelopeFailed, unwrapList } from "@/lib/apiNormalizer";

/**
 * GET /api/Permisos/catalogo
 * Esperado: { modulos, acciones, submodulos? } o un arreglo plano que el backend documente.
 */
export async function fetchPermisosCatalogo() {
  const { data } = await apiClient.get("/api/Permisos/catalogo");
  throwIfEnvelopeFailed(data, "No se pudo cargar el catálogo de permisos.");
  const inner = data?.data && typeof data.data === "object" ? data.data : data;
  const modulosRaw = pick(inner, "modulos", "Modulos");
  const accionesRaw = pick(inner, "acciones", "Acciones");
  const modulos = (Array.isArray(modulosRaw) ? modulosRaw : []).map(mapModulo).filter(Boolean);
  const acciones = (Array.isArray(accionesRaw) ? accionesRaw : []).map(mapAccion).filter(Boolean);
  return { modulos, acciones };
}

/** GET /api/Roles/{id}/permisos */
export async function fetchPermisosByRol(idRol) {
  const { data } = await apiClient.get(`/api/Roles/${idRol}/permisos`);
  throwIfEnvelopeFailed(data, "No se pudieron cargar los permisos del rol.");
  return unwrapList(data).map(mapRolPermiso).filter((p) => p?.idModulo != null && p?.idAccion != null);
}

/**
 * PUT /api/Roles/{id}/permisos
 * Body: { permisos: { idModulo, idSubmodulo|null, idAccion, permitido }[] }
 */
export async function updatePermisosRol(idRol, permisos) {
  const { data } = await apiClient.put(`/api/Roles/${idRol}/permisos`, { permisos });
  throwIfEnvelopeFailed(data, "No se pudieron guardar los permisos del rol.");
  return data;
}
