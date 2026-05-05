import { apiClient } from "@/lib/apiClient";

/** @param {Record<string, string|number|undefined|null>} params */
function toQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/**
 * Lista compras paginadas.
 * @param {object} opts
 * @param {number} [opts.page]
 * @param {number} [opts.pageSize]
 * @param {string} [opts.numeroOrden] filtro parcial en número de orden
 * @param {string} [opts.estadoCompra] EN_PROCESO | CERRADA | ANULADA
 */
export async function fetchCompras({ page = 1, pageSize = 10, numeroOrden, estadoCompra } = {}) {
  const qs = toQuery({ page, pageSize, numeroOrden, estadoCompra });
  const { data } = await apiClient.get(`/api/Compras${qs}`);
  return data;
}

export async function fetchCompraPorId(idCompra) {
  const { data } = await apiClient.get(`/api/Compras/${idCompra}`);
  return data;
}

/**
 * @param {object} body — coincide con `CompraCrearRequest` del backend
 */
export async function crearCompra(body) {
  const { data } = await apiClient.post("/api/Compras", body);
  return data;
}

/**
 * @param {number|string} idCompra
 * @param {object} body — `CompraActualizarRequest`
 */
export async function actualizarCompra(idCompra, body) {
  const { data } = await apiClient.patch(`/api/Compras/${idCompra}`, body);
  return data;
}

export async function anularCompra(idCompra) {
  const { data } = await apiClient.delete(`/api/Compras/${idCompra}`);
  return data;
}

export async function agregarDetalleCompra(idCompra, body) {
  const { data } = await apiClient.post(`/api/Compras/${idCompra}/detalles`, body);
  return data;
}

export async function actualizarDetalleCompra(idCompra, idDetalleCompra, body) {
  const { data } = await apiClient.patch(`/api/Compras/${idCompra}/detalles/${idDetalleCompra}`, body);
  return data;
}

export async function eliminarDetalleCompra(idCompra, idDetalleCompra) {
  const { data } = await apiClient.delete(`/api/Compras/${idCompra}/detalles/${idDetalleCompra}`);
  return data;
}
