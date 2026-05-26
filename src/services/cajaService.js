import { apiClient } from "@/lib/apiClient";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import {
  mapCajaDetalle,
  mapCajasAbiertasList,
  mapDenominacionesList,
  mapMovimientosList,
  mapResumenCierre,
  unwrapCajaEnvelope,
} from "@/lib/cajaMappers";

export const fetchCajasAbiertas = async () => {
  const { data } = await apiClient.get("/api/Cajas/abiertas");
  throwIfEnvelopeFailed(data, "No se pudieron cargar las cajas abiertas.");
  return { ...unwrapCajaEnvelope(data), data: mapCajasAbiertasList(data) };
};

export const fetchMiCajaActiva = async () => {
  try {
    const { data } = await apiClient.get("/api/Cajas/mi-caja-activa");
    throwIfEnvelopeFailed(data);
    const envelope = unwrapCajaEnvelope(data);
    return {
      ...envelope,
      data: envelope.data ? mapCajaDetalle(envelope.data) : null,
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { exito: false, mensaje: "Sin caja activa.", data: null };
    }
    throw err;
  }
};

export const fetchCajaById = async (idCaja) => {
  const { data } = await apiClient.get(`/api/Cajas/${idCaja}`);
  throwIfEnvelopeFailed(data, "No se pudo cargar la caja.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapCajaDetalle(envelope.data) };
};

export const fetchCajaResumenCierre = async (idCaja) => {
  const { data } = await apiClient.get(`/api/Cajas/${idCaja}/resumen-cierre`);
  throwIfEnvelopeFailed(data, "No se pudo cargar el resumen de cierre.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapResumenCierre(envelope.data) };
};

export const abrirCaja = async (body) => {
  const { data } = await apiClient.post("/api/Cajas/apertura", body);
  throwIfEnvelopeFailed(data, "No se pudo abrir la caja.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapCajaDetalle(envelope.data) };
};

export const activarCaja = async (idCaja, body) => {
  const { data } = await apiClient.post(`/api/Cajas/${idCaja}/activar`, body);
  throwIfEnvelopeFailed(data, "No se pudo activar la caja.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapCajaDetalle(envelope.data) };
};

export const registrarMovimientoCaja = async (idCaja, body) => {
  const { data } = await apiClient.post(`/api/Cajas/${idCaja}/movimientos`, body);
  throwIfEnvelopeFailed(data, "No se pudo registrar el movimiento.");
  return unwrapCajaEnvelope(data);
};

export const cerrarCaja = async (idCaja, body) => {
  const { data } = await apiClient.post(`/api/Cajas/${idCaja}/cierre`, body);
  throwIfEnvelopeFailed(data, "No se pudo cerrar la caja.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapCajaDetalle(envelope.data) };
};

export const anularCaja = async (idCaja, body) => {
  const { data } = await apiClient.post(`/api/Cajas/${idCaja}/anular`, body);
  throwIfEnvelopeFailed(data, "No se pudo anular la caja.");
  const envelope = unwrapCajaEnvelope(data);
  return { ...envelope, data: mapCajaDetalle(envelope.data) };
};

export const registrarArqueoParcial = async (idCaja, body) => {
  const { data } = await apiClient.post(`/api/Cajas/${idCaja}/arqueos/parcial`, body);
  throwIfEnvelopeFailed(data, "No se pudo registrar el arqueo parcial.");
  return unwrapCajaEnvelope(data);
};

export const fetchMovimientosCaja = async (idCaja) => {
  const { data } = await apiClient.get(`/api/Cajas/${idCaja}/movimientos`);
  throwIfEnvelopeFailed(data, "No se pudieron cargar los movimientos.");
  return { ...unwrapCajaEnvelope(data), data: mapMovimientosList(data) };
};

export const fetchDenominacionesActivas = async () => {
  const { data } = await apiClient.get("/api/Denominaciones");
  throwIfEnvelopeFailed(data, "No se pudieron cargar las denominaciones.");
  return { ...unwrapCajaEnvelope(data), data: mapDenominacionesList(data) };
};
