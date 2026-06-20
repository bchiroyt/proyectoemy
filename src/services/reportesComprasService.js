import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapComprasReportePaged } from "@/lib/reportesMappers";

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
