import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { roundVenta, brutoLinea, mapVentaCreada } from "@/lib/ventaMappers";

export function mapCotizacionDetalle(raw) {
  if (!raw) return null;
  const idCotizacionDetalle = toNumberOrNull(
    pick(raw, "idCotizacionDetalle", "IdCotizacionDetalle")
  );
  if (idCotizacionDetalle == null) return null;

  return {
    idCotizacionDetalle,
    idVariante: toNumberOrNull(pick(raw, "idVariante", "IdVariante")),
    nombreProducto: pick(raw, "nombreProducto", "NombreProducto") ?? "",
    presentacion: pick(raw, "presentacion", "Presentacion") ?? "",
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
    precioUnitarioNegociado: Number(
      pick(raw, "precioUnitarioNegociado", "PrecioUnitarioNegociado") ?? 0
    ),
    subtotal: Number(pick(raw, "subtotal", "Subtotal") ?? 0),
  };
}

export function mapCotizacion(raw) {
  if (!raw) return null;
  const idCotizacion = toNumberOrNull(pick(raw, "idCotizacion", "IdCotizacion"));
  if (idCotizacion == null) return null;

  const detallesRaw = pick(raw, "detalles", "Detalles") ?? [];

  return {
    idCotizacion,
    fechaEmision: pick(raw, "fechaEmision", "FechaEmision") ?? null,
    fechaVencimiento: pick(raw, "fechaVencimiento", "FechaVencimiento") ?? null,
    idUsuario: toNumberOrNull(pick(raw, "idUsuario", "IdUsuario")),
    nombreUsuario: pick(raw, "nombreUsuario", "NombreUsuario") ?? "",
    idCliente: toNumberOrNull(pick(raw, "idCliente", "IdCliente")),
    nombreCliente: pick(raw, "nombreCliente", "NombreCliente") ?? "",
    total: Number(pick(raw, "total", "Total") ?? 0),
    estado: pick(raw, "estado", "Estado") ?? "",
    detalles: unwrapList(detallesRaw).map(mapCotizacionDetalle).filter(Boolean),
  };
}

export function mapCotizacionList(payload) {
  return unwrapList(payload).map(mapCotizacion).filter(Boolean);
}

function buildCotizacionDetallesPayload(carrito) {
  return carrito
    .filter((l) => l.cantidad > 0)
    .map((l) => ({
      idVariante: l.idVariante,
      cantidad: l.cantidad,
      precioUnitarioNegociado: roundVenta(l.precioNegociado ?? l.precio),
    }));
}

/** Convierte un detalle de cotización al formato del carrito de mayoreo. */
export function mapDetalleCotizacionACarrito(detalle) {
  if (!detalle) return null;
  const idVariante = toNumberOrNull(detalle.idVariante);
  if (idVariante == null) return null;

  const nombreBase = detalle.nombreProducto || "Producto";
  const presentacion = detalle.presentacion?.trim();
  const nombre = presentacion ? `${nombreBase} · ${presentacion}` : nombreBase;
  const precioNegociado = Number(detalle.precioUnitarioNegociado ?? 0);

  return {
    id: idVariante,
    idVariante,
    nombre,
    nombreProducto: nombreBase,
    presentacion: presentacion || null,
    cantidad: Number(detalle.cantidad) || 1,
    cantidadText: String(Number(detalle.cantidad) || 1),
    precioNegociado,
    precioNegociadoText: precioNegociado > 0 ? String(precioNegociado) : "",
    precio: precioNegociado,
    sku: "",
  };
}

/** PUT /api/Cotizaciones/{id} — reemplaza líneas (solo PENDIENTE). */
export function buildCotizacionActualizarBody(carrito) {
  return { detalles: buildCotizacionDetallesPayload(carrito) };
}

/** POST /api/Cotizaciones — cotización (no afecta inventario ni menudeo). */
export function buildCotizacionCrearBody(
  carrito,
  { nombreCliente, telefonoCliente, idCliente } = {}
) {
  const body = { detalles: buildCotizacionDetallesPayload(carrito) };

  const id = toNumberOrNull(idCliente);
  if (id != null && id > 0) {
    body.idCliente = id;
  } else {
    body.nombreCliente = String(nombreCliente ?? "").trim() || null;
    body.telefonoCliente = String(telefonoCliente ?? "").trim() || null;
  }

  return body;
}

/** POST /api/Cotizaciones/{id}/convertir — finalización con pago e inventario. */
export function buildCotizacionConvertirBody(pagos, idCaja) {
  return {
    idCaja: idCaja ?? null,
    pagos: (pagos ?? []).map((p) => ({
      idMetodoPago: p.idMetodoPago,
      montoAplicado: roundVenta(p.montoAplicado),
      montoRecibido: roundVenta(p.montoRecibido),
      referencia: p.referencia?.trim() || null,
    })),
  };
}

export function mapCotizacionConvertida(raw) {
  const data = pick(raw, "data", "Data") ?? raw;
  return mapVentaCreada(data);
}

export { brutoLinea };

export function etiquetaEstadoCotizacion(estado) {
  const valor = String(estado ?? "").trim().toUpperCase();
  if (valor === "PENDIENTE") return "Cotización";
  if (valor === "CONVERTIDA") return "Finalizada";
  if (valor === "VENCIDA") return "Vencida";
  if (valor === "ANULADA") return "Anulada";
  return estado || "—";
}
