import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import {
  unwrapCatalogoResumen,
  unwrapCatalogoVariantesPaged,
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

/**
 * GET /api/reportes/catalogo/resumen
 * KPIs de surtido + por categoría/marca + rangos de precio.
 */
export async function fetchReporteCatalogoResumen() {
  try {
    const { data } = await apiClient.get("/api/reportes/catalogo/resumen");
    throwIfEnvelopeFailed(data, "No se pudo cargar el resumen del catálogo.");
    return { exito: true, ...unwrapCatalogoResumen(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver reportes de catálogo (asigne PRODUCTOS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el resumen del catálogo.")
    );
  }
}

/**
 * GET /api/reportes/catalogo/variantes
 * Listado paginado por variante con filtros.
 */
export async function fetchReporteCatalogoVariantes({
  page = 1,
  pageSize = 20,
  criterio,
  idCategoria,
  idMarca,
  estado,
  soloSinPrecio,
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/reportes/catalogo/variantes${buildQuery({
        page,
        pageSize,
        criterio,
        idCategoria,
        idMarca,
        estado,
        soloSinPrecio,
      })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el catálogo de variantes.");
    return { exito: true, ...unwrapCatalogoVariantesPaged(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver el catálogo (asigne PRODUCTOS · Leer al rol)."
        )
      );
    }
    throw new Error(
      getApiErrorMessage(err, "No se pudo cargar el catálogo de variantes.")
    );
  }
}
