import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

export function unwrapAjustesEnvelope(resp) {
  if (!resp || typeof resp !== "object") return { exito: false, mensaje: "", data: null };
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const data = pick(resp, "data", "Data");
  return { exito, mensaje, data };
}

export function mapAjusteDetalle(raw) {
  if (!raw) return null;
  return {
    idAjusteDetalle: toNumberOrNull(pick(raw, "idAjusteDetalle", "IdAjusteDetalle")),
    idAjuste: toNumberOrNull(pick(raw, "idAjuste", "IdAjuste")),
    idTipoAjuste: toNumberOrNull(pick(raw, "idTipoAjuste", "IdTipoAjuste")),
    tipoAjusteNombre: pick(raw, "tipoAjusteNombre", "TipoAjusteNombre") ?? "",
    tipoAjusteNaturaleza: pick(raw, "tipoAjusteNaturaleza", "TipoAjusteNaturaleza") ?? "",
    idVariante: toNumberOrNull(pick(raw, "idVariante", "IdVariante")),
    varianteSku: pick(raw, "varianteSku", "VarianteSku") ?? "",
    productoNombre: pick(raw, "productoNombre", "ProductoNombre") ?? "",
    idUbicacion: toNumberOrNull(pick(raw, "idUbicacion", "IdUbicacion")),
    ubicacionNombre: pick(raw, "ubicacionNombre", "UbicacionNombre") ?? "",
    stockSistema: Number(pick(raw, "stockSistema", "StockSistema") ?? 0),
    cantidadAjuste: Number(pick(raw, "cantidadAjuste", "CantidadAjuste") ?? 0),
    stockProyectado: Number(pick(raw, "stockProyectado", "StockProyectado") ?? 0),
    costoUnitario: toNumberOrNull(pick(raw, "costoUnitario", "CostoUnitario")),
    observacionDetalle: pick(raw, "observacionDetalle", "ObservacionDetalle") ?? "",
  };
}

export function mapAjuste(raw) {
  if (!raw) return null;
  const idAjuste = toNumberOrNull(pick(raw, "idAjuste", "IdAjuste"));
  if (idAjuste == null) return null;
  const detallesRaw = pick(raw, "detalles", "Detalles") ?? [];
  
  return {
    idAjuste,
    fechaAjuste: pick(raw, "fechaAjuste", "FechaAjuste"),
    observacion: pick(raw, "observacion", "Observacion") ?? "",
    idUsuario: toNumberOrNull(pick(raw, "idUsuario", "IdUsuario")),
    usuarioNombre: pick(raw, "usuarioNombre", "UsuarioNombre") ?? "",
    estado: Boolean(pick(raw, "estado", "Estado") ?? true),
    detalles: Array.isArray(detallesRaw)
      ? detallesRaw.map(mapAjusteDetalle).filter(Boolean)
      : [],
  };
}

export function unwrapAjustesPaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const itemsRaw = pick(inner, "items", "Items") ?? [];
  const items = unwrapList(itemsRaw).map(mapAjuste).filter(Boolean);
  const page = Number(pick(inner, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(inner, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount = Number(
    pick(inner, "totalCount", "TotalCount", "totalRecords", "TotalRecords") ?? items.length
  ) || 0;
  const totalPages = Number(pick(inner, "totalPages", "TotalPages") ?? 1) || 1;
  return { items, page, pageSize, totalCount, totalPages };
}
