import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import {
  downloadArchivoBase64,
  mapNivelStockResumen,
  unwrapInventarioReporte,
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

/** GET /api/niveles-stock */
export async function fetchReporteInventario({
  page = 1,
  pageSize = 20,
  criterio,
  idProveedor,
  estadoStock = "TODOS",
} = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/niveles-stock${buildQuery({ page, pageSize, criterio, idProveedor, estadoStock })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el reporte de inventario.");
    return { exito: true, ...unwrapInventarioReporte(data) };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudo cargar el reporte de inventario."));
  }
}

/** GET /api/niveles-stock/resumen */
export async function fetchResumenInventario({ criterio, idProveedor, estadoStock = "TODOS" } = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/niveles-stock/resumen${buildQuery({ criterio, idProveedor, estadoStock })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo cargar el resumen de inventario.");
    const inner = data?.data ?? data?.Data ?? data;
    return { exito: true, resumen: mapNivelStockResumen(inner) };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudo cargar el resumen de inventario."));
  }
}

/** GET /api/niveles-stock/exportar */
export async function exportarReporteInventario({ criterio, idProveedor, estadoStock = "TODOS" } = {}) {
  try {
    const { data } = await apiClient.get(
      `/api/niveles-stock/exportar${buildQuery({ criterio, idProveedor, estadoStock })}`
    );
    throwIfEnvelopeFailed(data, "No se pudo exportar el reporte de inventario.");
    const inner = data?.data ?? data?.Data ?? {};
    downloadArchivoBase64({
      contenidoBase64: inner.contenidoBase64 ?? inner.ContenidoBase64,
      nombreArchivo: inner.nombreArchivo ?? inner.NombreArchivo ?? "niveles-stock.csv",
      contentType: inner.contentType ?? inner.ContentType ?? "text/csv",
    });
    return { exito: true, mensaje: data?.mensaje ?? data?.Mensaje ?? "Exportación completada." };
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "No se pudo exportar el reporte de inventario."));
  }
}
