import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import {
  buildVarianteDetallePartes,
  normalizarAtributosAdicionales,
  pickNombreVariante,
} from "@/lib/varianteUtils";

const pickFrom = (sources, ...keys) => {
  for (const source of sources) {
    const value = pick(source, ...keys);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

export const normalizarEstadoStock = (estado) =>
  String(estado ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export function buildVarianteStockDetalle(item) {
  const sku = String(item?.sku ?? "").trim();
  const detalle = buildVarianteDetallePartes(item);

  return [`SKU ${sku || "sin registrar"}`, ...detalle].filter(Boolean);
}

export function mapNivelStock(raw, index = 0) {
  if (!raw) return null;

  const productoRaw = pick(raw, "producto", "Producto");
  const producto = productoRaw && typeof productoRaw === "object" ? productoRaw : {};
  const variante = pick(raw, "variante", "Variante", "productoVariante", "ProductoVariante") ?? {};
  const proveedorObj = pick(raw, "proveedor", "Proveedor") ?? {};
  const sources = [raw, variante, producto];

  const id =
    toNumberOrNull(pickFrom(sources, "idNivelStock", "IdNivelStock")) ??
    toNumberOrNull(pickFrom(sources, "idVariante", "IdVariante")) ??
    toNumberOrNull(pickFrom(sources, "idProducto", "IdProducto")) ??
    `${pickFrom(sources, "sku", "Sku", "SKU") ?? "nivel-stock"}-${index}`;

  const stockActual =
    toNumberOrNull(
      pick(raw, "stockActual", "StockActual", "existenciaActual", "ExistenciaActual", "existencia", "Existencia")
    ) ?? 0;

  return {
    id,
    idVariante: toNumberOrNull(pickFrom(sources, "idVariante", "IdVariante")),
    sku: pickFrom(sources, "sku", "Sku", "SKU", "codigo", "Codigo") ?? "",
    producto:
      (typeof productoRaw === "string" ? productoRaw : "") ||
      pickFrom(
        sources,
        "nombreProducto",
        "NombreProducto",
        "productoNombre",
        "ProductoNombre",
        "nombre",
        "Nombre"
      ) ?? "Producto",
    talla: pickFrom(sources, "talla", "Talla", "nombreTalla", "NombreTalla") ?? "",
    color: pickFrom(sources, "color", "Color", "nombreColor", "NombreColor") ?? "",
    nombreVariante: pickNombreVariante(raw) ?? pickNombreVariante(variante) ?? "",
    atributosAdicionales:
      normalizarAtributosAdicionales(raw) ?? normalizarAtributosAdicionales(variante),
    presentacion:
      pickFrom(
        sources,
        "presentacion",
        "Presentacion",
        "presentación",
        "Presentación",
        "nombrePresentacion",
        "NombrePresentacion"
      ) ?? "",
    imagen:
      pickFrom(
        sources,
        "imagen",
        "Imagen",
        "imagenUrl",
        "ImagenUrl",
        "urlImagen",
        "UrlImagen",
        "fotoUrl",
        "FotoUrl"
      ) ?? "",
    nivelStock:
      pick(raw, "nivelStock", "NivelStock", "estadoStock", "EstadoStock", "estado", "Estado") ??
      "",
    stockMin:
      toNumberOrNull(pick(raw, "stockMin", "StockMin", "stockMinimo", "StockMinimo", "minimo", "Minimo")),
    cantidadExistente:
      toNumberOrNull(
        pick(raw, "cantidadExistente", "CantidadExistente", "cantidad", "Cantidad", "existencia", "Existencia")
      ) ?? stockActual,
    stockActual,
    proveedor:
      pickFrom(
        [raw, proveedorObj],
        "proveedor",
        "Proveedor",
        "proveedorNombre",
        "ProveedorNombre",
        "nombreProveedor",
        "NombreProveedor",
        "nombre",
        "Nombre"
      ) ?? "Sin proveedor",
  };
}

export function unwrapNivelesStock(resp) {
  const data = pick(resp, "data", "Data") ?? resp;
  const resultados = pick(data, "resultados", "Resultados") ?? data;
  const items = pick(resultados, "items", "Items") ?? unwrapList(resp);
  return (Array.isArray(items) ? items : []).map(mapNivelStock).filter(Boolean);
}

export function unwrapNivelesStockExportar(resp) {
  const data = pick(resp, "data", "Data") ?? resp;
  const resultados = pick(data, "resultados", "Resultados") ?? data;
  const items =
    pick(resultados, "items", "Items", "detalle", "Detalle", "detalles", "Detalles", "productos", "Productos") ??
    unwrapList(resp);
  const fecha =
    pick(data, "fecha", "Fecha", "fechaGeneracion", "FechaGeneracion", "fechaReporte", "FechaReporte") ??
    pick(resultados, "fecha", "Fecha", "fechaGeneracion", "FechaGeneracion", "fechaReporte", "FechaReporte") ??
    null;

  return {
    fecha,
    items: (Array.isArray(items) ? items : []).map(mapNivelStock).filter(Boolean),
  };
}
