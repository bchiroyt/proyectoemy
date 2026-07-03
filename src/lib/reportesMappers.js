import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { mapCompraApiToListRow } from "@/lib/comprasMappers";
import { mapMovimientoCaja, mapResumenCierre } from "@/lib/cajaMappers";
import { mapVentaResumen } from "@/lib/ventaMappers";
import { normalizarAtributosAdicionales, pickNombreVariante } from "@/lib/varianteUtils";

export function mapNivelStockItem(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  if (idVariante == null) return null;
  return {
    idVariante,
    producto: pick(raw, "producto", "Producto") ?? "",
    sku: pick(raw, "sku", "Sku") ?? "",
    color: pick(raw, "color", "Color") ?? "",
    talla: pick(raw, "talla", "Talla") ?? "",
    nombreVariante: pickNombreVariante(raw) ?? "",
    atributosAdicionales: normalizarAtributosAdicionales(raw),
    categoria: pick(raw, "categoria", "Categoria") ?? "",
    marca: pick(raw, "marca", "Marca") ?? "",
    stockActual: Number(pick(raw, "stockActual", "StockActual") ?? 0),
    stockMinimo: pick(raw, "stockMinimo", "StockMinimo"),
    estadoStock: pick(raw, "estadoStock", "EstadoStock") ?? "",
    proveedor: pick(raw, "proveedor", "Proveedor") ?? "Sin proveedor",
    mensajeEstado: pick(raw, "mensajeEstado", "MensajeEstado") ?? "",
  };
}

export function mapNivelStockResumen(raw) {
  if (!raw) return null;
  return {
    totalVariantes: Number(pick(raw, "totalVariantes", "TotalVariantes") ?? 0),
    critico: Number(pick(raw, "critico", "Critico") ?? 0),
    advertencia: Number(pick(raw, "advertencia", "Advertencia") ?? 0),
    normal: Number(pick(raw, "normal", "Normal") ?? 0),
    sinPolitica: Number(pick(raw, "sinPolitica", "SinPolitica") ?? 0),
    stockNegativo: Number(pick(raw, "stockNegativo", "StockNegativo") ?? 0),
    sinProveedor: Number(pick(raw, "sinProveedor", "SinProveedor") ?? 0),
    advertencias: unwrapList(pick(raw, "advertencias", "Advertencias") ?? []),
  };
}

function unwrapPaged(inner) {
  const itemsRaw = pick(inner, "items", "Items") ?? inner;
  const items = unwrapList(itemsRaw);
  return {
    items,
    page: Number(pick(inner, "page", "Page") ?? 1) || 1,
    pageSize: Number(pick(inner, "pageSize", "PageSize") ?? 10) || 10,
    totalCount:
      Number(
        pick(inner, "totalCount", "TotalCount", "totalRecords", "TotalRecords") ?? 0
      ) || 0,
    totalPages: Number(pick(inner, "totalPages", "TotalPages") ?? 1) || 1,
  };
}

export function unwrapInventarioReporte(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resultados = pick(inner, "resultados", "Resultados") ?? inner;
  const paged = unwrapPaged(resultados);
  const resumenRaw = pick(inner, "resumen", "Resumen");
  return {
    items: paged.items.map(mapNivelStockItem).filter(Boolean),
    page: paged.page,
    pageSize: paged.pageSize,
    totalCount: paged.totalCount,
    totalPages: paged.totalPages,
    resumen: mapNivelStockResumen(resumenRaw),
    advertencias: unwrapList(pick(inner, "advertencias", "Advertencias") ?? []),
  };
}

export function mapVentaReporte(raw) {
  const base = mapVentaResumen(raw);
  if (!base) return null;
  return {
    ...base,
    tipoVenta: String(pick(raw, "tipoVenta", "TipoVenta") ?? "").trim(),
    clienteNombre: pick(raw, "clienteNombre", "ClienteNombre") ?? "",
  };
}

export function unwrapVentasReportePaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const paged = unwrapPaged(inner);
  return {
    ...paged,
    items: paged.items.map(mapVentaReporte).filter(Boolean),
  };
}

export function unwrapComprasReportePaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const paged = unwrapPaged(inner);
  return {
    ...paged,
    items: paged.items.map(mapCompraApiToListRow).filter(Boolean),
  };
}

export function mapResumenCierreReporte(raw) {
  return mapResumenCierre(raw);
}

export function mapMovimientosCajaReporte(payload) {
  const data = pick(payload, "data", "Data") ?? payload;
  const list = Array.isArray(data) ? data : unwrapList(data);
  return list.map(mapMovimientoCaja).filter(Boolean);
}

export function etiquetaTipoVenta(tipo) {
  const valor = String(tipo ?? "").trim().toUpperCase();
  if (valor === "NORMAL") return "Menudeo";
  if (valor === "MAYOR" || valor === "MAYOREO") return "Mayoreo";
  return tipo || "—";
}

export function esVentaMayoreo(tipo) {
  const valor = String(tipo ?? "").trim().toUpperCase();
  return valor === "MAYOR" || valor === "MAYOREO";
}

export function esVentaMenudeo(tipo) {
  return String(tipo ?? "").trim().toUpperCase() === "NORMAL";
}

export function filtrarVentasPorTipo(items, filtroTipo) {
  if (!filtroTipo || filtroTipo === "TODAS") return items;
  if (filtroTipo === "MENUDEO") return items.filter((v) => esVentaMenudeo(v.tipoVenta));
  if (filtroTipo === "MAYOREO") return items.filter((v) => esVentaMayoreo(v.tipoVenta));
  return items;
}

/** Fechas por defecto: primer día del mes → hoy (DateOnly ISO). */
export function rangoFechasMesActual() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return {
    fechaDesde: inicio.toISOString().slice(0, 10),
    fechaHasta: hoy.toISOString().slice(0, 10),
  };
}

export function downloadArchivoBase64({ contenidoBase64, nombreArchivo, contentType }) {
  if (!contenidoBase64) return;
  const byteChars = atob(contenidoBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: contentType || "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo || "reporte.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
