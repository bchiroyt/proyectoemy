import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import {
  TICKET_NEGOCIO_DIRECCION,
  TICKET_NEGOCIO_NOMBRE,
} from "@/constants/ticketConfig";
import {
  buildNombreDisplayConVariante,
  buildNombreTicket,
  normalizarAtributosAdicionales,
  pickNombreVariante,
} from "@/lib/varianteUtils";

/** Etiqueta legible para tarjetas y carrito (nombre + variantes) */
export function buildNombreDisplay(raw) {
  return buildNombreDisplayConVariante(raw);
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
  const precioVentaMayor = Number(
    pick(
      raw,
      "precioVentaMayorActual",
      "PrecioVentaMayorActual",
      "precioVentaMayor",
      "PrecioVentaMayor",
      "precioMayor",
      "PrecioMayor"
    ) ?? 0
  );
  const stockRaw = pick(raw, "stockActual", "StockActual");
  const stockActual =
    stockRaw === undefined || stockRaw === null ? null : Number(stockRaw);
  const costoPromedioRaw = pick(raw, "costoPromedioActual", "CostoPromedioActual");
  const costoPromedioActual =
    costoPromedioRaw === undefined || costoPromedioRaw === null
      ? null
      : Number(costoPromedioRaw);

  const codigosExternosRaw = pick(raw, "codigosExternos", "CodigosExternos") ?? [];
  const codigosExternos = Array.isArray(codigosExternosRaw)
    ? codigosExternosRaw
        .map((item) => {
          if (typeof item === "string") return { codigo: item, esPrincipal: false };
          const codigo = pick(item, "codigo", "Codigo");
          if (codigo == null || codigo === "") return null;
          return {
            codigo: String(codigo),
            esPrincipal: Boolean(pick(item, "esPrincipal", "EsPrincipal")),
          };
        })
        .filter(Boolean)
    : [];

  const codigoBarras =
    pick(
      raw,
      "codigoBarras",
      "CodigoBarras",
      "codigoPrincipal",
      "CodigoPrincipal",
      "codigoExterno",
      "CodigoExterno"
    ) ??
    codigosExternos.find((c) => c.esPrincipal)?.codigo ??
    codigosExternos[0]?.codigo ??
    "";

  return {
    id: idVariante,
    idVariante,
    sku: pick(raw, "sku", "Sku") ?? "",
    nombre: buildNombreDisplay(raw),
    nombreTicket: buildNombreTicket(raw),
    nombreProducto: pick(raw, "nombreProducto", "NombreProducto") ?? "",
    nombreVariante: pickNombreVariante(raw),
    atributosAdicionales: normalizarAtributosAdicionales(raw),
    descripcion: pick(raw, "descripcion", "Descripcion") ?? "",
    marca: pick(raw, "marca", "Marca") ?? "",
    categoria,
    categoriaSlug: slugCategoria(categoria),
    talla: pick(raw, "talla", "Talla") ?? null,
    color: pick(raw, "color", "Color") ?? null,
    presentacion: pick(raw, "presentacion", "Presentacion") ?? null,
    urlImagen: pick(raw, "urlImagen", "UrlImagen", "imagen", "Imagen") ?? null,
    precio,
    precioVentaMayor,
    costoPromedioActual,
    stockActual,
    codigoBarras: codigoBarras ? String(codigoBarras) : "",
    codigosExternos,
    /** @deprecated usar codigoBarras; se mantiene por compatibilidad de UI */
    codigo: codigoBarras ? String(codigoBarras) : pick(raw, "sku", "Sku") ?? "",
  };
}

export function mapCatalogoList(payload) {
  return unwrapList(payload).map(mapCatalogoProducto).filter(Boolean);
}

export function mapVentaResumen(raw) {
  if (!raw) return null;
  const idVenta = toNumberOrNull(pick(raw, "idVenta", "IdVenta"));
  if (idVenta == null) return null;

  return {
    idVenta,
    numeroTicket: pick(raw, "numeroTicket", "NumeroTicket") ?? "",
    fechaHora: pick(raw, "fechaHora", "FechaHora") ?? null,
    idCaja: toNumberOrNull(pick(raw, "idCaja", "IdCaja")),
    usuarioNombre: pick(raw, "usuarioNombre", "UsuarioNombre") ?? "",
    estadoVenta: pick(raw, "estadoVenta", "EstadoVenta") ?? "",
    total: Number(pick(raw, "total", "Total") ?? 0),
  };
}

/** Ítem unificado del historial POS para ventas confirmadas. */
export function mapVentaHistorialItem(raw) {
  const venta = mapVentaResumen(raw);
  if (!venta) return null;
  return {
    ...venta,
    tipo: "venta",
    id: `venta-${venta.idVenta}`,
  };
}

export function mapVentasResumenList(payload) {
  return unwrapList(payload).map(mapVentaResumen).filter(Boolean);
}

export function unwrapVentasResumenPaged(resp) {
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const inner = pick(resp, "data", "Data") ?? resp;
  const itemsRaw = pick(inner, "items", "Items") ?? inner;
  const items = mapVentasResumenList(itemsRaw);
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

export function etiquetaEstadoVenta(estado) {
  const valor = String(estado ?? "").trim().toUpperCase();
  if (valor === "CONFIRMADA") return "Pagado";
  if (valor === "REEMBOLSADA") return "Reembolsado";
  if (valor === "PARC_REEMBOLSADA") return "Reembolso parcial";
  return estado || "—";
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

/** Importe bruto de la línea (precio × cantidad), sin descuento. */
export function brutoLinea(item) {
  const precioUnitario = precioUnitarioLinea(item);
  return roundVenta(precioUnitario * (Number(item?.cantidad) || 0));
}

/** Precio unitario de catálogo (sin descuento de línea). */
export function precioUnitarioLinea(item) {
  return item?.precioNegociado != null
    ? Number(item.precioNegociado)
    : Number(item?.precio) || 0;
}

/** Precio unitario efectivo tras aplicar el descuento de la línea. */
export function precioUnitarioConDescuentoLinea(item) {
  const cantidad = Number(item?.cantidad) || 0;
  if (cantidad <= 0) return precioUnitarioLinea(item);
  return roundVenta(subtotalLinea(item) / cantidad);
}

/**
 * Descuento en MONTO de una línea, derivado de su tipo/valor.
 * - tipo "porcentaje": valor es el % por unidad (tope 100) → monto = bruto × %/100.
 * - tipo "monto": valor es el descuento fijo por unidad → monto = valor × cantidad.
 * Siempre se topa entre 0 y el bruto (el backend rechaza subtotal negativo).
 */
export function descuentoMontoLinea(item) {
  const bruto = brutoLinea(item);
  const cantidad = Number(item?.cantidad) || 0;
  const valor = Number(item?.descuentoValor) || 0;
  if (!item?.descuentoTipo || valor <= 0 || bruto <= 0 || cantidad <= 0) return 0;
  const monto =
    item.descuentoTipo === "porcentaje"
      ? roundVenta((bruto * Math.min(valor, 100)) / 100)
      : roundVenta(valor * cantidad);
  return Math.max(0, Math.min(monto, bruto));
}

/** Subtotal de la línea ya con su descuento aplicado. */
export function subtotalLinea(item) {
  return roundVenta(brutoLinea(item) - descuentoMontoLinea(item));
}

/** Arma el body de POST /api/Ventas */
export function buildVentaCrearBody(carrito, pagos, { observaciones = null, idCaja = null } = {}) {
  const detalles = carrito
    .filter((l) => l.cantidad > 0)
    .map((l) => {
      const descuento = descuentoMontoLinea(l);
      return {
        idVariante: l.idVariante,
        cantidad: l.cantidad,
        descuentoMonto: descuento > 0 ? descuento : null,
        idUbicacion: l.idUbicacion ?? null,
      };
    });

  return {
    idCaja: idCaja ?? null,
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
  const precio = Number(
    pick(
      raw,
      "precio",
      "Precio",
      "precioUnitario",
      "PrecioUnitario",
      "precioUnitarioSnapshot",
      "PrecioUnitarioSnapshot"
    ) ?? 0
  );
  let descuento = Number(
    pick(
      raw,
      "descuento",
      "Descuento",
      "descuentoMonto",
      "DescuentoMonto",
      "montoDescuento",
      "MontoDescuento"
    ) ?? 0
  );
  const subtotalRaw = pick(
    raw,
    "subtotal",
    "Subtotal",
    "subtotalLinea",
    "SubtotalLinea",
    "subtotalLineaSnapshot",
    "SubtotalLineaSnapshot"
  );
  const bruto = roundVenta(cantidad * precio);
  const subtotal =
    subtotalRaw != null
      ? roundVenta(Number(subtotalRaw))
      : roundVenta(Math.max(0, bruto - descuento));

  if (descuento <= 0 && bruto > subtotal) {
    descuento = roundVenta(bruto - subtotal);
  }

  return {
    nombre: buildNombreTicket(raw),
    cantidad,
    precio,
    descuento: roundVenta(descuento),
    subtotal,
  };
}

function mapTicketPago(raw) {
  if (!raw) return null;
  const montoAplicado = Number(pick(raw, "montoAplicado", "MontoAplicado") ?? 0);
  let montoRecibido = Number(pick(raw, "montoRecibido", "MontoRecibido") ?? 0);
  const cambio = Number(pick(raw, "cambio", "Cambio") ?? 0);

  if (montoRecibido <= montoAplicado && cambio > 0) {
    montoRecibido = roundVenta(montoAplicado + cambio);
  } else if (montoRecibido <= 0) {
    montoRecibido = montoAplicado;
  }

  return {
    metodoPago: pick(raw, "metodoPago", "MetodoPago") ?? "",
    montoAplicado,
    montoRecibido,
    cambio,
  };
}

/** Completa descuentos del ticket API con los del carrito local cuando el backend no los envía. */
export function enriquecerTicketDescuentosDesdeLineas(ticket, lineas = []) {
  if (!ticket?.detalles?.length || !lineas?.length) return ticket;
  if (ticket.detalles.some((d) => Number(d.descuento) > 0)) return ticket;

  const detalles = ticket.detalles.map((detalle, idx) => {
    const linea = lineas[idx];
    if (!linea) return detalle;

    const descuento = descuentoMontoLinea(linea);
    if (descuento <= 0) return detalle;

    const precio = Number(detalle.precio) > 0 ? Number(detalle.precio) : precioUnitarioLinea(linea);
    return {
      ...detalle,
      precio,
      descuento,
      subtotal: subtotalLinea(linea),
    };
  });

  const huboCambios = detalles.some(
    (detalle, idx) => Number(detalle.descuento) !== Number(ticket.detalles[idx]?.descuento ?? 0)
  );
  if (!huboCambios) return ticket;

  return { ...ticket, detalles };
}

export function enriquecerTicketEncabezado(ticket, { cajeroFallback = "" } = {}) {
  if (!ticket) return null;

  const cajero =
    String(ticket.cajero || "").trim() ||
    String(cajeroFallback || "").trim() ||
    "Cajero";

  // El API suele enviar el nombre de la ubicación en nombreNegocio; en ticket
  // mostramos solo el negocio y dirección fijos, sin ubicación de inventario.
  return {
    ...ticket,
    nombreNegocio: TICKET_NEGOCIO_NOMBRE,
    direccion: TICKET_NEGOCIO_DIRECCION,
    cajero,
  };
}

export function mapVentaTicket(raw) {
  if (!raw) return null;
  const data = pick(raw, "data", "Data") ?? raw;
  const detallesRaw = pick(data, "detalles", "Detalles") ?? [];
  const pagosRaw = pick(data, "pagos", "Pagos") ?? [];
  const cambioTotal = Number(pick(data, "cambio", "Cambio") ?? 0);
  let pagos = unwrapList(pagosRaw).map(mapTicketPago).filter(Boolean);

  if (
    cambioTotal > 0 &&
    pagos.length === 1 &&
    pagos[0].montoRecibido <= pagos[0].montoAplicado
  ) {
    pagos = [
      {
        ...pagos[0],
        montoRecibido: roundVenta(pagos[0].montoAplicado + cambioTotal),
        cambio: cambioTotal,
      },
    ];
  }

  // No enriquecer aquí: el consumidor (VentaTicketPanel) vuelve a enriquecer
  // pasando el cajeroFallback. Si pre-enriqueciéramos, un cajero vacío del
  // backend quedaría como "Cajero" y el fallback nunca se aplicaría.
  return {
    nombreNegocio: pick(data, "nombreNegocio", "NombreNegocio") ?? "",
    cajero: pick(data, "cajero", "Cajero") ?? "",
    direccion: pick(data, "direccion", "Direccion") ?? "",
    numeroDocumento: pick(data, "numeroDocumento", "NumeroDocumento") ?? "",
    fechaHora: pick(data, "fechaHora", "FechaHora") ?? null,
    detalles: unwrapList(detallesRaw).map(mapTicketDetalle).filter(Boolean),
    total: Number(pick(data, "total", "Total") ?? 0),
    pagos,
    cambio: cambioTotal,
  };
}

/** Construye ticket desde datos locales tras el cobro (si GET ticket no está disponible). */
export function buildTicketDesdeCobro({ ventaCreada, lineas, pagos, cajeroNombre }) {
  const detalles = (lineas ?? []).map((l) => ({
    nombre: l.nombreTicket ?? l.nombre,
    cantidad: l.cantidad,
    precio: l.precio,
    descuento: descuentoMontoLinea(l),
    subtotal: subtotalLinea(l),
    notaLinea: l.notaLinea ?? null,
  }));

  return enriquecerTicketEncabezado(
    {
      nombreNegocio: TICKET_NEGOCIO_NOMBRE,
      direccion: TICKET_NEGOCIO_DIRECCION,
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
    },
    { cajeroFallback: cajeroNombre }
  );
}
