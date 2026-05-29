import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarEstadoCredencialCaja,
  asignarNipCredencialCaja,
  crearCredencialCaja,
  fetchCredencialCajaPorUsuario,
  fetchCredencialesCaja,
  patchCredencialCajaUsuario,
} from "@/services/credencialCajaService";

export const qkCredencialCajaUsuario = (idUsuario) => ["credencial-caja", "usuario", idUsuario];
export const QK_CREDENCIALES_CAJA = ["credencial-caja", "lista"];

/** Lista de operadores con credencial de caja (para cambio rápido de cajero). */
export function useCredencialesCajaQuery(options = {}) {
  return useQuery({
    queryKey: QK_CREDENCIALES_CAJA,
    queryFn: () => fetchCredencialesCaja({ page: 1, pageSize: 100 }),
    staleTime: 30_000,
    ...options,
  });
}

export function useCredencialCajaPorUsuarioQuery(idUsuario, options = {}) {
  return useQuery({
    queryKey: qkCredencialCajaUsuario(idUsuario),
    queryFn: () => fetchCredencialCajaPorUsuario(idUsuario),
    enabled: Number.isFinite(idUsuario) && idUsuario > 0,
    staleTime: 15_000,
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
    ...options,
  });
}

export function useCrearCredencialCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => crearCredencialCaja(body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qkCredencialCajaUsuario(v.idUsuario) });
    },
  });
}

/** Admin en módulo usuarios: PUT /nip sin NIP actual */
export function useAsignarNipCredencialCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, nuevoNip }) => asignarNipCredencialCaja(idUsuario, nuevoNip),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qkCredencialCajaUsuario(v.idUsuario) });
    },
  });
}

/** PATCH con nipActual + nuevoNip (perfil / cambio propio) */
export function usePatchCredencialCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, nipActual, nuevoNip }) =>
      patchCredencialCajaUsuario(idUsuario, { nipActual, nuevoNip }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qkCredencialCajaUsuario(v.idUsuario) });
    },
  });
}

export function useActualizarEstadoCredencialCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, activo }) => actualizarEstadoCredencialCaja(idUsuario, activo),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qkCredencialCajaUsuario(v.idUsuario) });
    },
  });
}
