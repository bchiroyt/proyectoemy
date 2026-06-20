import { fetchCajaResumenCierre, fetchMovimientosCaja } from "@/services/cajaService";
import { getApiErrorMessage } from "@/lib/apiClient";
import { mapResumenCierreReporte } from "@/lib/reportesMappers";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";

/** GET /api/Cajas/{id}/resumen-cierre */
export async function fetchReporteCajaResumen(idCaja) {
  try {
    const result = await fetchCajaResumenCierre(idCaja);
    throwIfEnvelopeFailed(result, "No se pudo cargar el resumen de caja.");
    return {
      exito: true,
      resumen: mapResumenCierreReporte(result.data),
    };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudo cargar el resumen de caja."));
  }
}

/** GET /api/Cajas/{id}/movimientos */
export async function fetchReporteCajaMovimientos(idCaja) {
  try {
    const result = await fetchMovimientosCaja(idCaja);
    if (result?.exito === false) {
      throw new Error(result.mensaje || "No se pudieron cargar los movimientos de caja.");
    }
    return {
      exito: true,
      items: result?.data ?? [],
    };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudieron cargar los movimientos de caja."));
  }
}
