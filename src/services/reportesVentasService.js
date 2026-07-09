import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import {
  unwrapProductosMasVendidos,
  unwrapVentasReportePaged,
} from "@/lib/reportesMappers";

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/** GET /api/Ventas — reporte paginado con filtros de fecha. */
export async function fetchReporteVentas({
  page = 1,
  pageSize = 20,
  fechaDesde,
  fechaHasta,
  idCaja,
  idUsuario,
  idCliente,
  numeroTicket,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/Ventas${buildQuery({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        idCaja,
        idUsuario,
        idCliente,
        numeroTicket,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el reporte de ventas.");
    return { exito: true, ...unwrapVentasReportePaged(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver ventas (asigne VENTAS · Leer al rol)."
        )
      );
    }
    throw new Error(getApiErrorMessage(err, "No se pudo cargar el reporte de ventas."));
  }
}

const RENDIMIENTO_PAGE_SIZE = 200;
const RENDIMIENTO_MAX_PAGES = 5;

/**
 * Carga ventas del período (hasta ~1000) para métricas de rendimiento.
 * Si hay más páginas, las pide en paralelo (tope de seguridad).
 */
/**
 * Carga ventas del período (hasta ~1000) para métricas de reportes.
 * Si hay más páginas, las pide en paralelo (tope de seguridad).
 */
export async function fetchVentasParaMetricas({
  fechaDesde,
  fechaHasta,
  idUsuario,
  numeroTicket,
} = {}) {
  const first = await fetchReporteVentas({
    page: 1,
    pageSize: RENDIMIENTO_PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    idUsuario,
    numeroTicket,
  });

  const totalPages = Math.min(
    Math.max(1, Number(first.totalPages) || 1),
    RENDIMIENTO_MAX_PAGES
  );

  if (totalPages <= 1) {
    return {
      exito: true,
      items: first.items ?? [],
      totalCount: first.totalCount ?? (first.items?.length ?? 0),
      truncated: (first.totalPages || 1) > RENDIMIENTO_MAX_PAGES,
    };
  }

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetchReporteVentas({
        page: i + 2,
        pageSize: RENDIMIENTO_PAGE_SIZE,
        fechaDesde,
        fechaHasta,
        idUsuario,
        numeroTicket,
      })
    )
  );

  const items = [
    ...(first.items ?? []),
    ...rest.flatMap((r) => r.items ?? []),
  ];

  return {
    exito: true,
    items,
    totalCount: first.totalCount ?? items.length,
    truncated: (first.totalPages || 1) > RENDIMIENTO_MAX_PAGES,
  };
}

/** @deprecated Preferir fetchVentasParaMetricas */
export async function fetchVentasParaRendimiento(params) {
  return fetchVentasParaMetricas(params);
}

/**
 * GET /api/reportes/ventas/productos-mas-vendidos
 * Ranking agregado en backend (por variante o producto).
 */
export async function fetchProductosMasVendidos({
  fechaDesde,
  fechaHasta,
  agruparPor = "variante",
  orden = "cantidad",
  top = 20,
  tipoVenta,
  idUsuario,
  idCaja,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/ventas/productos-mas-vendidos${buildQuery({
        fechaDesde,
        fechaHasta,
        agruparPor,
        orden,
        top,
        tipoVenta: tipoVenta && tipoVenta !== "TODAS" ? tipoVenta : undefined,
        idUsuario,
        idCaja,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el ranking de productos.");
    return { exito: true, ...unwrapProductosMasVendidos(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver el ranking de productos (VENTAS · Leer)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el ranking de productos más vendidos.")
    );
  }
}
