import { useMutation, useQuery } from "@tanstack/react-query";
import {
  aplicarReembolso,
  fetchReembolsoCatalogos,
  fetchReembolsoPreparacion,
  fetchReembolsoComprobante,
  fetchReembolsoVentasDisponibles,
  previsualizarReembolso,
  fetchReembolsosHistorial,
} from "@/services/reembolsoService";

export const QK_REEMBOLSOS = "reembolsos";

export function useReembolsosHistorialQuery(
  {
    page = 1,
    pageSize = 20,
    criterio,
    idCaja,
    fechaDesde,
    fechaHasta,
    idUsuario,
  } = {},
  options = {}
) {
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  const idUsuarioNorm =
    idUsuario != null && idUsuario !== "" ? Number(idUsuario) : undefined;
  return useQuery({
    queryKey: [
      QK_REEMBOLSOS,
      "historial",
      {
        page,
        pageSize,
        criterio: criterioNorm,
        idCaja,
        fechaDesde,
        fechaHasta,
        idUsuario: idUsuarioNorm,
      },
    ],
    queryFn: () =>
      fetchReembolsosHistorial({
        page,
        pageSize,
        criterio: criterioNorm,
        idCaja,
        fechaDesde,
        fechaHasta,
        idUsuario: idUsuarioNorm,
      }),
    ...options,
  });
}

export function useReembolsoVentasDisponiblesQuery(
  { page = 1, pageSize = 20, criterio, idCaja } = {},
  options = {}
) {
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  return useQuery({
    queryKey: [QK_REEMBOLSOS, "ventas-disponibles", { page, pageSize, criterio: criterioNorm, idCaja }],
    queryFn: () =>
      fetchReembolsoVentasDisponibles({ page, pageSize, criterio: criterioNorm, idCaja }),
    ...options,
  });
}

export function useReembolsoPreparacionQuery(idVenta, options = {}) {
  const id = Number(idVenta);
  return useQuery({
    queryKey: [QK_REEMBOLSOS, "preparacion", id],
    queryFn: () => fetchReembolsoPreparacion(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: 1,
    ...options,
  });
}

export function useAplicarReembolsoMutation(options = {}) {
  return useMutation({
    mutationFn: (body) => aplicarReembolso(body),
    ...options,
  });
}

export function useReembolsoCatalogosQuery(options = {}) {
  return useQuery({
    queryKey: [QK_REEMBOLSOS, "catalogos"],
    queryFn: fetchReembolsoCatalogos,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function usePrevisualizarReembolsoMutation(options = {}) {
  return useMutation({
    mutationFn: (body) => previsualizarReembolso(body),
    ...options,
  });
}

export function useReembolsoComprobanteQuery(idReembolso, options = {}) {
  const id = Number(idReembolso);
  const { idCaja, enabled, ...rest } = options;
  const idCajaNorm = idCaja != null ? Number(idCaja) : undefined;
  return useQuery({
    queryKey: [QK_REEMBOLSOS, "comprobante", id, { idCaja: idCajaNorm }],
    queryFn: () => fetchReembolsoComprobante(id, { idCaja: idCajaNorm }),
    enabled: Number.isFinite(id) && id > 0 && (enabled ?? true),
    retry: 1,
    ...rest,
  });
}
