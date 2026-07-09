import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { enriquecerTicketEncabezado, roundVenta } from "@/lib/ventaMappers";

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
  const itemsRaw = pick(inner, "items", "Items", "ventas", "Ventas") ?? inner;
  const items = unwrapList(itemsRaw).map(mapReembolsoVentaDisponible).filter(Boolean);
  const pageSource = inner ?? resp;
  const page = Number(pick(pageSource, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(pageSource, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount =
    Number(
      pick(
        pageSource,
        "totalCount",
        "TotalCount",
        "totalRecords",
        "TotalRecords"
      ) ?? 0
    ) || 0;
  const totalPages =
    Number(
      pick(pageSource, "totalPages", "TotalPages") ??
        Math.max(1, Math.ceil(totalCount / pageSize))
    ) || 1;
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

/** Total reembolsado desde campos directos o sumando pagos/detalles anidados. */
function resolverTotalReembolso(raw, { negativo = false } = {}) {
  if (!raw) return 0;

  const totalReembolsadoRaw = pick(
    raw,
    "totalReembolsado",
    "TotalReembolsado",
    "totalReembolso",
    "TotalReembolso",
    "montoReembolsado",
    "MontoReembolsado",
    "montoTotalReembolsado",
    "MontoTotalReembolsado",
    "montoTotal",
    "MontoTotal",
    "montoDevuelto",
    "MontoDevuelto",
    "importeTotal",
    "ImporteTotal",
    "importe",
    "Importe",
    "total",
    "Total",
    "monto",
    "Monto"
  );

  let total = 0;
  if (totalReembolsadoRaw != null && totalReembolsadoRaw !== "") {
    const n = Number(totalReembolsadoRaw);
    if (Number.isFinite(n)) total = roundVenta(n);
  }

  if (total === 0) {
    const detalles = unwrapList(
      pick(raw, "detalles", "Detalles", "lineas", "Lineas") ?? []
    );
    const pagos = unwrapList(pick(raw, "pagos", "Pagos") ?? []);

    const fromPagos = pagos.reduce((acc, p) => {
      const m = Number(
        pick(p, "montoAplicado", "MontoAplicado", "monto", "Monto") ?? 0
      );
      return acc + (Number.isFinite(m) ? m : 0);
    }, 0);

    const fromDetalles = detalles.reduce((acc, d) => {
      const m = Number(
        pick(
          d,
          "montoReembolsado",
          "MontoReembolsado",
          "subtotal",
          "Subtotal",
          "monto",
          "Monto"
        ) ?? 0
      );
      return acc + (Number.isFinite(m) ? m : 0);
    }, 0);

    total = roundVenta(fromPagos || fromDetalles);
  }

  if (total === 0) return 0;
  if (negativo) return total > 0 ? -roundVenta(total) : roundVenta(total);
  return roundVenta(Math.abs(total));
}

function pickCantidadDevuelta(raw) {
  const n = pick(
    raw,
    "cantidad",
    "Cantidad",
    "cantidadDevuelta",
    "CantidadDevuelta",
    "cantidadReembolsada",
    "CantidadReembolsada",
    "cantidadRetornada",
    "CantidadRetornada",
    "unidadesDevueltas",
    "UnidadesDevueltas"
  );
  const qty = Number(n ?? 0);
  return Number.isFinite(qty) ? qty : 0;
}

/** Unidades devueltas desde campo directo o sumando detalles/lineas anidados. */
function resolverCantidadTotalDevuelta(raw) {
  if (!raw) return 0;

  const direct = pick(
    raw,
    "cantidadTotalDevuelta",
    "CantidadTotalDevuelta",
    "totalUnidadesDevueltas",
    "TotalUnidadesDevueltas",
    "cantidadDevueltaTotal",
    "CantidadDevueltaTotal",
    "cantidadDevuelta",
    "CantidadDevuelta"
  );
  if (direct != null && direct !== "") {
    const n = Number(direct);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const detalles = unwrapList(
    pick(raw, "detalles", "Detalles", "lineas", "Lineas") ?? []
  );
  if (!detalles.length) return 0;
  return detalles.reduce((acc, d) => acc + pickCantidadDevuelta(d), 0);
}

/**
 * Construye el ticket de reembolso a partir del snapshot local del cobro.
 * No depende de un endpoint GET de ticket: usa las líneas y pagos ya conocidos
 * y, si la respuesta del POST trae número de documento, lo aprovecha.
 */
export function buildTicketReembolso({
  reembolsoAplicado,
  lineas,
  pagos,
  cajeroNombre,
  motivo,
  observacion,
  idVentaOriginal,
} = {}) {
  const data = reembolsoAplicado ?? {};

  const detalles = (lineas ?? []).map((l) => {
    const base = montoBaseLineaReembolso(l);
    const penalizacion = roundVenta(Number(l.montoPenalizacion) || 0);
    const montoReembolsado = roundVenta(Math.max(0, base - penalizacion));
    return {
      nombre: l.nombre ?? "Producto",
      cantidad: Number(l.cantidad) || 0,
      montoBase: base,
      penalizacion,
      montoReembolsado,
    };
  });

  const pagosTicket = (pagos ?? []).map((p) => ({
    metodoPago: p.nombre,
    montoAplicado: roundVenta(Number(p.montoAplicado) || 0),
  }));

  const totalReembolsado = roundVenta(
    pagosTicket.reduce((acc, p) => acc + p.montoAplicado, 0) ||
      detalles.reduce((acc, d) => acc + d.montoReembolsado, 0)
  );

  return enriquecerTicketEncabezado(
    {
      tipo: "reembolso",
      nombreNegocio: pick(data, "nombreNegocio", "NombreNegocio") ?? "",
      direccion: pick(data, "direccion", "Direccion") ?? "",
      cajero: pick(data, "cajero", "Cajero") ?? "",
      numeroDocumento:
        pick(
          data,
          "numeroDocumento",
          "NumeroDocumento",
          "numeroReembolso",
          "NumeroReembolso"
        ) ?? "",
      numeroVenta:
        pick(data, "numeroTicket", "NumeroTicket", "numeroVenta", "NumeroVenta") ??
        (idVentaOriginal != null ? `V-${idVentaOriginal}` : ""),
      fechaHora: pick(data, "fechaHora", "FechaHora") ?? new Date().toISOString(),
      motivo: motivo ?? "",
      observacion: observacion ?? "",
      detalles,
      totalReembolsado,
      pagos: pagosTicket,
    },
    { cajeroFallback: cajeroNombre }
  );
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

export function mapReembolsoHistorial(raw) {
  if (!raw) return null;
  const idReembolso = toNumberOrNull(
    pick(raw, "idReembolso", "IdReembolso", "id", "Id")
  );
  if (idReembolso == null) return null;

  const total = resolverTotalReembolso(raw, { negativo: true });
  const cantidadDevuelta = resolverCantidadTotalDevuelta(raw);

  const numeroReembolso =
    pick(raw, "numeroReembolso", "NumeroReembolso", "numeroDocumento", "NumeroDocumento") ??
    null;
  const numeroTicketOrigen =
    pick(
      raw,
      "numeroTicketOrigen",
      "NumeroTicketOrigen",
      "numeroTicket",
      "NumeroTicket"
    ) ?? null;

  return {
    tipo: "reembolso",
    id: `reembolso-${idReembolso}`,
    idReembolso,
    idVenta: toNumberOrNull(
      pick(raw, "idVenta", "IdVenta", "idVentaOriginal", "IdVentaOriginal")
    ),
    idCaja: toNumberOrNull(pick(raw, "idCaja", "IdCaja")),
    numeroTicket: numeroReembolso ?? `R-${idReembolso}`,
    numeroTicketOrigen: numeroTicketOrigen || null,
    motivo: String(pick(raw, "motivo", "Motivo") ?? "").trim(),
    estado: String(pick(raw, "estado", "Estado") ?? "").trim(),
    fechaHora:
      pick(
        raw,
        "fechaHora",
        "FechaHora",
        "fechaReembolso",
        "FechaReembolso",
        "fecha",
        "Fecha",
        "createdAt",
        "CreatedAt"
      ) ?? null,
    usuarioNombre:
      pick(
        raw,
        "usuarioNombre",
        "UsuarioNombre",
        "cajero",
        "Cajero",
        "cajeroNombre",
        "CajeroNombre"
      ) ?? "",
    estadoVenta: "REEMBOLSO",
    cantidadDevuelta,
    total:
      toNumberOrNull(
        pick(raw, "totalReembolsado", "TotalReembolsado", "totalReembolso", "TotalReembolso")
      ) != null
        ? -Math.abs(
            Number(
              pick(
                raw,
                "totalReembolsado",
                "TotalReembolsado",
                "totalReembolso",
                "TotalReembolso"
              )
            )
          )
        : total,
  };
}

export function unwrapReembolsosHistorialPaged(resp) {
  const exito = pick(resp, "exito", "Exito") !== false;
  const mensaje = pick(resp, "mensaje", "Mensaje") ?? "";
  const inner = pick(resp, "data", "Data") ?? resp;
  const itemsRaw =
    pick(inner, "items", "Items", "reembolsos", "Reembolsos") ?? inner;
  const items = unwrapList(itemsRaw).map(mapReembolsoHistorial).filter(Boolean);
  const pageSource = inner ?? resp;
  const page = Number(pick(pageSource, "page", "Page") ?? 1) || 1;
  const pageSize = Number(pick(pageSource, "pageSize", "PageSize") ?? 10) || 10;
  const totalCount =
    Number(
      pick(
        pageSource,
        "totalCount",
        "TotalCount",
        "totalRecords",
        "TotalRecords"
      ) ?? items.length
    ) || 0;
  const totalPages =
    Number(
      pick(pageSource, "totalPages", "TotalPages") ??
        Math.max(1, Math.ceil(totalCount / pageSize))
    ) || 1;
  return { exito, mensaje, items, page, pageSize, totalCount, totalPages };
}

function mapReembolsoComprobanteDetalle(raw) {
  if (!raw) return null;
  const cantidad = pickCantidadDevuelta(raw);
  const montoBase = Number(
    pick(raw, "montoBase", "MontoBase", "montoBaseDevolucion", "MontoBaseDevolucion") ?? 0
  );
  const penalizacion = Number(
    pick(raw, "penalizacion", "Penalizacion", "montoPenalizacion", "MontoPenalizacion") ?? 0
  );
  const montoReembolsadoRaw = pick(
    raw,
    "montoReembolsado",
    "MontoReembolsado",
    "subtotal",
    "Subtotal"
  );
  const montoReembolsado =
    montoReembolsadoRaw != null
      ? roundVenta(Number(montoReembolsadoRaw))
      : roundVenta(Math.max(0, montoBase - penalizacion));

  return {
    nombre: pick(raw, "nombre", "Nombre", "nombreItemSnapshot", "NombreItemSnapshot") ?? "Producto",
    cantidad,
    montoBase: roundVenta(montoBase || montoReembolsado + penalizacion),
    penalizacion: roundVenta(penalizacion),
    montoReembolsado,
  };
}

function mapReembolsoComprobantePago(raw) {
  if (!raw) return null;
  return {
    metodoPago: pick(raw, "metodoPago", "MetodoPago") ?? "",
    montoAplicado: roundVenta(Number(pick(raw, "montoAplicado", "MontoAplicado") ?? 0)),
  };
}

/** Comprobante de reembolso desde GET /api/reembolsos/{id}/comprobante */
export function mapReembolsoComprobante(raw) {
  const data = pick(raw, "data", "Data") ?? raw;
  const detallesRaw = pick(data, "detalles", "Detalles", "lineas", "Lineas") ?? [];
  const pagosRaw = pick(data, "pagos", "Pagos") ?? [];

  const detalles = unwrapList(detallesRaw).map(mapReembolsoComprobanteDetalle).filter(Boolean);
  const pagos = unwrapList(pagosRaw).map(mapReembolsoComprobantePago).filter(Boolean);
  const totalReembolsado = resolverTotalReembolso(data);

  return enriquecerTicketEncabezado(
    {
      tipo: "reembolso",
      nombreNegocio: pick(data, "nombreNegocio", "NombreNegocio") ?? "",
      direccion: pick(data, "direccion", "Direccion") ?? "",
      cajero: pick(data, "cajero", "Cajero") ?? "",
      numeroDocumento:
        pick(
          data,
          "numeroDocumento",
          "NumeroDocumento",
          "numeroReembolso",
          "NumeroReembolso"
        ) ?? "",
      numeroVenta:
        pick(data, "numeroVenta", "NumeroVenta", "numeroTicket", "NumeroTicket") ?? "",
      fechaHora: pick(data, "fechaHora", "FechaHora") ?? null,
      motivo: pick(data, "motivo", "Motivo") ?? "",
      observacion: pick(data, "observacion", "Observacion") ?? "",
      detalles,
      totalReembolsado,
      pagos,
    },
    { cajeroFallback: pick(data, "cajero", "Cajero") ?? "" }
  );
}
