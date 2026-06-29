import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { mapVentaCreada, mapVentaTicket, unwrapVentaPaged, unwrapVentasResumenPaged } from "@/lib/ventaMappers";

/**
 * Catálogo de variantes para POS.
 * GET /api/Ventas/catalogo — requiere CAJAS·Leer o VENTAS·Leer (cualquiera).
 */
export async function fetchVentaCatalogo({ page = 1, pageSize = 8, criterio } = {}) {
  const params = { page, pageSize };
  const q = String(criterio ?? "").trim();
  if (q) params.criterio = q;

  try {
    const { data } = await apiClient.get("/api/Ventas/catalogo", { params });
    throwIfEnvelopeFailed(data, "No se pudo cargar el catálogo de venta.");
    return unwrapVentaPaged(data);
  } catch (err) {
    if (err.response?.status === 403) {
      const msg = getApiErrorMessage(
        err,
        "Sin permiso para ver el catálogo (asigne CAJAS · Leer al rol del cajero)."
      );
      throw new Error(msg);
    }
    throw err;
  }
}

/** POST /api/Ventas — requiere CAJAS·Actualizar o VENTAS·Crear (cualquiera). */
export async function crearVenta(body) {
  try {
    const { data } = await apiClient.post("/api/Ventas", body);
    throwIfEnvelopeFailed(data, "No se pudo registrar la venta.");
    return {
      exito: true,
      mensaje: pickMensaje(data),
      data: mapVentaCreada(data),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para cobrar (asigne CAJAS · Actualizar al rol del cajero)."
        )
      );
    }
    throw err;
  }
}

/** GET /api/Ventas — listado paginado (requiere VENTAS · Leer). */
export async function fetchVentas({
  page = 1,
  pageSize = 10,
  idCaja,
  idUsuario,
  idCliente,
  numeroTicket,
  fechaDesde,
  fechaHasta,
} = {}) {
  const params = { page, pageSize };
  if (idCaja != null) params.idCaja = idCaja;
  if (idUsuario != null) params.idUsuario = idUsuario;
  if (idCliente != null) params.idCliente = idCliente;
  if (numeroTicket?.trim()) params.numeroTicket = numeroTicket.trim();
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  try {
    const { data } = await apiClient.get("/api/Ventas", { params });
    throwIfEnvelopeFailed(data, "No se pudo cargar el historial de ventas.");
    return unwrapVentasResumenPaged(data);
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver ventas (asigne VENTAS · Leer al rol del cajero)."
        )
      );
    }
    throw err;
  }
}

/** GET /api/Ventas/{idVenta}/ticket */
export async function fetchVentaTicket(idVenta, { idCaja } = {}) {
  const params = {};
  const caja = Number(idCaja);
  if (Number.isFinite(caja) && caja > 0) params.idCaja = caja;

  try {
    const { data } = await apiClient.get(`/api/Ventas/${idVenta}/ticket`, { params });
    throwIfEnvelopeFailed(data, "No se pudo cargar el ticket.");
    return {
      exito: true,
      mensaje: pickMensaje(data),
      data: mapVentaTicket(data),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver el ticket (asigne CAJAS · Leer al rol del cajero)."
        )
      );
    }
    throw err;
  }
}

function pickMensaje(data) {
  if (!data || typeof data !== "object") return "";
  return data.mensaje || data.Mensaje || "";
}
