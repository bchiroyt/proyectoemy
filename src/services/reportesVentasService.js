import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapVentasReportePaged } from "@/lib/reportesMappers";

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
