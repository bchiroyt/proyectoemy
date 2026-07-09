import { useMutation, useQuery } from "@tanstack/react-query";
import {
  exportarReporteInventario,
  fetchInventarioValorizacion,
  fetchInventarioValorizacionVariantes,
  fetchReporteInventario,
  fetchResumenInventario,
} from "@/services/reportesInventarioService";
import {
  fetchProductosMasVendidos,
  fetchReporteVentas,
  fetchVentasParaMetricas,
} from "@/services/reportesVentasService";
import {
  fetchReporteCajaMovimientos,
  fetchReporteCajaResumen,
  fetchReporteCajaResumenPeriodo,
  fetchReporteCajaSesiones,
} from "@/services/reportesCajaService";
import {
  fetchReporteCompras,
  fetchReporteComprasResumenPeriodo,
} from "@/services/reportesComprasService";
import { fetchReporteAjustesResumenPeriodo } from "@/services/reportesAjustesService";
import { fetchReporteReembolsosResumenPeriodo } from "@/services/reportesReembolsosService";
import { fetchReporteCotizacionesResumenPeriodo } from "@/services/reportesCotizacionesService";
import {
  fetchReporteCatalogoResumen,
  fetchReporteCatalogoVariantes,
} from "@/services/reportesCatalogoService";

export const QK_REPORTE_INVENTARIO = ["reportes", "inventario"];
export const QK_REPORTE_INVENTARIO_RESUMEN = ["reportes", "inventario", "resumen"];
export const QK_REPORTE_INVENTARIO_VALORIZACION = ["reportes", "inventario", "valorizacion"];
export const QK_REPORTE_INVENTARIO_VALORIZACION_VARIANTES = [
  "reportes",
  "inventario",
  "valorizacion",
  "variantes",
];
export const QK_REPORTE_VENTAS = ["reportes", "ventas"];
export const QK_REPORTE_VENTAS_PERIODO = ["reportes", "ventas", "periodo"];
export const QK_REPORTE_PRODUCTOS_MAS_VENDIDOS = ["reportes", "ventas", "productos-mas-vendidos"];
export const QK_REPORTE_RENDIMIENTO = ["reportes", "rendimiento"];
export const QK_REPORTE_COMPRAS = ["reportes", "compras"];
export const QK_REPORTE_COMPRAS_RESUMEN_PERIODO = ["reportes", "compras", "resumen-periodo"];
export const QK_REPORTE_AJUSTES_RESUMEN_PERIODO = ["reportes", "ajustes", "resumen-periodo"];
export const QK_REPORTE_REEMBOLSOS_RESUMEN_PERIODO = ["reportes", "reembolsos", "resumen-periodo"];
export const QK_REPORTE_COTIZACIONES_RESUMEN_PERIODO = ["reportes", "cotizaciones", "resumen-periodo"];
export const QK_REPORTE_CATALOGO_RESUMEN = ["reportes", "catalogo", "resumen"];
export const QK_REPORTE_CATALOGO_VARIANTES = ["reportes", "catalogo", "variantes"];
export const QK_REPORTE_CAJA_SESIONES = ["reportes", "caja", "sesiones"];
export const QK_REPORTE_CAJA_RESUMEN_PERIODO = ["reportes", "caja", "resumen-periodo"];
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

/** Capital / valorización de inventario (FIFO + costo promedio). */
export function useInventarioValorizacionQuery(options = {}) {
  return useQuery({
    queryKey: QK_REPORTE_INVENTARIO_VALORIZACION,
    queryFn: fetchInventarioValorizacion,
    staleTime: 60_000,
    ...options,
  });
}

/** Listado paginado de variantes valorizadas. */
export function useInventarioValorizacionVariantesQuery(filters = {}, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    criterio,
    idCategoria,
    idMarca,
    soloSinCosto,
    soloConStock = true,
    ordenarPor = "valorCostoDesc",
  } = filters;
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_INVENTARIO_VALORIZACION_VARIANTES,
      {
        page,
        pageSize,
        criterio: criterioNorm,
        idCategoria,
        idMarca,
        soloSinCosto,
        soloConStock,
        ordenarPor,
      },
    ],
    queryFn: () =>
      fetchInventarioValorizacionVariantes({
        page,
        pageSize,
        criterio: criterioNorm,
        idCategoria,
        idMarca,
        soloSinCosto,
        soloConStock,
        ordenarPor,
      }),
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

/** Ventas del período (muestra amplia) para métricas y gráficas. */
export function useVentasPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta, idUsuario, numeroTicket } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_VENTAS_PERIODO,
      { fechaDesde, fechaHasta, idUsuario, numeroTicket },
    ],
    queryFn: () =>
      fetchVentasParaMetricas({
        fechaDesde,
        fechaHasta,
        idUsuario,
        numeroTicket,
      }),
    staleTime: 30_000,
    ...options,
  });
}

/** Alias: métricas de rendimiento por cajero. */
export function useRendimientoVentasQuery(filters = {}, options = {}) {
  return useVentasPeriodoQuery(filters, options);
}

/** Ranking de productos más vendidos (agregado en backend). */
export function useProductosMasVendidosQuery(filters = {}, options = {}) {
  const {
    fechaDesde,
    fechaHasta,
    agruparPor = "variante",
    orden = "cantidad",
    top = 20,
    tipoVenta,
    idUsuario,
    idCaja,
  } = filters;

  return useQuery({
    queryKey: [
      ...QK_REPORTE_PRODUCTOS_MAS_VENDIDOS,
      { fechaDesde, fechaHasta, agruparPor, orden, top, tipoVenta, idUsuario, idCaja },
    ],
    queryFn: () =>
      fetchProductosMasVendidos({
        fechaDesde,
        fechaHasta,
        agruparPor,
        orden,
        top,
        tipoVenta,
        idUsuario,
        idCaja,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
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

/** Resumen agregado del período de compras (KPIs + gráficas). */
export function useReporteComprasResumenPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta, idProveedor, estadoCompra } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_COMPRAS_RESUMEN_PERIODO,
      { fechaDesde, fechaHasta, idProveedor, estadoCompra },
    ],
    queryFn: () =>
      fetchReporteComprasResumenPeriodo({
        fechaDesde,
        fechaHasta,
        idProveedor,
        estadoCompra,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
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

/** Historial paginado de sesiones/turnos de caja. */
export function useReporteCajaSesionesQuery(filters = {}, options = {}) {
  const {
    page = 1,
    pageSize = 15,
    fechaDesde,
    fechaHasta,
    estado = "TODAS",
  } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_CAJA_SESIONES,
      { page, pageSize, fechaDesde, fechaHasta, estado },
    ],
    queryFn: () =>
      fetchReporteCajaSesiones({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        estado,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
    ...options,
  });
}

/** Resumen agregado del período + flujo diario. */
export function useReporteCajaResumenPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta } = filters;
  return useQuery({
    queryKey: [...QK_REPORTE_CAJA_RESUMEN_PERIODO, { fechaDesde, fechaHasta }],
    queryFn: () => fetchReporteCajaResumenPeriodo({ fechaDesde, fechaHasta }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
    ...options,
  });
}

/** Resumen agregado del período de ajustes/mermas. */
export function useReporteAjustesResumenPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta, idUsuario, idTipoAjuste } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_AJUSTES_RESUMEN_PERIODO,
      { fechaDesde, fechaHasta, idUsuario, idTipoAjuste },
    ],
    queryFn: () =>
      fetchReporteAjustesResumenPeriodo({
        fechaDesde,
        fechaHasta,
        idUsuario,
        idTipoAjuste,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
    ...options,
  });
}

/** Resumen agregado del período de reembolsos. */
export function useReporteReembolsosResumenPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta, idUsuario, idCaja } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_REEMBOLSOS_RESUMEN_PERIODO,
      { fechaDesde, fechaHasta, idUsuario, idCaja },
    ],
    queryFn: () =>
      fetchReporteReembolsosResumenPeriodo({
        fechaDesde,
        fechaHasta,
        idUsuario,
        idCaja,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
    ...options,
  });
}

/** Resumen agregado del período de cotizaciones (mayoreo). */
export function useReporteCotizacionesResumenPeriodoQuery(filters = {}, options = {}) {
  const { fechaDesde, fechaHasta, estado, idUsuario, idCliente } = filters;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_COTIZACIONES_RESUMEN_PERIODO,
      { fechaDesde, fechaHasta, estado, idUsuario, idCliente },
    ],
    queryFn: () =>
      fetchReporteCotizacionesResumenPeriodo({
        fechaDesde,
        fechaHasta,
        estado,
        idUsuario,
        idCliente,
      }),
    enabled: Boolean(fechaDesde && fechaHasta),
    staleTime: 30_000,
    ...options,
  });
}

/** Resumen analítico del surtido / catálogo de precios. */
export function useReporteCatalogoResumenQuery(options = {}) {
  return useQuery({
    queryKey: QK_REPORTE_CATALOGO_RESUMEN,
    queryFn: fetchReporteCatalogoResumen,
    staleTime: 60_000,
    ...options,
  });
}

/** Listado paginado de variantes del catálogo. */
export function useReporteCatalogoVariantesQuery(filters = {}, options = {}) {
  const {
    page = 1,
    pageSize = 20,
    criterio,
    idCategoria,
    idMarca,
    estado,
    soloSinPrecio,
  } = filters;
  const criterioNorm = String(criterio ?? "").trim() || undefined;
  const estadoNorm = String(estado ?? "").trim() || undefined;
  return useQuery({
    queryKey: [
      ...QK_REPORTE_CATALOGO_VARIANTES,
      {
        page,
        pageSize,
        criterio: criterioNorm,
        idCategoria,
        idMarca,
        estado: estadoNorm,
        soloSinPrecio,
      },
    ],
    queryFn: () =>
      fetchReporteCatalogoVariantes({
        page,
        pageSize,
        criterio: criterioNorm,
        idCategoria,
        idMarca,
        estado: estadoNorm,
        soloSinPrecio,
      }),
    staleTime: 30_000,
    ...options,
  });
}
