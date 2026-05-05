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

export function mapCompraApiToListRow(api) {
  const idCompra = api.idCompra ?? api.IdCompra;
  const fechaCompra = api.fechaCompra ?? api.FechaCompra;
  const fechaRecepcion = api.fechaRecepcion ?? api.FechaRecepcion ?? null;
  const proveedorNombre = api.proveedorNombre ?? api.ProveedorNombre ?? "";
  const numeroOrden = api.numeroOrden ?? api.NumeroOrden;
  const tipoNombre = api.tipoComprobanteNombre ?? api.TipoComprobanteNombre;
  const total = Number(api.total ?? api.Total ?? 0);
  const estadoCompra = api.estadoCompra ?? api.EstadoCompra;

  return {
    id: String(idCompra),
    idCompra,
    no: idCompra,
    fechaPedido: fechaCompra ? String(fechaCompra) : "",
    fechaRecepcion: fechaRecepcion ? String(fechaRecepcion) : null,
    proveedor: { nombre: proveedorNombre, iniciales: inicialesProveedor(proveedorNombre) },
    comprobante: numeroOrden ? String(numeroOrden) : tipoNombre ? String(tipoNombre) : "—",
    total,
    estado: mapEstadoCompraUi(estadoCompra),
    estadoCompraRaw: estadoCompra,
    tipoComprobante: tipoNombre || "",
    notasProveedor: api.observacion ?? api.Observacion ?? "",
    items: mapDetallesToItems(api.detalles ?? api.Detalles ?? []),
  };
}

export function mapDetallesToItems(detalles) {
  const list = Array.isArray(detalles) ? detalles : [];
  return list.map((d) => {
    const productoNombre = d.productoNombre ?? d.ProductoNombre ?? "";
    const color = d.color ?? d.Color ?? "";
    const tallaNombre = d.tallaNombre ?? d.TallaNombre ?? "";
    const sku = d.sku ?? d.Sku ?? "";
    const cantidad = Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 0);
    const precioUnitario = Number(d.costoEstimado ?? d.CostoEstimado ?? 0);
    const descripcion = [productoNombre, color].filter(Boolean).join(" · ") || productoNombre || "—";
    return {
      descripcion,
      color: color || "—",
      talla: tallaNombre || "—",
      sku: sku || "—",
      codigoBarras: "—",
      cantidad,
      precioUnitario,
    };
  });
}
