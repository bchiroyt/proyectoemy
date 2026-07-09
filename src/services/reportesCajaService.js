import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { fetchCajaResumenCierre, fetchMovimientosCaja } from "@/services/cajaService";
import {
  mapResumenCierreReporte,
  unwrapCajaResumenPeriodo,
  unwrapCajaSesionesReporte,
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

/** GET /api/Cajas/{id}/resumen-cierre — detalle de una sesión */
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

/**
 * GET /api/reportes/caja/sesiones
 * Historial paginado de turnos (abiertas / cerradas).
 */
export async function fetchReporteCajaSesiones({
  page = 1,
  pageSize = 15,
  fechaDesde,
  fechaHasta,
  estado,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/caja/sesiones${buildQuery({
        page,
        pageSize,
        fechaDesde,
        fechaHasta,
        estado: estado && estado !== "TODAS" ? estado : undefined,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el historial de sesiones de caja.");
    return { exito: true, ...unwrapCajaSesionesReporte(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de caja (asigne CAJAS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el historial de sesiones de caja.")
    );
  }
}

/**
 * GET /api/reportes/caja/resumen-periodo
 * KPIs del período + flujo diario para gráficas.
 */
export async function fetchReporteCajaResumenPeriodo({ fechaDesde, fechaHasta } = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/caja/resumen-periodo${buildQuery({ fechaDesde, fechaHasta })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el resumen de caja del período.");
    return { exito: true, ...unwrapCajaResumenPeriodo(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de caja (asigne CAJAS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el resumen de caja del período.")
    );
  }
}
