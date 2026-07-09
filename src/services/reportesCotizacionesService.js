import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapCotizacionesResumenPeriodo } from "@/lib/reportesMappers";

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/**
 * GET /api/reportes/cotizaciones/resumen-periodo
 * KPIs + flujo diario + por estado + top clientes + top productos.
 */
export async function fetchReporteCotizacionesResumenPeriodo({
  fechaDesde,
  fechaHasta,
  estado,
  idUsuario,
  idCliente,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/cotizaciones/resumen-periodo${buildQuery({
        fechaDesde,
        fechaHasta,
        estado,
        idUsuario,
        idCliente,
      })}`
    );
    throwIfEnvelopeFailed(
      data,
      "No se pudo cargar el resumen de cotizaciones del período."
    );
    return { exito: true, ...unwrapCotizacionesResumenPeriodo(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de cotizaciones (asigne CAJAS · Leer o VENTAS · Leer)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(
        err,
        "No se pudo cargar el resumen de cotizaciones del período."
      )
    );
  }
}
