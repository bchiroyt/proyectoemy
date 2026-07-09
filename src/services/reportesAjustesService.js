import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { unwrapAjustesResumenPeriodo } from "@/lib/reportesMappers";

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
 * GET /api/reportes/ajustes/resumen-periodo
 * KPIs + flujo diario + por tipo + top productos.
 */
export async function fetchReporteAjustesResumenPeriodo({
  fechaDesde,
  fechaHasta,
  idUsuario,
  idTipoAjuste,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/ajustes/resumen-periodo${buildQuery({
        fechaDesde,
        fechaHasta,
        idUsuario,
        idTipoAjuste,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el resumen de ajustes del período.");
    return { exito: true, ...unwrapAjustesResumenPeriodo(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de ajustes (asigne PRODUCTOS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el resumen de ajustes del período.")
    );
  }
}
