import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarCompra,
  actualizarDetalleCompra,
  agregarDetalleCompra,
  anularCompra,
  crearCompra,
  crearCompraDirecta,
  eliminarDetalleCompra,
  fetchCompraPorId,
  fetchCompras,
  finalizarCompra,
} from "@/services/comprasService";
import { buscarVariantesCompra } from "@/services/productosService";
import { fetchProveedores } from "@/services/proveedoresService";
import { pick } from "@/lib/apiNormalizer";
import {
  aplicarCriteriosBusquedaCompra,
  unwrapVariantesCompraBuscar,
} from "@/lib/compraVarianteUtils";

function unwrapPaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const items = pick(inner, "items", "Items") ?? [];
  const page = Number(pick(inner, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(inner, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount = Number(
    pick(inner, "totalCount", "TotalCount", "totalRecords", "TotalRecords") ?? 0
  ) || 0;
  const totalPages = Number(pick(inner, "totalPages", "TotalPages") ?? 1) || 1;
  return { items: Array.isArray(items) ? items : [], page, pageSize, totalCount, totalPages };
}

export function useComprasListQuery({ page = 1, pageSize = 10, search = "", estadoCompra, ...options } = {}) {
  return useQuery({
    queryKey: ["compras", "lista", { page, pageSize, search, estadoCompra }],
    queryFn: async () => {
      const raw = await fetchCompras({
        page,
        pageSize,
        numeroOrden: search || undefined,
        estadoCompra,
      });
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error al cargar compras");
      }
      return unwrapPaged(raw);
    },
    ...options,
  });
}

export function useCompraDetalleQuery(idCompra, options = {}) {
  const enabled = options.enabled !== false && Number(idCompra) > 0;
  return useQuery({
    queryKey: ["compras", "detalle", idCompra],
    queryFn: async () => {
      const raw = await fetchCompraPorId(idCompra);
      if (!raw?.exito && raw?.exito !== undefined && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Compra no encontrada");
      }
      return raw?.data ?? raw?.Data;
    },
    enabled,
  });
}

export function useProveedoresCompraQuery() {
  return useQuery({
    queryKey: ["proveedores", "compra-catalogo"],
    queryFn: async () => {
      const raw = await fetchProveedores({ page: 1, pageSize: 500 });
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error al cargar proveedores");
      }
      const { items } = unwrapPaged(raw);
      return items;
    },
    staleTime: 60_000,
  });
}

export function useVariantesBuscarQuery(criterio, options = {}) {
  const q = (criterio ?? "").trim();
  return useQuery({
    queryKey: ["productos", "variantes-buscar", q],
    queryFn: async () => {
      const raw = await buscarVariantesCompra(q);
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error en búsqueda");
      }
      return unwrapVariantesCompraBuscar(raw);
    },
    enabled: Boolean(options.enabled && q.length >= 1),
  });
}

export function useVariantesCompraBuscarQuery(criterio, options = {}) {
  const q = (criterio ?? "").trim();
  return useQuery({
    queryKey: ["productos", "variantes-buscar", "compra", q],
    queryFn: async () => {
      const raw = await buscarVariantesCompra(q);
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error en bÃºsqueda");
      }
      return aplicarCriteriosBusquedaCompra(unwrapVariantesCompraBuscar(raw), q);
    },
    enabled: Boolean(options.enabled && q.length >= 1),
  });
}

export function useCrearCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearCompra,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useCrearCompraDirectaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearCompraDirecta,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useFinalizarCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, body }) => finalizarCompra(idCompra, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useAnularCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: anularCompra,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useActualizarCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, body }) => actualizarCompra(idCompra, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useAgregarDetalleCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, body }) => agregarDetalleCompra(idCompra, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useActualizarDetalleCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, idDetalleCompra, body }) =>
      actualizarDetalleCompra(idCompra, idDetalleCompra, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useEliminarDetalleCompraMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, idDetalleCompra }) => eliminarDetalleCompra(idCompra, idDetalleCompra),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}
