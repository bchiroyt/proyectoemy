import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

/** Etiqueta legible para tarjetas y carrito (nombre + variantes) */
export function buildNombreDisplay(raw) {
  const base = pick(raw, "nombreProducto", "NombreProducto") ?? "";
  const extras = [
    pick(raw, "talla", "Talla"),
    pick(raw, "color", "Color"),
    pick(raw, "presentacion", "Presentacion"),
  ].filter(Boolean);
  if (!base) return extras.join(" · ") || "Producto";
  if (extras.length === 0) return base;
  return `${base} · ${extras.join(" · ")}`;
}

export function slugCategoria(nombre) {
  return String(nombre ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "sin-categoria";
}

export function mapCatalogoProducto(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  if (idVariante == null) return null;

  const categoria = pick(raw, "categoria", "Categoria") ?? "";
  const precio = Number(pick(raw, "precioVentaActual", "PrecioVentaActual") ?? 0);
  const stockRaw = pick(raw, "stockActual", "StockActual");
  const stockActual =
    stockRaw === undefined || stockRaw === null ? null : Number(stockRaw);

  return {
    id: idVariante,
    idVariante,
    sku: pick(raw, "sku", "Sku") ?? "",
    nombre: buildNombreDisplay(raw),
    nombreProducto: pick(raw, "nombreProducto", "NombreProducto") ?? "",
    descripcion: pick(raw, "descripcion", "Descripcion") ?? "",
    marca: pick(raw, "marca", "Marca") ?? "",
    categoria,
    categoriaSlug: slugCategoria(categoria),
    talla: pick(raw, "talla", "Talla") ?? null,
    color: pick(raw, "color", "Color") ?? null,
    presentacion: pick(raw, "presentacion", "Presentacion") ?? null,
    precio,
    stockActual,
    codigo: pick(raw, "sku", "Sku") ?? "",
  };
}

export function mapCatalogoList(payload) {
  return unwrapList(payload).map(mapCatalogoProducto).filter(Boolean);
}

export function unwrapVentaPaged(resp) {
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const inner = pick(resp, "data", "Data") ?? resp;
  const items = mapCatalogoList(inner);
  const page = Number(pick(inner, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(inner, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount =
    Number(
      pick(inner, "totalCount", "TotalCount", "totalRecords", "TotalRecords") ??
        items.length
    ) || 0;
  const totalPages =
    Number(pick(inner, "totalPages", "TotalPages") ?? Math.max(1, Math.ceil(totalCount / pageSize))) ||
    1;
  return { exito, mensaje, items, page, pageSize, totalCount, totalPages };
}

export function roundVenta(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Arma el body de POST /api/Ventas */
export function buildVentaCrearBody(carrito, pagos, observaciones = null) {
  const detalles = carrito
    .filter((l) => l.cantidad > 0)
    .map((l) => ({
      idVariante: l.idVariante,
      cantidad: l.cantidad,
      descuentoMonto: l.descuentoMonto ?? null,
      idUbicacion: l.idUbicacion ?? null,
    }));

  return {
    idCliente: null,
    observaciones: observaciones?.trim() || null,
    detalles,
    pagos: pagos.map((p) => ({
      idMetodoPago: p.idMetodoPago,
      montoAplicado: roundVenta(p.montoAplicado),
      montoRecibido: roundVenta(p.montoRecibido),
      referencia: p.referencia?.trim() || null,
    })),
  };
}

export function mapVentaCreada(raw) {
  if (!raw) return null;
  const data = pick(raw, "data", "Data") ?? raw;
  return {
    idVenta: toNumberOrNull(pick(data, "idVenta", "IdVenta")),
    estado: pick(data, "estado", "Estado") ?? "",
    numeroTicket: pick(data, "numeroTicket", "NumeroTicket") ?? "",
    total: Number(pick(data, "total", "Total") ?? 0),
    cambio: Number(pick(data, "cambio", "Cambio") ?? 0),
    idCaja: toNumberOrNull(pick(data, "idCaja", "IdCaja")),
  };
}

function mapTicketDetalle(raw) {
  if (!raw) return null;
  const cantidad = Number(pick(raw, "cantidad", "Cantidad") ?? 0);
  const precio = Number(pick(raw, "precio", "Precio") ?? 0);
  return {
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    cantidad,
    precio,
    subtotal: roundVenta(cantidad * precio),
  };
}

function mapTicketPago(raw) {
  if (!raw) return null;
  return {
    metodoPago: pick(raw, "metodoPago", "MetodoPago") ?? "",
    montoAplicado: Number(pick(raw, "montoAplicado", "MontoAplicado") ?? 0),
    montoRecibido: Number(pick(raw, "montoRecibido", "MontoRecibido") ?? 0),
    cambio: Number(pick(raw, "cambio", "Cambio") ?? 0),
  };
}

export function mapVentaTicket(raw) {
  if (!raw) return null;
  const data = pick(raw, "data", "Data") ?? raw;
  const detallesRaw = pick(data, "detalles", "Detalles") ?? [];
  const pagosRaw = pick(data, "pagos", "Pagos") ?? [];

  return {
    nombreNegocio: pick(data, "nombreNegocio", "NombreNegocio") ?? "",
    cajero: pick(data, "cajero", "Cajero") ?? "",
    numeroDocumento: pick(data, "numeroDocumento", "NumeroDocumento") ?? "",
    fechaHora: pick(data, "fechaHora", "FechaHora") ?? null,
    detalles: unwrapList(detallesRaw).map(mapTicketDetalle).filter(Boolean),
    total: Number(pick(data, "total", "Total") ?? 0),
    pagos: unwrapList(pagosRaw).map(mapTicketPago).filter(Boolean),
    cambio: Number(pick(data, "cambio", "Cambio") ?? 0),
  };
}

/** Construye ticket desde datos locales tras el cobro (si GET ticket no está disponible). */
export function buildTicketDesdeCobro({ ventaCreada, lineas, pagos, cajeroNombre }) {
  const detalles = (lineas ?? []).map((l) => ({
    nombre: l.nombre,
    cantidad: l.cantidad,
    precio: l.precio,
    subtotal: roundVenta(l.precio * l.cantidad),
    notaLinea: l.notaLinea ?? null,
  }));

  return {
    nombreNegocio: "Moda y Variedades EMY",
    cajero: cajeroNombre ?? "",
    numeroDocumento: ventaCreada?.numeroTicket ?? "",
    fechaHora: new Date().toISOString(),
    detalles,
    total: ventaCreada?.total ?? 0,
    pagos: (pagos ?? []).map((p) => ({
      metodoPago: p.nombre,
      montoAplicado: p.montoAplicado,
      montoRecibido: p.montoRecibido,
      cambio: Math.max(0, p.montoRecibido - p.montoAplicado),
    })),
    cambio: ventaCreada?.cambio ?? 0,
  };
}
