import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

export function unwrapCajaEnvelope(resp) {
  if (!resp || typeof resp !== "object") return { exito: false, mensaje: "", data: null };
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const data = pick(resp, "data", "Data");
  return { exito, mensaje, data };
}

export function mapDenominacion(raw) {
  if (!raw) return null;
  const id = toNumberOrNull(pick(raw, "idDenominacion", "IdDenominacion"));
  if (id == null) return null;
  return {
    idDenominacion: id,
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    valor: Number(pick(raw, "valor", "Valor") ?? 0),
    tipo: String(pick(raw, "tipo", "Tipo") ?? "").toUpperCase(),
  };
}

export function mapDenominacionesList(payload) {
  return unwrapList(payload).map(mapDenominacion).filter(Boolean);
}

export function mapCajaAbierta(raw) {
  if (!raw) return null;
  const idCaja = toNumberOrNull(pick(raw, "idCaja", "IdCaja"));
  if (idCaja == null) return null;
  return {
    idCaja,
    fechaApertura: pick(raw, "fechaApertura", "FechaApertura"),
    montoApertura: Number(pick(raw, "montoApertura", "MontoApertura") ?? 0),
    estado: pick(raw, "estado", "Estado") ?? "",
    idUsuarioApertura: toNumberOrNull(pick(raw, "idUsuarioApertura", "IdUsuarioApertura")),
    usuarioResponsableNombre:
      pick(raw, "usuarioResponsableNombre", "UsuarioResponsableNombre") ?? "",
    esActiva: Boolean(pick(raw, "esActiva", "EsActiva")),
    puedeIngresar: Boolean(pick(raw, "puedeIngresar", "PuedeIngresar")),
    puedeCerrar: Boolean(pick(raw, "puedeCerrar", "PuedeCerrar")),
  };
}

export function mapCajasAbiertasList(payload) {
  const { data } = unwrapCajaEnvelope(payload);
  const list = Array.isArray(data) ? data : unwrapList(payload);
  return list.map(mapCajaAbierta).filter(Boolean);
}

export function mapArqueoDetalle(raw) {
  if (!raw) return null;
  return {
    idArqueoDetalle: toNumberOrNull(pick(raw, "idArqueoDetalle", "IdArqueoDetalle")),
    idDenominacion: toNumberOrNull(pick(raw, "idDenominacion", "IdDenominacion")),
    denominacionNombre: pick(raw, "denominacionNombre", "DenominacionNombre") ?? "",
    valor: Number(pick(raw, "valor", "Valor") ?? 0),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
    subtotal: Number(pick(raw, "subtotal", "Subtotal") ?? 0),
  };
}

export function mapArqueo(raw) {
  if (!raw) return null;
  const detallesRaw = pick(raw, "detalles", "Detalles") ?? [];
  return {
    idArqueo: toNumberOrNull(pick(raw, "idArqueo", "IdArqueo")),
    tipo: pick(raw, "tipo", "Tipo") ?? "",
    fechaArqueo: pick(raw, "fechaArqueo", "FechaArqueo"),
    totalCalculado: Number(pick(raw, "totalCalculado", "TotalCalculado") ?? 0),
    observacion: pick(raw, "observacion", "Observacion"),
    usuarioNombre: pick(raw, "usuarioNombre", "UsuarioNombre") ?? "",
    detalles: Array.isArray(detallesRaw)
      ? detallesRaw.map(mapArqueoDetalle).filter(Boolean)
      : [],
  };
}

export function mapCajaDetalle(raw) {
  if (!raw) return null;
  const idCaja = toNumberOrNull(pick(raw, "idCaja", "IdCaja"));
  if (idCaja == null) return null;
  const arqueosRaw = pick(raw, "arqueos", "Arqueos") ?? [];
  return {
    idCaja,
    fechaApertura: pick(raw, "fechaApertura", "FechaApertura"),
    fechaCierre: pick(raw, "fechaCierre", "FechaCierre"),
    montoApertura: Number(pick(raw, "montoApertura", "MontoApertura") ?? 0),
    montoCierreEsperado: pick(raw, "montoCierreEsperado", "MontoCierreEsperado"),
    montoCierreReal: pick(raw, "montoCierreReal", "MontoCierreReal"),
    diferencia: pick(raw, "diferencia", "Diferencia"),
    estado: pick(raw, "estado", "Estado") ?? "",
    observacion: pick(raw, "observacion", "Observacion"),
    idUsuarioApertura: toNumberOrNull(pick(raw, "idUsuarioApertura", "IdUsuarioApertura")),
    usuarioAperturaNombre: pick(raw, "usuarioAperturaNombre", "UsuarioAperturaNombre") ?? "",
    idUsuarioCierre: toNumberOrNull(pick(raw, "idUsuarioCierre", "IdUsuarioCierre")),
    usuarioCierreNombre: pick(raw, "usuarioCierreNombre", "UsuarioCierreNombre"),
    esActiva: Boolean(pick(raw, "esActiva", "EsActiva")),
    puedeIngresar: Boolean(pick(raw, "puedeIngresar", "PuedeIngresar")),
    puedeCerrar: Boolean(pick(raw, "puedeCerrar", "PuedeCerrar")),
    arqueos: Array.isArray(arqueosRaw) ? arqueosRaw.map(mapArqueo).filter(Boolean) : [],
  };
}

export function mapResumenCierre(raw) {
  if (!raw) return null;
  return {
    idCaja: toNumberOrNull(pick(raw, "idCaja", "IdCaja")),
    estado: pick(raw, "estado", "Estado") ?? "",
    fechaApertura: pick(raw, "fechaApertura", "FechaApertura"),
    fechaCierre: pick(raw, "fechaCierre", "FechaCierre"),
    montoApertura: Number(pick(raw, "montoApertura", "MontoApertura") ?? 0),
    totalEntradasManual: Number(pick(raw, "totalEntradasManual", "TotalEntradasManual") ?? 0),
    totalSalidasManual: Number(pick(raw, "totalSalidasManual", "TotalSalidasManual") ?? 0),
    montoEsperado: Number(pick(raw, "montoEsperado", "MontoEsperado") ?? 0),
    montoReal: pick(raw, "montoReal", "MontoCierreReal", "MontoReal"),
    diferencia: pick(raw, "diferencia", "Diferencia"),
  };
}

export function mapMovimientoCaja(raw) {
  if (!raw) return null;
  const id = toNumberOrNull(pick(raw, "idMovimientoCaja", "IdMovimientoCaja"));
  if (id == null) return null;
  return {
    idMovimientoCaja: id,
    idCaja: toNumberOrNull(pick(raw, "idCaja", "IdCaja")),
    idTipoMovimientoCaja: toNumberOrNull(
      pick(raw, "idTipoMovimientoCaja", "IdTipoMovimientoCaja")
    ),
    tipoMovimientoNombre: pick(raw, "tipoMovimientoNombre", "TipoMovimientoNombre") ?? "",
    naturaleza: pick(raw, "naturaleza", "Naturaleza") ?? "",
    fechaMovimiento: pick(raw, "fechaMovimiento", "FechaMovimiento"),
    monto: Number(pick(raw, "monto", "Monto") ?? 0),
    motivo: pick(raw, "motivo", "Motivo"),
    referenciaExterna: pick(raw, "referenciaExterna", "ReferenciaExterna"),
    observacion: pick(raw, "observacion", "Observacion"),
    usuarioNombre: pick(raw, "usuarioNombre", "UsuarioNombre") ?? "",
  };
}

export function mapMovimientosList(payload) {
  const { data } = unwrapCajaEnvelope(payload);
  const list = Array.isArray(data) ? data : unwrapList(payload);
  return list.map(mapMovimientoCaja).filter(Boolean);
}

/** Arma detalles para apertura/cierre desde cantidades por idDenominacion */
export function buildDetallesArqueo(cantidades, denominaciones) {
  return denominaciones
    .filter((d) => (cantidades[d.idDenominacion] ?? 0) > 0)
    .map((d) => ({
      idDenominacion: d.idDenominacion,
      cantidad: cantidades[d.idDenominacion],
    }));
}

/** Solo billetes (apertura: monedas van en totalMonedas) */
export function buildDetallesApertura(cantidades, denominaciones) {
  return buildDetallesArqueo(cantidades, denominaciones);
}

export function calcularTotalArqueo(cantidades, denominaciones) {
  return denominaciones.reduce((acc, d) => {
    const qty = cantidades[d.idDenominacion] ?? 0;
    return acc + d.valor * qty;
  }, 0);
}

export const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);
