import { useQuery } from "@tanstack/react-query";
import { obtenerProductos, buscarVariantesCompra } from "@/services/productos";

export const QK_PRODUCTOS = "productos";

function unwrapProductosPaged(data) {
  const inner = data ?? {};
  return {
    items: inner.items ?? inner.Items ?? [],
    page: Number(inner.page ?? inner.Page ?? 1) || 1,
    pageSize: Number(inner.pageSize ?? inner.PageSize ?? 50) || 50,
    totalRecords:
      Number(
        inner.totalRecords ??
          inner.TotalRecords ??
          inner.totalCount ??
          inner.TotalCount ??
          0
      ) || 0,
    totalPages: Number(inner.totalPages ?? inner.TotalPages ?? 1) || 1,
  };
}

export function useProductosListQuery({ page = 1, pageSize = 50 } = {}, options = {}) {
  return useQuery({
    queryKey: [QK_PRODUCTOS, "lista", { page, pageSize }],
    queryFn: async () => {
      const data = await obtenerProductos({ Page: page, PageSize: pageSize });
      return unwrapProductosPaged(data);
    },
    ...options,
  });
}

export function useProductosBuscarQuery(criterio, options = {}) {
  const q = (criterio ?? "").trim();
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: [QK_PRODUCTOS, "buscar", q],
    queryFn: async () => {
      const raw = await buscarVariantesCompra(q);
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error en búsqueda");
      }
      const lista = raw?.data ?? raw?.Data ?? raw ?? [];
      return Array.isArray(lista) ? lista : [];
    },
    enabled: enabled && q.length >= 1,
    ...rest,
  });
}
