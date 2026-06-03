/** Normaliza respuesta del API `CompraResponse` al shape usado por la UI de compras. */

function inicialesProveedor(nombre) {
  if (!nombre || typeof nombre !== "string") return "?";
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

export function mapEstadoCompraUi(estadoCompra) {
  const e = String(estadoCompra || "").toUpperCase();
  if (e === "CERRADA") return "Recibido";
  if (e === "EN_PROCESO") return "En Proceso";
  if (e === "ANULADA") return "Anulada";
  return estadoCompra || "—";
}

/** Separa número de referencia y tipo de comprobante (no mezclar en un solo texto). */
export function mapComprobanteCompra(numeroOrden, tipoNombre) {
  const ref =
    numeroOrden != null && String(numeroOrden).trim() !== ""
      ? String(numeroOrden).trim()
      : null;
  const tipo =
    tipoNombre != null && String(tipoNombre).trim() !== ""
      ? String(tipoNombre).trim()
      : null;
  return {
    numeroReferencia: ref,
    tipoComprobante: tipo,
  };
}

export function mapCompraApiToListRow(api) {
  const idCompra = api.idCompra ?? api.IdCompra;
  const fechaCompra = api.fechaCompra ?? api.FechaCompra;
  const fechaRecepcion = api.fechaRecepcion ?? api.FechaRecepcion ?? null;
  const proveedorNombre = api.proveedorNombre ?? api.ProveedorNombre ?? "";
  const numeroOrden = api.numeroOrden ?? api.NumeroOrden;
  const tipoNombre = api.tipoComprobanteNombre ?? api.TipoComprobanteNombre;
  const total = Number(api.total ?? api.Total ?? 0);
  const estadoCompra = api.estadoCompra ?? api.EstadoCompra;
  const comprobante = mapComprobanteCompra(numeroOrden, tipoNombre);

  return {
    id: String(idCompra),
    idCompra,
    no: idCompra,
    fechaPedido: fechaCompra ? String(fechaCompra) : "",
    fechaRecepcion: fechaRecepcion ? String(fechaRecepcion) : null,
    proveedor: { nombre: proveedorNombre, iniciales: inicialesProveedor(proveedorNombre) },
    numeroReferencia: comprobante.numeroReferencia,
    tipoComprobante: comprobante.tipoComprobante,
    total,
    estado: mapEstadoCompraUi(estadoCompra),
    estadoCompraRaw: estadoCompra,
    notasProveedor: api.observacion ?? api.Observacion ?? "",
    items: mapDetallesToItems(api.detalles ?? api.Detalles ?? [], estadoCompra),
  };
}

/**
 * En pedidos EN_PROCESO: cantidad y costo estimado.
 * En compras CERRADA (recibidas): cantidad recibida y costo real (CostoUnitario).
 */
export function mapDetallesToItems(detalles, estadoCompra) {
  const list = Array.isArray(detalles) ? detalles : [];
  const esRecibida = String(estadoCompra || "").toUpperCase() === "CERRADA";

  return list.map((d) => {
    const productoNombre = d.productoNombre ?? d.ProductoNombre ?? "";
    const color = d.color ?? d.Color ?? "";
    const tallaNombre = d.tallaNombre ?? d.TallaNombre ?? "";
    const sku = d.sku ?? d.Sku ?? "";
    const cantidadSolicitada = Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 0);
    const cantidadRecibida = Number(d.cantidadRecibida ?? d.CantidadRecibida ?? 0);
    const costoEstimado = Number(d.costoEstimado ?? d.CostoEstimado ?? 0);
    const costoReal = Number(d.costoReal ?? d.CostoReal ?? 0);
    const subtotalApi = Number(d.subtotal ?? d.Subtotal ?? 0);

    const cantidad = esRecibida
      ? cantidadRecibida > 0
        ? cantidadRecibida
        : cantidadSolicitada
      : cantidadSolicitada;

    const precioUnitario = esRecibida
      ? costoReal > 0
        ? costoReal
        : costoEstimado
      : costoEstimado;

    const totalLinea =
      esRecibida && subtotalApi > 0 ? subtotalApi : cantidad * precioUnitario;

    const descripcion = [productoNombre, color].filter(Boolean).join(" · ") || productoNombre || "—";
    return {
      descripcion,
      color: color || "—",
      talla: tallaNombre || "—",
      sku: sku || "—",
      codigoBarras: "—",
      cantidad,
      precioUnitario,
      precioEstimado: costoEstimado,
      totalLinea,
      usaPrecioFinal: esRecibida,
    };
  });
}
