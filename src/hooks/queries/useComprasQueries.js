import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarCompra,
  actualizarDetalleCompra,
  agregarDetalleCompra,
  anularCompra,
  crearCompra,
  eliminarDetalleCompra,
  fetchCompraPorId,
  fetchCompras,
} from "@/services/comprasService";
import { buscarVariantesCompra } from "@/services/productosService";
import { fetchProveedores } from "@/services/proveedoresService";

function unwrapPaged(resp) {
  const inner = resp?.data ?? resp?.Data;
  const items = inner?.items ?? inner?.Items ?? [];
  const page = inner?.page ?? inner?.Page ?? 1;
  const pageSize = inner?.pageSize ?? inner?.PageSize ?? 10;
  const totalRecords = inner?.totalRecords ?? inner?.TotalRecords ?? 0;
  const totalPages = inner?.totalPages ?? inner?.TotalPages ?? 1;
  return { items, page, pageSize, totalRecords, totalPages };
}

export function useComprasListQuery({ page, pageSize, numeroOrden, estadoCompra }) {
  return useQuery({
    queryKey: ["compras", "lista", { page, pageSize, numeroOrden, estadoCompra }],
    queryFn: async () => {
      const raw = await fetchCompras({ page, pageSize, numeroOrden, estadoCompra });
      if (raw && raw.exito === false) {
        throw new Error(raw.mensaje || raw.Mensaje || "Error al cargar compras");
      }
      return unwrapPaged(raw);
    },
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
      return raw?.data ?? raw?.Data ?? [];
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
