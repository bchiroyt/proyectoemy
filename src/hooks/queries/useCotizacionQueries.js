import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarCotizacion,
  anularCotizacion,
  convertirCotizacion,
  crearCotizacion,
  fetchCotizacionPorId,
  fetchCotizacionesPendientes,
  fetchCotizacionesHistorial,
} from "@/services/cotizacionService";

export const QK_COTIZACIONES = "cotizaciones";

export function useCotizacionesPendientesQuery(options = {}) {
  return useQuery({
    queryKey: [QK_COTIZACIONES, "pendientes"],
    queryFn: fetchCotizacionesPendientes,
    staleTime: 10_000,
    ...options,
  });
}

export function useCotizacionesHistorialQuery(options = {}) {
  return useQuery({
    queryKey: [QK_COTIZACIONES, "historial"],
    queryFn: fetchCotizacionesHistorial,
    staleTime: 10_000,
    ...options,
  });
}

export function useCotizacionDetalleQuery(idCotizacion, options = {}) {
  const id = Number(idCotizacion);
  return useQuery({
    queryKey: [QK_COTIZACIONES, "detalle", id],
    queryFn: () => fetchCotizacionPorId(id),
    enabled: Number.isFinite(id) && id > 0,
    ...options,
  });
}

export function useCrearCotizacionMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => crearCotizacion(body),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: [QK_COTIZACIONES] });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useActualizarCotizacionMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCotizacion, body }) => actualizarCotizacion(idCotizacion, body),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: [QK_COTIZACIONES] });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useAnularCotizacionMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idCotizacion) => anularCotizacion(idCotizacion),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: [QK_COTIZACIONES] });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useConvertirCotizacionMutation(options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCotizacion, pagos, idCaja }) =>
      convertirCotizacion(idCotizacion, pagos, idCaja),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: [QK_COTIZACIONES] });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}
