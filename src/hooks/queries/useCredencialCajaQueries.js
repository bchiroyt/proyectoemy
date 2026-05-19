import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarEstadoCredencialCaja,
  actualizarNipCredencialCaja,
  crearCredencialCaja,
  fetchCredencialCajaPorUsuario,
} from "@/services/credencialCajaService";

export const qkCredencialCajaUsuario = (idUsuario) => ["credencial-caja", "usuario", idUsuario];

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

export function useActualizarNipCredencialCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, ...body }) => actualizarNipCredencialCaja(idUsuario, body),
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
