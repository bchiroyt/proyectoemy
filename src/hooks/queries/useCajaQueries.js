import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCajasAbiertas,
  fetchMiCajaActiva,
  fetchCajaById,
  fetchCajaResumenCierre,
  abrirCaja,
  activarCaja,
  registrarMovimientoCaja,
  cerrarCaja,
  anularCaja,
  registrarArqueoParcial,
  fetchMovimientosCaja,
  fetchDenominacionesActivas,
  fetchCajaMovimientoTipos,
  fetchMetodosPago,
} from "@/services/cajaService";

export const QK_MI_CAJA = ["cajas", "mi-caja-activa"];
export const QK_CAJAS_ABIERTAS = ["cajas", "abiertas"];
export const QK_DENOMINACIONES = ["cajas", "denominaciones"];
export const QK_CAJA_MOVIMIENTO_TIPOS = ["cajas", "movimientos", "tipos"];
export const QK_METODOS_PAGO = ["cajas", "metodos-pago"];
export const qkCaja = (id) => ["cajas", id];
export const qkCajaResumen = (id) => ["cajas", id, "resumen-cierre"];
export const qkCajaMovimientos = (id) => ["cajas", id, "movimientos"];

export function useCajasAbiertasQuery(options = {}) {
  return useQuery({
    queryKey: QK_CAJAS_ABIERTAS,
    queryFn: fetchCajasAbiertas,
    staleTime: 10_000,
    ...options,
  });
}

export function useMiCajaActivaQuery(options = {}) {
  return useQuery({
    queryKey: QK_MI_CAJA,
    queryFn: fetchMiCajaActiva,
    staleTime: 15_000,
    retry: false,
    ...options,
  });
}

export function useCajaByIdQuery(idCaja, options = {}) {
  return useQuery({
    queryKey: qkCaja(idCaja),
    queryFn: () => fetchCajaById(idCaja),
    enabled: Number(idCaja) > 0,
    ...options,
  });
}

export function useCajaResumenCierreQuery(idCaja, options = {}) {
  return useQuery({
    queryKey: qkCajaResumen(idCaja),
    queryFn: () => fetchCajaResumenCierre(idCaja),
    enabled: Number(idCaja) > 0,
    staleTime: 5_000,
    ...options,
  });
}

export function useDenominacionesActivasQuery(options = {}) {
  return useQuery({
    queryKey: QK_DENOMINACIONES,
    queryFn: fetchDenominacionesActivas,
    staleTime: 120_000,
    ...options,
  });
}

export function useCajaMovimientosQuery(idCaja, options = {}) {
  return useQuery({
    queryKey: qkCajaMovimientos(idCaja),
    queryFn: () => fetchMovimientosCaja(idCaja),
    enabled: Number(idCaja) > 0,
    ...options,
  });
}

export function useCajaMovimientoTiposQuery(options = {}) {
  return useQuery({
    queryKey: QK_CAJA_MOVIMIENTO_TIPOS,
    queryFn: fetchCajaMovimientoTipos,
    staleTime: 300_000,
    ...options,
  });
}

export function useMetodosPagoQuery(options = {}) {
  return useQuery({
    queryKey: QK_METODOS_PAGO,
    queryFn: fetchMetodosPago,
    staleTime: 600_000,
    ...options,
  });
}

function invalidateCajaQueries(qc, idCaja) {
  qc.invalidateQueries({ queryKey: QK_MI_CAJA });
  qc.invalidateQueries({ queryKey: QK_CAJAS_ABIERTAS });
  if (idCaja) {
    qc.invalidateQueries({ queryKey: qkCaja(idCaja) });
    qc.invalidateQueries({ queryKey: qkCajaResumen(idCaja) });
    qc.invalidateQueries({ queryKey: qkCajaMovimientos(idCaja) });
  }
}

export function useAbrirCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: abrirCaja,
    onSuccess: () => invalidateCajaQueries(qc),
  });
}

export function useActivarCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCaja, body }) => activarCaja(idCaja, body),
    onSuccess: (_d, vars) => invalidateCajaQueries(qc, vars.idCaja),
  });
}

export function useRegistrarMovimientoCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCaja, body }) => registrarMovimientoCaja(idCaja, body),
    onSuccess: (_d, vars) => invalidateCajaQueries(qc, vars.idCaja),
  });
}

export function useCerrarCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCaja, body }) => cerrarCaja(idCaja, body),
    onSuccess: (_d, vars) => invalidateCajaQueries(qc, vars.idCaja),
  });
}

export function useAnularCajaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCaja, body }) => anularCaja(idCaja, body),
    onSuccess: (_d, vars) => invalidateCajaQueries(qc, vars.idCaja),
  });
}

export function useArqueoParcialMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCaja, body }) => registrarArqueoParcial(idCaja, body),
    onSuccess: (_d, vars) => invalidateCajaQueries(qc, vars.idCaja),
  });
}
