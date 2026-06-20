import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { pick, throwIfEnvelopeFailed, toNumberOrNull } from "@/lib/apiNormalizer";
import {
  buildCotizacionConvertirBody,
  mapCotizacion,
  mapCotizacionConvertida,
  mapCotizacionList,
} from "@/lib/cotizacionMappers";

function pickMensaje(data) {
  if (!data || typeof data !== "object") return "";
  return data.mensaje || data.Mensaje || "";
}

/** GET /api/Cotizaciones — cotizaciones pendientes */
export async function fetchCotizacionesPendientes() {
  try {
    const { data } = await apiClient.get("/api/Cotizaciones");
    throwIfEnvelopeFailed(data, "No se pudo cargar las cotizaciones.");
    const inner = pick(data, "data", "Data") ?? data;
    return {
      exito: true,
      mensaje: pickMensaje(data),
      items: mapCotizacionList(inner),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver cotizaciones (asigne CAJAS · Leer o VENTAS · Leer)."
        )
      );
    }
    throw err;
  }
}

/** GET /api/Cotizaciones/historial — todos los registros de mayoreo */
export async function fetchCotizacionesHistorial() {
  try {
    const { data } = await apiClient.get("/api/Cotizaciones/historial");
    throwIfEnvelopeFailed(data, "No se pudo cargar el historial de cotizaciones.");
    const inner = pick(data, "data", "Data") ?? data;
    return {
      exito: true,
      mensaje: pickMensaje(data),
      items: mapCotizacionList(inner),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para ver el historial (asigne CAJAS · Leer o VENTAS · Leer)."
        )
      );
    }
    throw err;
  }
}

/** GET /api/Cotizaciones/{id} */
export async function fetchCotizacionPorId(idCotizacion) {
  try {
    const { data } = await apiClient.get(`/api/Cotizaciones/${idCotizacion}`);
    throwIfEnvelopeFailed(data, "No se pudo cargar la cotización.");
    const inner = pick(data, "data", "Data") ?? data;
    return {
      exito: true,
      mensaje: pickMensaje(data),
      data: mapCotizacion(inner),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(err, "Sin permiso para ver la cotización.")
      );
    }
    throw err;
  }
}

/** POST /api/Cotizaciones — no descuenta inventario */
export async function crearCotizacion(body) {
  try {
    const { data } = await apiClient.post("/api/Cotizaciones", body);
    throwIfEnvelopeFailed(data, "No se pudo guardar la cotización.");
    const inner = pick(data, "data", "Data") ?? data;
    const idCotizacion = toNumberOrNull(inner) ?? toNumberOrNull(pick(inner, "idCotizacion", "IdCotizacion"));
    return {
      exito: true,
      mensaje: pickMensaje(data),
      idCotizacion,
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para crear cotizaciones (asigne CAJAS · Actualizar o VENTAS · Crear)."
        )
      );
    }
    throw new Error(getApiErrorMessage(err, "No se pudo guardar la cotización."));
  }
}

/** PUT /api/Cotizaciones/{id} — reemplaza detalles (solo PENDIENTE) */
export async function actualizarCotizacion(idCotizacion, body) {
  try {
    const { data } = await apiClient.put(`/api/Cotizaciones/${idCotizacion}`, body);
    throwIfEnvelopeFailed(data, "No se pudo actualizar la cotización.");
    return { exito: true, mensaje: pickMensaje(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para editar cotizaciones (asigne CAJAS · Actualizar o VENTAS · Actualizar)."
        )
      );
    }
    throw new Error(getApiErrorMessage(err, "No se pudo actualizar la cotización."));
  }
}

/** POST /api/Cotizaciones/{id}/anular */
export async function anularCotizacion(idCotizacion) {
  try {
    const { data } = await apiClient.post(`/api/Cotizaciones/${idCotizacion}/anular`);
    throwIfEnvelopeFailed(data, "No se pudo anular la cotización.");
    return { exito: true, mensaje: pickMensaje(data) };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(getApiErrorMessage(err, "Sin permiso para anular cotizaciones."));
    }
    throw new Error(getApiErrorMessage(err, "No se pudo anular la cotización."));
  }
}

/** POST /api/Cotizaciones/{id}/convertir — finaliza venta mayoreo (pago + inventario) */
export async function convertirCotizacion(idCotizacion, pagos, idCaja) {
  const body = buildCotizacionConvertirBody(pagos, idCaja);
  try {
    const { data } = await apiClient.post(`/api/Cotizaciones/${idCotizacion}/convertir`, body);
    throwIfEnvelopeFailed(data, "No se pudo finalizar la cotización.");
    return {
      exito: true,
      mensaje: pickMensaje(data),
      data: mapCotizacionConvertida(data),
    };
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error(
        getApiErrorMessage(
          err,
          "Sin permiso para finalizar cotizaciones (asigne CAJAS · Actualizar y VENTAS · Crear)."
        )
      );
    }
    throw new Error(getApiErrorMessage(err, "No se pudo finalizar la cotización."));
  }
}
