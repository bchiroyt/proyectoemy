import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginRequest } from "@/services/authService";
import { fetchUsuarios, updateUsuarioRoles } from "@/services/usuariosService";
import { copiarRol, createRol, fetchRoles, updateRol } from "@/services/rolesService";
import { fetchPermisosByRol, fetchPermisosCatalogo, updatePermisosRol } from "@/services/permisosService";

export const QK_USUARIOS = ["seguridad", "usuarios"];
export const QK_ROLES = ["seguridad", "roles"];
export const QK_CATALOGO_PERMISOS = ["seguridad", "permisos", "catalogo"];
export const qkPermisosRol = (idRol) => ["seguridad", "permisos", "rol", idRol];

export function useUsuariosQuery(options = {}) {
  return useQuery({
    queryKey: QK_USUARIOS,
    queryFn: fetchUsuarios,
    staleTime: 30_000,
    ...options,
  });
}

export function useRolesQuery(options = {}) {
  return useQuery({
    queryKey: QK_ROLES,
    queryFn: fetchRoles,
    staleTime: 30_000,
    ...options,
  });
}

export function usePermisosCatalogoQuery(options = {}) {
  return useQuery({
    queryKey: QK_CATALOGO_PERMISOS,
    queryFn: fetchPermisosCatalogo,
    staleTime: 120_000,
    ...options,
  });
}

export function useRolPermisosQuery(idRol, options = {}) {
  return useQuery({
    queryKey: qkPermisosRol(idRol),
    queryFn: () => fetchPermisosByRol(idRol),
    enabled: Number.isFinite(idRol) && idRol > 0,
    staleTime: 15_000,
    ...options,
  });
}

export function useAsignarRolesUsuarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, idRoles }) => updateUsuarioRoles(idUsuario, idRoles),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_USUARIOS }),
  });
}

export function useCrearRolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createRol(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  });
}

export function useActualizarRolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idRol, body }) => updateRol(idRol, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  });
}

export function useCopiarRolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => copiarRol(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  });
}

export function useActualizarPermisosRolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idRol, permisos }) => updatePermisosRol(idRol, permisos),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qkPermisosRol(vars.idRol) });
      qc.invalidateQueries({ queryKey: QK_ROLES });
    },
  });
}

/** Login sin token (usa apiClient; el interceptor no añade Bearer si token es null) */
export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }) => loginRequest({ email, password }),
  });
}
