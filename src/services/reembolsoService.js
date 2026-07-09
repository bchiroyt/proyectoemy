import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed, pick } from "@/lib/apiNormalizer";
import {
  mapReembolsoCatalogos,
  mapReembolsoPrevisualizacion,
  mapReembolsoPreparacion,
  mapReembolsoComprobante,
  unwrapReembolsoVentasDisponibles,
  unwrapReembolsosHistorialPaged,
} from "@/lib/reembolsoMappers";

export async function fetchReembolsoVentasDisponibles({
  page = 1,
  pageSize = 20,
  criterio,
  idCaja,
} = {}) {
  const params = { page, pageSize };
  const q = String(criterio ?? "").trim();
  if (q) params.criterio = q;
  if (idCaja) params.idCaja = idCaja;

  try {
    const { data } = await apiClient.get("/api/reembolsos/ventas-disponibles", { params });
    throwIfEnvelopeFailed(data, "No se pudieron cargar las ventas para reembolso.");
    return unwrapReembolsoVentasDisponibles(data);
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(err, "Sin permiso para consultar ventas de reembolso.")
      );
    }
    throw err;
  }
}

export async function fetchReembolsoPreparacion(idVenta) {
  const id = Number(idVenta);
  if (!Number.isFinite(id) || id <= 0) throw new Error("Id de venta inválido.");
  const { data } = await apiClient.get(`/api/reembolsos/ventas/${id}/preparacion`);
  throwIfEnvelopeFailed(data, "No se pudo preparar el reembolso.");
  return { exito: true, data: mapReembolsoPreparacion(data) };
}

export async function fetchReembolsoCatalogos() {
  const { data } = await apiClient.get("/api/reembolsos/catalogos");
  throwIfEnvelopeFailed(data, "No se pudieron cargar catálogos de reembolso.");
  return { exito: true, data: mapReembolsoCatalogos(data) };
}

function envelopePrevisualizacionReembolso(data) {
  return {
    exito: data?.exito ?? data?.Exito ?? false,
    mensaje: data?.mensaje ?? data?.Mensaje ?? "",
    data: mapReembolsoPrevisualizacion(data),
  };
}

export async function previsualizarReembolso(body) {
  try {
    const { data } = await apiClient.post("/api/reembolsos/previsualizar", body);
    return envelopePrevisualizacionReembolso(data);
  } catch (err) {
    const payload = err?.response?.data;
    if (payload && (payload.data != null || payload.Data != null)) {
      return envelopePrevisualizacionReembolso(payload);
    }
    throw err;
  }
}

export async function aplicarReembolso(body) {
  try {
    const { data } = await apiClient.post("/api/reembolsos", body);
    throwIfEnvelopeFailed(data, "No se pudo aplicar el reembolso.");
    return { exito: true, data: data?.data ?? data?.Data ?? null };
  } catch (err) {
    const payload = err?.response?.data;
    const nested = payload?.data ?? payload?.Data;
    if (nested && (nested.esValido === false || nested.EsValido === false)) {
      const mapped = mapReembolsoPrevisualizacion(payload);
      const errores = [
        ...mapped.errores,
        ...mapped.erroresLineas,
        ...mapped.erroresPagos,
      ];
      const msg =
        errores.length > 0
          ? errores.slice(0, 4).join(" · ")
          : payload?.mensaje ?? payload?.Mensaje ?? "No se pudo aplicar el reembolso.";
      throw new Error(msg);
    }
    throw err;
  }
}

/** GET /api/reembolsos — historial paginado de reembolsos aplicados. */
export async function fetchReembolsosHistorial({
  page = 1,
  pageSize = 10,
  idCaja,
  fechaDesde,
  fechaHasta,
  idUsuario,
  criterio,
} = {}) {
  const params = { page, pageSize };
  const q = String(criterio ?? "").trim();
  if (q) params.criterio = q;
  if (idCaja != null && idCaja !== "") params.idCaja = idCaja;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;
  if (idUsuario != null && idUsuario !== "") params.idUsuario = idUsuario;

  try {
    const { data } = await apiClient.get("/api/reembolsos", { params });
    throwIfEnvelopeFailed(data, "No se pudo cargar el historial de reembolsos.");
    return unwrapReembolsosHistorialPaged(data);
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(err, "Sin permiso para ver el historial de reembolsos.")
      );
    }
    throw err;
  }
}

/** GET /api/reembolsos/{idReembolso}/comprobante */
export async function fetchReembolsoComprobante(idReembolso, { idCaja } = {}) {
  const id = Number(idReembolso);
  if (!Number.isFinite(id) || id <= 0) throw new Error("Id de reembolso inválido.");

  const params = {};
  const caja = Number(idCaja);
  if (Number.isFinite(caja) && caja > 0) params.idCaja = caja;

  try {
    const { data } = await apiClient.get(`/api/reembolsos/${id}/comprobante`, { params });
    throwIfEnvelopeFailed(data, "No se pudo cargar el comprobante de reembolso.");
    return {
      exito: true,
      mensaje: pick(data, "mensaje", "Mensaje") ?? "",
      data: mapReembolsoComprobante(data),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(err, "Sin permiso para ver el comprobante de reembolso.")
      );
    }
    throw err;
  }
}
