import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapReembolsosResumenPeriodo } from "@/lib/reportesMappers";

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
 * GET /api/reportes/reembolsos/resumen-periodo
 * KPIs + flujo diario + por motivo + top productos + por cajero.
 */
export async function fetchReporteReembolsosResumenPeriodo({
  fechaDesde,
  fechaHasta,
  idUsuario,
  idCaja,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/reembolsos/resumen-periodo${buildQuery({
        fechaDesde,
        fechaHasta,
        idUsuario,
        idCaja,
      })}`
    );
    throwIfEnvelopeFailed(
      data,
      "No se pudo cargar el resumen de reembolsos del período."
    );
    return { exito: true, ...unwrapReembolsosResumenPeriodo(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de reembolsos (asigne VENTAS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(
        err,
        "No se pudo cargar el resumen de reembolsos del período."
      )
    );
  }
}
