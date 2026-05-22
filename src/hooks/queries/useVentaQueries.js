import { useMutation, useQuery } from "@tanstack/react-query";
import { crearVenta, fetchVentaCatalogo, fetchVentaTicket } from "@/services/ventaService";

export const QK_VENTA_CATALOGO = "ventas";
export const QK_VENTA_CATEGORIAS = "ventas-categorias";

export function useVentaCatalogoQuery(
  { page = 1, pageSize = 8, criterio } = {},
  options = {}
) {
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  return useQuery({
    queryKey: [QK_VENTA_CATALOGO, "catalogo", { page, pageSize, criterio: criterioNorm }],
    queryFn: () => fetchVentaCatalogo({ page, pageSize, criterio: criterioNorm }),
    ...options,
  });
}

/** Lista de categorías distintas para filtros del POS (una sola carga, cache largo). */
export function useVentaCategoriasQuery(options = {}) {
  return useQuery({
    queryKey: [QK_VENTA_CATEGORIAS],
    queryFn: async () => {
      const { items } = await fetchVentaCatalogo({ page: 1, pageSize: 100 });
      const seen = new Map();
      for (const p of items) {
        const label = (p.categoria || "").trim();
        if (!label) continue;
        const id = p.categoriaSlug || label;
        if (!seen.has(id)) seen.set(id, { id, label });
      }
      return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCrearVentaMutation(options = {}) {
  return useMutation({
    mutationFn: (body) => crearVenta(body),
    ...options,
  });
}

export function useVentaTicketQuery(idVenta, options = {}) {
  const id = Number(idVenta);
  return useQuery({
    queryKey: [QK_VENTA_CATALOGO, "ticket", id],
    queryFn: () => fetchVentaTicket(id),
    enabled: Number.isFinite(id) && id > 0,
    retry: 1,
    ...options,
  });
}
