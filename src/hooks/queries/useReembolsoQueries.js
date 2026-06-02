import { useMutation, useQuery } from "@tanstack/react-query";
import {
  aplicarReembolso,
  fetchReembolsoCatalogos,
  fetchReembolsoPreparacion,
  fetchReembolsoVentasDisponibles,
  previsualizarReembolso,
} from "@/services/reembolsoService";

export const QK_REEMBOLSOS = "reembolsos";

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
