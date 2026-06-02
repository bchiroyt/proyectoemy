import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { roundVenta } from "@/lib/ventaMappers";

/** Ubicación por defecto al reintegrar inventario en reembolso (no se pide al cajero). */
export const ID_UBICACION_REEMBOLSO = 1;

export function mapReembolsoVentaDisponible(raw) {
  if (!raw) return null;
  const idVenta = toNumberOrNull(pick(raw, "idVenta", "IdVenta"));
  if (idVenta == null) return null;
  return {
    idVenta,
    numeroTicket: pick(raw, "numeroTicket", "NumeroTicket") ?? "",
    fechaHora: pick(raw, "fechaHora", "FechaHora") ?? null,
    totalVendido: Number(pick(raw, "totalVendido", "TotalVendido") ?? 0),
    cantidadDisponibleGlobal: Number(
      pick(raw, "cantidadDisponibleGlobal", "CantidadDisponibleGlobal") ?? 0
    ),
    elegible: Boolean(pick(raw, "elegible", "Elegible") ?? false),
    motivoNoElegible: pick(raw, "motivoNoElegible", "MotivoNoElegible") ?? null,
  };
}

export function unwrapReembolsoVentasDisponibles(resp) {
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const inner = pick(resp, "data", "Data") ?? resp;
  const items = unwrapList(inner).map(mapReembolsoVentaDisponible).filter(Boolean);
  const page = Number(pick(inner, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(inner, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount =
    Number(pick(inner, "totalCount", "TotalCount") ?? items.length) || items.length;
  const totalPages =
    Number(pick(inner, "totalPages", "TotalPages") ?? Math.max(1, Math.ceil(totalCount / pageSize))) ||
    1;
  return { exito, mensaje, items, page, pageSize, totalCount, totalPages };
}

export function mapReembolsoPreparacion(raw) {
  if (!raw) return null;
  const data = pick(raw, "data", "Data") ?? raw;
  const venta = pick(data, "venta", "Venta") ?? {};
  const lineasRaw = pick(data, "lineas", "Lineas") ?? [];
  return {
    idVenta: toNumberOrNull(pick(venta, "idVenta", "IdVenta")) ?? 0,
    numeroTicket: pick(venta, "numeroTicket", "NumeroTicket") ?? "",
    elegible: Boolean(pick(venta, "elegible", "Elegible") ?? false),
    motivoNoElegible: pick(venta, "motivoNoElegible", "MotivoNoElegible") ?? null,
    lineas: unwrapList(lineasRaw)
      .map((l) => ({
        idVentaDetalle: toNumberOrNull(pick(l, "idVentaDetalle", "IdVentaDetalle")),
        idVariante: toNumberOrNull(pick(l, "idVariante", "IdVariante")),
        idUbicacionOriginal: toNumberOrNull(
          pick(l, "idUbicacionOriginal", "IdUbicacionOriginal")
        ),
        nombre: pick(l, "nombreItemSnapshot", "NombreItemSnapshot") ?? "Producto",
        sku: pick(l, "skuSnapshot", "SkuSnapshot") ?? "",
        cantidadVendida: Number(pick(l, "cantidadVendida", "CantidadVendida") ?? 0),
        cantidadYaDevuelta: Number(
          pick(l, "cantidadYaDevueltaAplicada", "CantidadYaDevueltaAplicada") ?? 0
        ),
        cantidadDisponible: Number(
          pick(l, "cantidadDisponible", "CantidadDisponible") ?? 0
        ),
        precioUnitario: Number(
          pick(l, "precioUnitarioSnapshot", "PrecioUnitarioSnapshot") ?? 0
        ),
        subtotalLineaSnapshot: Number(
          pick(l, "subtotalLineaSnapshot", "SubtotalLineaSnapshot") ?? 0
        ),
        puedeReintegrarInventario: Boolean(
          pick(l, "puedeReintegrarInventario", "PuedeReintegrarInventario") ?? false
        ),
        requiereRevisionCosto: Boolean(
          pick(l, "requiereRevisionCosto", "RequiereRevisionCosto") ?? false
        ),
      }))
      .filter((l) => l.idVentaDetalle != null && l.idVariante != null && l.cantidadDisponible > 0),
  };
}

export function mapReembolsoCatalogos(raw) {
  if (!raw) return null;
  const data = pick(raw, "data", "Data") ?? raw;
  const ubicacionesRaw = pick(data, "ubicaciones", "Ubicaciones") ?? [];
  const validaciones = pick(data, "validaciones", "Validaciones") ?? {};
  return {
    ubicaciones: unwrapList(ubicacionesRaw)
      .map((u) => ({
        idUbicacion: toNumberOrNull(pick(u, "idUbicacion", "IdUbicacion")),
        nombre: pick(u, "nombre", "Nombre") ?? "",
      }))
      .filter((u) => u.idUbicacion != null),
    validaciones: {
      faltantes: unwrapList(pick(validaciones, "faltantes", "Faltantes")).map(String),
    },
  };
}

/** Monto base que valida el backend: subtotal línea / cantidad vendida × cantidad a devolver. */
export function montoBaseLineaReembolso(item) {
  const qty = Number(item?.cantidad) || 0;
  if (qty <= 0) return 0;
  const neto = Number(item?.precioNetoUnitario);
  if (Number.isFinite(neto) && neto > 0) {
    return roundVenta(neto * qty);
  }
  return roundVenta(Math.abs(Number(item?.precio) || 0) * qty);
}

export function mapReembolsoPrevisualizacion(raw) {
  const data = pick(raw, "data", "Data") ?? raw ?? {};
  return {
    esValido: Boolean(pick(data, "esValido", "EsValido") ?? false),
    totalReembolso: Number(pick(data, "totalReembolso", "TotalReembolso") ?? 0),
    errores: unwrapList(pick(data, "errores", "Errores")).map(String),
    erroresLineas: unwrapList(pick(data, "lineas", "Lineas"))
      .flatMap((linea) => {
        const idx = Number(pick(linea, "indice", "Indice") ?? 0);
        return unwrapList(pick(linea, "errores", "Errores")).map(
          (e) => `Línea ${idx + 1}: ${String(e)}`
        );
      }),
    erroresPagos: unwrapList(pick(data, "pagos", "Pagos"))
      .flatMap((pago) => {
        const idx = Number(pick(pago, "indice", "Indice") ?? 0);
        return unwrapList(pick(pago, "errores", "Errores")).map(
          (e) => `Pago ${idx + 1}: ${String(e)}`
        );
      }),
  };
}
