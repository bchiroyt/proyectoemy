import { apiClient } from "@/lib/apiClient";
import { throwIfEnvelopeFailed, toNumberOrNull } from "@/lib/apiNormalizer";
import {
  unwrapAjustesEnvelope,
  unwrapAjustesPaged,
  mapAjuste,
} from "@/lib/ajustesMappers";

/**
 * GET /api/Ajustes/catalogos
 * Retorna ubicaciones y tipos de ajustes activos con mapeo defensivo de propiedades.
 */
export const fetchAjustesCatalogos = async () => {
  const { data } = await apiClient.get("/api/Ajustes/catalogos");
  throwIfEnvelopeFailed(data, "No se pudieron cargar los catálogos de ajustes.");
  const envelope = unwrapAjustesEnvelope(data);
  const rawData = envelope.data || {};
  const tiposAjusteRaw = rawData.tiposAjuste || rawData.TiposAjuste || [];
  const ubicacionesRaw = rawData.ubicaciones || rawData.Ubicaciones || [];

  return {
    ...envelope,
    data: {
      tiposAjuste: tiposAjusteRaw.map((t) => ({
        idTipoAjuste: toNumberOrNull(t.idTipoAjuste ?? t.IdTipoAjuste),
        codigo: t.codigo ?? t.Codigo ?? "",
        nombre: t.nombre ?? t.Nombre ?? "",
        naturaleza: t.naturaleza ?? t.Naturaleza ?? "",
        afectaFifo: Boolean(t.afectaFifo ?? t.AfectaFifo),
        requiereCostoUnitario: Boolean(t.requiereCostoUnitario ?? t.RequiereCostoUnitario),
      })),
      ubicaciones: ubicacionesRaw.map((u) => ({
        idUbicacion: toNumberOrNull(u.idUbicacion ?? u.IdUbicacion),
        nombre: u.nombre ?? u.Nombre ?? "",
        descripcion: u.descripcion ?? u.Descripcion ?? "",
      })),
    },
  };
};

/**
 * GET /api/Ajustes
 * Listado paginado del historial de ajustes.
 */
export const fetchAjustes = async ({
  page = 1,
  pageSize = 10,
  fechaDesde,
  fechaHasta,
  idUsuario,
  criterio,
} = {}) => {
  const params = { page, pageSize };
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;
  if (idUsuario != null) params.idUsuario = idUsuario;
  if (criterio?.trim()) params.criterio = criterio.trim();

  const { data } = await apiClient.get("/api/Ajustes", { params });
  throwIfEnvelopeFailed(data, "No se pudo cargar el historial de ajustes.");
  return unwrapAjustesPaged(data);
};

/**
 * GET /api/Ajustes/{idAjuste}
 * Retorna la cabecera y el detalle de un ajuste.
 */
export const fetchAjusteById = async (idAjuste) => {
  const { data } = await apiClient.get(`/api/Ajustes/${idAjuste}`);
  throwIfEnvelopeFailed(data, "No se pudo cargar el detalle del ajuste.");
  const envelope = unwrapAjustesEnvelope(data);
  return { ...envelope, data: mapAjuste(envelope.data) };
};

/**
 * POST /api/Ajustes
 * Registra un nuevo ajuste de inventario.
 */
export const crearAjuste = async (body) => {
  const { data } = await apiClient.post("/api/Ajustes", body);
  throwIfEnvelopeFailed(data, "No se pudo registrar el ajuste de inventario.");
  const envelope = unwrapAjustesEnvelope(data);
  return { ...envelope, data: mapAjuste(envelope.data) };
};
