import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import {
  unwrapComprasReportePaged,
  unwrapComprasResumenPeriodo,
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

/** GET /api/Compras — reporte paginado con filtros de fecha. */
export async function fetchReporteCompras({
  page = 1,
  pageSize = 20,
  fechaDesde,
  fechaHasta,
  numeroOrden,
  estadoCompra,
  idProveedor,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/Compras${buildQuery({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        numeroOrden,
        estadoCompra,
        idProveedor,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el reporte de compras.");
    return { exito: true, ...unwrapComprasReportePaged(data) };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudo cargar el reporte de compras."));
  }
}

/**
 * GET /api/reportes/compras/resumen-periodo
 * KPIs + flujo diario + ranking proveedores + distribución por estado.
 */
export async function fetchReporteComprasResumenPeriodo({
  fechaDesde,
  fechaHasta,
  idProveedor,
  estadoCompra,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/compras/resumen-periodo${buildQuery({
        fechaDesde,
        fechaHasta,
        idProveedor,
        estadoCompra:
          estadoCompra && estadoCompra !== "TODAS" ? estadoCompra : undefined,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el resumen de compras del período.");
    return { exito: true, ...unwrapComprasResumenPeriodo(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de compras (asigne COMPRAS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el resumen de compras del período.")
    );
  }
}
