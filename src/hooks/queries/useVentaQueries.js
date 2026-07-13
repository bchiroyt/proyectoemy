import { useMutation, useQuery } from "@tanstack/react-query";
import { crearVenta, fetchVentaCatalogo, fetchVentaTicket } from "@/services/ventaService";
import { fetchHistorialTransacciones } from "@/services/historialTransaccionesService";
import { obtenerCategorias } from "@/services/categorias";
import { slugCategoria } from "@/lib/ventaMappers";

export const QK_VENTA_CATALOGO = "ventas";
export const QK_VENTA_CATEGORIAS = "ventas-categorias";
export const QK_VENTAS_HISTORIAL = "ventas-historial";

export function useVentaCatalogoQuery(
  { page = 1, pageSize = 20, criterio } = {},
  options = {}
) {
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  return useQuery({
    queryKey: [QK_VENTA_CATALOGO, "catalogo", { page, pageSize, criterio: criterioNorm }],
    queryFn: () => fetchVentaCatalogo({ page, pageSize, criterio: criterioNorm }),
    ...options,
  });
}

/** Categorías activas del inventario para filtros del POS. */
export function useVentaCategoriasQuery(options = {}) {
  return useQuery({
    queryKey: [QK_VENTA_CATEGORIAS],
    queryFn: async () => {
      const data = await obtenerCategorias({ Activo: true, Page: 1, PageSize: 500 });
      const items = data?.items ?? data?.Items ?? [];
      const seen = new Map();
      for (const raw of items) {
        const label = String(raw?.nombre ?? raw?.Nombre ?? "").trim();
        if (!label) continue;
        const idNum = raw?.idCategoria ?? raw?.IdCategoria;
        const id =
          idNum != null && idNum !== ""
            ? String(idNum)
            : slugCategoria(label);
        if (!seen.has(id)) seen.set(id, { id, label });
      }
      return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
    },
    staleTime: 60_000,
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
  const { idCaja, enabled, ...rest } = options;
  const idCajaNorm = idCaja != null ? Number(idCaja) : undefined;
  return useQuery({
    queryKey: [QK_VENTA_CATALOGO, "ticket", id, { idCaja: idCajaNorm }],
    queryFn: () => fetchVentaTicket(id, { idCaja: idCajaNorm }),
    enabled: Number.isFinite(id) && id > 0 && (enabled ?? true),
    retry: 1,
    ...rest,
  });
}

export function useVentasHistorialQuery(
  { page = 1, pageSize = 10, idCaja } = {},
  options = {}
) {
  const idCajaNorm = idCaja != null ? Number(idCaja) : undefined;
  return useQuery({
    queryKey: [QK_VENTAS_HISTORIAL, { page, pageSize, idCaja: idCajaNorm }],
    queryFn: () =>
      fetchHistorialTransacciones({
        page,
        pageSize,
        idCaja: idCajaNorm,
      }),
    staleTime: 15_000,
    ...options,
  });
}
