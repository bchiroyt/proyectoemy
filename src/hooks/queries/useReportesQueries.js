import { useMutation, useQuery } from "@tanstack/react-query";
import {
  exportarReporteInventario,
  fetchReporteInventario,
  fetchResumenInventario,
} from "@/services/reportesInventarioService";
import { fetchReporteVentas } from "@/services/reportesVentasService";
import {
  fetchReporteCajaMovimientos,
  fetchReporteCajaResumen,
} from "@/services/reportesCajaService";
import { fetchReporteCompras } from "@/services/reportesComprasService";

export const QK_REPORTE_INVENTARIO = ["reportes", "inventario"];
export const QK_REPORTE_INVENTARIO_RESUMEN = ["reportes", "inventario", "resumen"];
export const QK_REPORTE_VENTAS = ["reportes", "ventas"];
export const QK_REPORTE_COMPRAS = ["reportes", "compras"];
export const qkReporteCajaResumen = (idCaja) => ["reportes", "caja", idCaja, "resumen"];
export const qkReporteCajaMovimientos = (idCaja) => ["reportes", "caja", idCaja, "movimientos"];

export function useReporteInventarioQuery(filters = {}, options = {}) {
  const { page = 1, pageSize = 20, criterio, idProveedor, estadoStock = "TODOS" } = filters;
  return useQuery({
    queryKey: [...QK_REPORTE_INVENTARIO, { page, pageSize, criterio, idProveedor, estadoStock }],
    queryFn: () =>
      fetchReporteInventario({ page, pageSize, criterio, idProveedor, estadoStock }),
    ...options,
  });
}

export function useResumenInventarioQuery(filters = {}, options = {}) {
  const { criterio, idProveedor, estadoStock = "TODOS" } = filters;
  return useQuery({
    queryKey: [...QK_REPORTE_INVENTARIO_RESUMEN, { criterio, idProveedor, estadoStock }],
    queryFn: () => fetchResumenInventario({ criterio, idProveedor, estadoStock }),
    staleTime: 30_000,
    ...options,
  });
}

export function useExportarInventarioMutation() {
  return useMutation({
    mutationFn: exportarReporteInventario,
  });
}

export function useReporteVentasQuery(filters = {}, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    fechaDesde,
    fechaHasta,
    idCaja,
    idUsuario,
    idCliente,
    numeroTicket,
  } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_VENTAS,
      { page, pageSize, fechaDesde, fechaHasta, idCaja, idUsuario, idCliente, numeroTicket },
    ],
    queryFn: () =>
      fetchReporteVentas({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        idCaja,
        idUsuario,
        idCliente,
        numeroTicket,
      }),
    ...options,
  });
}

export function useReporteComprasQuery(filters = {}, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    fechaDesde,
    fechaHasta,
    numeroOrden,
    estadoCompra,
    idProveedor,
  } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_COMPRAS,
      { page, pageSize, fechaDesde, fechaHasta, numeroOrden, estadoCompra, idProveedor },
    ],
    queryFn: () =>
      fetchReporteCompras({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        numeroOrden,
        estadoCompra,
        idProveedor,
      }),
    ...options,
  });
}

export function useReporteCajaResumenQuery(idCaja, options = {}) {
  return useQuery({
    queryKey: qkReporteCajaResumen(idCaja),
    queryFn: () => fetchReporteCajaResumen(idCaja),
    enabled: Number(idCaja) > 0,
    staleTime: 10_000,
    ...options,
  });
}

export function useReporteCajaMovimientosQuery(idCaja, options = {}) {
  return useQuery({
    queryKey: qkReporteCajaMovimientos(idCaja),
    queryFn: () => fetchReporteCajaMovimientos(idCaja),
    enabled: Number(idCaja) > 0,
    staleTime: 10_000,
    ...options,
  });
}
