import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";
import { mapCompraApiToListRow, mapEstadoCompraUi } from "@/lib/comprasMappers";
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
    idUsuario: toNumberOrNull(pick(raw, "idUsuario", "IdUsuario")),
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

/** Flujo diario — CompraFlujoDiarioDto */
export function mapCompraFlujoDiario(raw) {
  if (!raw) return null;
  const fecha = pick(raw, "fecha", "Fecha");
  if (!fecha) return null;
  return {
    fecha: String(fecha).slice(0, 10),
    monto: Number(pick(raw, "monto", "Monto") ?? 0),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Ranking proveedor — CompraPorProveedorDto */
export function mapCompraPorProveedor(raw) {
  if (!raw) return null;
  const idProveedor = toNumberOrNull(pick(raw, "idProveedor", "IdProveedor"));
  const proveedorNombre = String(
    pick(raw, "proveedorNombre", "ProveedorNombre") ?? ""
  ).trim();
  if (idProveedor == null && !proveedorNombre) return null;
  return {
    idProveedor,
    proveedorNombre: proveedorNombre || `Proveedor #${idProveedor}`,
    montoTotal: Number(pick(raw, "montoTotal", "MontoTotal") ?? 0),
    cantidadCompras: Number(pick(raw, "cantidadCompras", "CantidadCompras") ?? 0),
  };
}

/** Distribución por estado — CompraPorEstadoDto */
export function mapCompraPorEstado(raw) {
  if (!raw) return null;
  const estadoCompra = String(pick(raw, "estadoCompra", "EstadoCompra") ?? "").trim();
  if (!estadoCompra) return null;
  return {
    estadoCompra,
    estadoLabel: mapEstadoCompraUi(estadoCompra),
    montoTotal: Number(pick(raw, "montoTotal", "MontoTotal") ?? 0),
    cantidadCompras: Number(pick(raw, "cantidadCompras", "CantidadCompras") ?? 0),
  };
}

/**
 * Resumen del período — GET /api/reportes/compras/resumen-periodo
 * (ReporteCompraResumenPeriodoResponse)
 */
export function unwrapComprasResumenPeriodo(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const flujoRaw = pick(inner, "flujoDiario", "FlujoDiario") ?? [];
  const proveedorRaw = pick(inner, "porProveedor", "PorProveedor") ?? [];
  const estadoRaw = pick(inner, "porEstado", "PorEstado") ?? [];

  const flujoDiario = unwrapList(flujoRaw)
    .map(mapCompraFlujoDiario)
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const porProveedor = unwrapList(proveedorRaw)
    .map(mapCompraPorProveedor)
    .filter(Boolean);

  const porEstado = unwrapList(estadoRaw)
    .map(mapCompraPorEstado)
    .filter(Boolean);

  return {
    resumen: {
      totalCompras: Number(pick(resumenRaw, "totalCompras", "TotalCompras") ?? 0),
      montoTotal: Number(pick(resumenRaw, "montoTotal", "MontoTotal") ?? 0),
      montoRecibido: Number(pick(resumenRaw, "montoRecibido", "MontoRecibido") ?? 0),
      montoEnProceso: Number(pick(resumenRaw, "montoEnProceso", "MontoEnProceso") ?? 0),
      montoAnulado: Number(pick(resumenRaw, "montoAnulado", "MontoAnulado") ?? 0),
      fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
      fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    },
    flujoDiario,
    porProveedor,
    porEstado,
  };
}

/** Flujo diario — AjusteFlujoDiarioDto */
export function mapAjusteFlujoDiario(raw) {
  if (!raw) return null;
  const fecha = pick(raw, "fecha", "Fecha");
  if (!fecha) return null;
  return {
    fecha: String(fecha).slice(0, 10),
    unidadesEntrada: Math.abs(
      Number(pick(raw, "unidadesEntrada", "UnidadesEntrada") ?? 0)
    ),
    unidadesSalida: Math.abs(
      Number(pick(raw, "unidadesSalida", "UnidadesSalida") ?? 0)
    ),
    cantidadAjustes: Number(pick(raw, "cantidadAjustes", "CantidadAjustes") ?? 0),
  };
}

/** Distribución por tipo — AjustePorTipoDto */
export function mapAjustePorTipo(raw) {
  if (!raw) return null;
  const idTipoAjuste = toNumberOrNull(pick(raw, "idTipoAjuste", "IdTipoAjuste"));
  const tipoAjusteNombre = String(
    pick(raw, "tipoAjusteNombre", "TipoAjusteNombre") ?? ""
  ).trim();
  if (idTipoAjuste == null && !tipoAjusteNombre) return null;
  return {
    idTipoAjuste,
    tipoAjusteNombre: tipoAjusteNombre || `Tipo #${idTipoAjuste}`,
    naturaleza: String(pick(raw, "naturaleza", "Naturaleza") ?? "").trim(),
    unidades: Math.abs(Number(pick(raw, "unidades", "Unidades") ?? 0)),
    costo: Math.abs(Number(pick(raw, "costo", "Costo") ?? 0)),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Ranking producto — AjustePorProductoDto */
export function mapAjustePorProducto(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  const productoNombre = String(
    pick(raw, "productoNombre", "ProductoNombre") ?? ""
  ).trim();
  if (idVariante == null && !productoNombre) return null;
  const varianteNombre = String(
    pick(raw, "varianteNombre", "VarianteNombre") ?? ""
  ).trim();
  return {
    idVariante,
    productoNombre: productoNombre || `Variante #${idVariante}`,
    varianteNombre,
    sku: String(pick(raw, "sku", "Sku") ?? "").trim(),
    unidadesAjustadas: Math.abs(
      Number(pick(raw, "unidadesAjustadas", "UnidadesAjustadas") ?? 0)
    ),
    costoCargado: Math.abs(Number(pick(raw, "costoCargado", "CostoCargado") ?? 0)),
    cantidadTransacciones: Number(
      pick(raw, "cantidadTransacciones", "CantidadTransacciones") ?? 0
    ),
    etiqueta: [productoNombre, varianteNombre].filter(Boolean).join(" · ") || "Producto",
  };
}

/**
 * Resumen del período — GET /api/reportes/ajustes/resumen-periodo
 * (ReporteAjusteResumenPeriodoResponse)
 */
export function unwrapAjustesResumenPeriodo(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const flujoRaw = pick(inner, "flujoDiario", "FlujoDiario") ?? [];
  const tipoRaw = pick(inner, "porTipo", "PorTipo") ?? [];
  const productoRaw = pick(inner, "porProducto", "PorProducto") ?? [];

  return {
    resumen: {
      totalAjustes: Number(pick(resumenRaw, "totalAjustes", "TotalAjustes") ?? 0),
      totalLineas: Number(pick(resumenRaw, "totalLineas", "TotalLineas") ?? 0),
      unidadesEntrada: Math.abs(
        Number(pick(resumenRaw, "unidadesEntrada", "UnidadesEntrada") ?? 0)
      ),
      unidadesSalida: Math.abs(
        Number(pick(resumenRaw, "unidadesSalida", "UnidadesSalida") ?? 0)
      ),
      costoEntrada: Math.abs(
        Number(pick(resumenRaw, "costoEntrada", "CostoEntrada") ?? 0)
      ),
      costoSalida: Math.abs(
        Number(pick(resumenRaw, "costoSalida", "CostoSalida") ?? 0)
      ),
      fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
      fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    },
    flujoDiario: unwrapList(flujoRaw)
      .map(mapAjusteFlujoDiario)
      .filter(Boolean)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    porTipo: unwrapList(tipoRaw).map(mapAjustePorTipo).filter(Boolean),
    porProducto: unwrapList(productoRaw).map(mapAjustePorProducto).filter(Boolean),
  };
}

/** Flujo diario — ReembolsoFlujoDiarioDto */
export function mapReembolsoFlujoDiario(raw) {
  if (!raw) return null;
  const fecha = pick(raw, "fecha", "Fecha");
  if (!fecha) return null;
  return {
    fecha: String(fecha).slice(0, 10),
    monto: Math.abs(Number(pick(raw, "monto", "Monto") ?? 0)),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Distribución por motivo — ReembolsoPorMotivoDto */
export function mapReembolsoPorMotivo(raw) {
  if (!raw) return null;
  const motivo = String(pick(raw, "motivo", "Motivo") ?? "").trim();
  if (!motivo) return null;
  return {
    motivo,
    monto: Math.abs(Number(pick(raw, "monto", "Monto") ?? 0)),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Ranking producto — ReembolsoPorProductoDto */
export function mapReembolsoPorProducto(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  const productoNombre = String(
    pick(raw, "productoNombre", "ProductoNombre") ?? ""
  ).trim();
  if (idVariante == null && !productoNombre) return null;
  const varianteNombre = String(
    pick(raw, "varianteNombre", "VarianteNombre") ?? ""
  ).trim();
  return {
    idVariante,
    productoNombre: productoNombre || `Variante #${idVariante}`,
    varianteNombre,
    sku: String(pick(raw, "sku", "Sku") ?? "").trim(),
    unidadesDevueltas: Math.abs(
      Number(pick(raw, "unidadesDevueltas", "UnidadesDevueltas") ?? 0)
    ),
    montoReembolsado: Math.abs(
      Number(pick(raw, "montoReembolsado", "MontoReembolsado") ?? 0)
    ),
    cantidadTransacciones: Number(
      pick(raw, "cantidadTransacciones", "CantidadTransacciones") ?? 0
    ),
    etiqueta:
      [productoNombre, varianteNombre].filter(Boolean).join(" · ") || "Producto",
  };
}

/** Por cajero — ReembolsoPorCajeroDto */
export function mapReembolsoPorCajero(raw) {
  if (!raw) return null;
  const idUsuario = toNumberOrNull(pick(raw, "idUsuario", "IdUsuario"));
  const cajeroNombre = String(
    pick(raw, "cajeroNombre", "CajeroNombre", "usuarioNombre", "UsuarioNombre") ??
      ""
  ).trim();
  if (idUsuario == null && !cajeroNombre) return null;
  return {
    idUsuario,
    cajeroNombre: cajeroNombre || `Usuario #${idUsuario}`,
    montoTotal: Math.abs(Number(pick(raw, "montoTotal", "MontoTotal") ?? 0)),
    cantidadReembolsos: Number(
      pick(raw, "cantidadReembolsos", "CantidadReembolsos") ?? 0
    ),
  };
}

/**
 * Resumen del período — GET /api/reportes/reembolsos/resumen-periodo
 * (ReporteReembolsoResumenPeriodoResponse)
 */
export function unwrapReembolsosResumenPeriodo(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const flujoRaw = pick(inner, "flujoDiario", "FlujoDiario") ?? [];
  const motivoRaw = pick(inner, "porMotivo", "PorMotivo") ?? [];
  const productoRaw = pick(inner, "porProducto", "PorProducto") ?? [];
  const cajeroRaw = pick(inner, "porCajero", "PorCajero") ?? [];

  return {
    resumen: {
      totalReembolsos: Number(
        pick(resumenRaw, "totalReembolsos", "TotalReembolsos") ?? 0
      ),
      montoTotal: Math.abs(
        Number(pick(resumenRaw, "montoTotal", "MontoTotal") ?? 0)
      ),
      unidadesDevueltas: Math.abs(
        Number(pick(resumenRaw, "unidadesDevueltas", "UnidadesDevueltas") ?? 0)
      ),
      ticketPromedioReembolso: Math.abs(
        Number(
          pick(
            resumenRaw,
            "ticketPromedioReembolso",
            "TicketPromedioReembolso"
          ) ?? 0
        )
      ),
      fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
      fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    },
    flujoDiario: unwrapList(flujoRaw)
      .map(mapReembolsoFlujoDiario)
      .filter(Boolean)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    porMotivo: unwrapList(motivoRaw).map(mapReembolsoPorMotivo).filter(Boolean),
    porProducto: unwrapList(productoRaw)
      .map(mapReembolsoPorProducto)
      .filter(Boolean),
    porCajero: unwrapList(cajeroRaw).map(mapReembolsoPorCajero).filter(Boolean),
  };
}

/** Flujo diario — CotizacionFlujoDiarioDto */
export function mapCotizacionFlujoDiario(raw) {
  if (!raw) return null;
  const fecha = pick(raw, "fecha", "Fecha");
  if (!fecha) return null;
  return {
    fecha: String(fecha).slice(0, 10),
    monto: Number(pick(raw, "monto", "Monto") ?? 0),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Por estado — CotizacionPorEstadoDto */
export function mapCotizacionPorEstado(raw) {
  if (!raw) return null;
  const estado = String(pick(raw, "estado", "Estado") ?? "").trim();
  if (!estado) return null;
  return {
    estado,
    monto: Number(pick(raw, "monto", "Monto") ?? 0),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Ranking cliente — CotizacionPorClienteDto */
export function mapCotizacionPorCliente(raw) {
  if (!raw) return null;
  const idCliente = toNumberOrNull(pick(raw, "idCliente", "IdCliente"));
  const clienteNombre = String(
    pick(raw, "clienteNombre", "ClienteNombre") ?? ""
  ).trim();
  if (idCliente == null && !clienteNombre) return null;
  return {
    idCliente,
    clienteNombre: clienteNombre || `Cliente #${idCliente}`,
    montoTotal: Number(pick(raw, "montoTotal", "MontoTotal") ?? 0),
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
  };
}

/** Ranking producto — CotizacionPorProductoDto */
export function mapCotizacionPorProducto(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  const productoNombre = String(
    pick(raw, "productoNombre", "ProductoNombre") ?? ""
  ).trim();
  if (idVariante == null && !productoNombre) return null;
  const varianteNombre = String(
    pick(raw, "varianteNombre", "VarianteNombre") ?? ""
  ).trim();
  return {
    idVariante,
    productoNombre: productoNombre || `Variante #${idVariante}`,
    varianteNombre,
    sku: String(pick(raw, "sku", "Sku") ?? "").trim(),
    unidadesCotizadas: Math.abs(
      Number(pick(raw, "unidadesCotizadas", "UnidadesCotizadas") ?? 0)
    ),
    montoTotal: Number(pick(raw, "montoTotal", "MontoTotal") ?? 0),
    cantidadTransacciones: Number(
      pick(raw, "cantidadTransacciones", "CantidadTransacciones") ?? 0
    ),
    etiqueta:
      [productoNombre, varianteNombre].filter(Boolean).join(" · ") || "Producto",
  };
}

/**
 * Resumen del período — GET /api/reportes/cotizaciones/resumen-periodo
 * (ReporteCotizacionResumenPeriodoResponse)
 */
export function unwrapCotizacionesResumenPeriodo(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const flujoRaw = pick(inner, "flujoDiario", "FlujoDiario") ?? [];
  const estadoRaw = pick(inner, "porEstado", "PorEstado") ?? [];
  const clienteRaw = pick(inner, "porCliente", "PorCliente") ?? [];
  const productoRaw = pick(inner, "porProducto", "PorProducto") ?? [];

  return {
    resumen: {
      totalCotizaciones: Number(
        pick(resumenRaw, "totalCotizaciones", "TotalCotizaciones") ?? 0
      ),
      montoTotal: Number(pick(resumenRaw, "montoTotal", "MontoTotal") ?? 0),
      convertidas: Number(pick(resumenRaw, "convertidas", "Convertidas") ?? 0),
      pendientes: Number(pick(resumenRaw, "pendientes", "Pendientes") ?? 0),
      vencidas: Number(pick(resumenRaw, "vencidas", "Vencidas") ?? 0),
      anuladas: Number(pick(resumenRaw, "anuladas", "Anuladas") ?? 0),
      tasaConversion: Number(
        pick(resumenRaw, "tasaConversion", "TasaConversion") ?? 0
      ),
      montoConvertido: Number(
        pick(resumenRaw, "montoConvertido", "MontoConvertido") ?? 0
      ),
      montoPendiente: Number(
        pick(resumenRaw, "montoPendiente", "MontoPendiente") ?? 0
      ),
      fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
      fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    },
    flujoDiario: unwrapList(flujoRaw)
      .map(mapCotizacionFlujoDiario)
      .filter(Boolean)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    porEstado: unwrapList(estadoRaw).map(mapCotizacionPorEstado).filter(Boolean),
    porCliente: unwrapList(clienteRaw)
      .map(mapCotizacionPorCliente)
      .filter(Boolean),
    porProducto: unwrapList(productoRaw)
      .map(mapCotizacionPorProducto)
      .filter(Boolean),
  };
}

/** Distribución por categoría — CatalogoPorCategoriaDto */
export function mapCatalogoPorCategoria(raw) {
  if (!raw) return null;
  const categoriaId = toNumberOrNull(
    pick(raw, "categoriaId", "CategoriaId", "idCategoria", "IdCategoria")
  );
  const categoriaNombre = String(
    pick(raw, "categoriaNombre", "CategoriaNombre") ?? ""
  ).trim();
  if (categoriaId == null && !categoriaNombre) return null;
  return {
    categoriaId,
    categoriaNombre: categoriaNombre || `Categoría #${categoriaId}`,
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
    porcentaje: Number(pick(raw, "porcentaje", "Porcentaje") ?? 0),
  };
}

/** Distribución por marca — CatalogoPorMarcaDto */
export function mapCatalogoPorMarca(raw) {
  if (!raw) return null;
  const marcaId = toNumberOrNull(
    pick(raw, "marcaId", "MarcaId", "idMarca", "IdMarca")
  );
  const marcaNombre = String(
    pick(raw, "marcaNombre", "MarcaNombre") ?? ""
  ).trim();
  if (marcaId == null && !marcaNombre) return null;
  return {
    marcaId,
    marcaNombre: marcaNombre || `Marca #${marcaId}`,
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
    porcentaje: Number(pick(raw, "porcentaje", "Porcentaje") ?? 0),
  };
}

/** Buckets de precio — CatalogoRangosPrecioDto */
export function mapCatalogoRangoPrecio(raw) {
  if (!raw) return null;
  const rango = String(pick(raw, "rango", "Rango") ?? "").trim();
  if (!rango) return null;
  return {
    rango,
    cantidad: Number(pick(raw, "cantidad", "Cantidad") ?? 0),
    porcentaje: Number(pick(raw, "porcentaje", "Porcentaje") ?? 0),
  };
}

/**
 * Resumen de surtido — GET /api/reportes/catalogo/resumen
 * (ReporteCatalogoResumenResponse)
 */
export function unwrapCatalogoResumen(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const catRaw = pick(inner, "porCategoria", "PorCategoria") ?? [];
  const marcaRaw = pick(inner, "porMarca", "PorMarca") ?? [];
  const rangoRaw = pick(inner, "rangosPrecio", "RangosPrecio") ?? [];

  return {
    resumen: {
      totalProductos: Number(
        pick(resumenRaw, "totalProductos", "TotalProductos") ?? 0
      ),
      totalVariantes: Number(
        pick(resumenRaw, "totalVariantes", "TotalVariantes") ?? 0
      ),
      activos: Number(pick(resumenRaw, "activos", "Activos") ?? 0),
      inactivos: Number(pick(resumenRaw, "inactivos", "Inactivos") ?? 0),
      sinPrecioMenudeo: Number(
        pick(resumenRaw, "sinPrecioMenudeo", "SinPrecioMenudeo") ?? 0
      ),
      sinPrecioMayoreo: Number(
        pick(resumenRaw, "sinPrecioMayoreo", "SinPrecioMayoreo") ?? 0
      ),
    },
    porCategoria: unwrapList(catRaw).map(mapCatalogoPorCategoria).filter(Boolean),
    porMarca: unwrapList(marcaRaw).map(mapCatalogoPorMarca).filter(Boolean),
    rangosPrecio: unwrapList(rangoRaw).map(mapCatalogoRangoPrecio).filter(Boolean),
  };
}

/** Variante del catálogo — ReporteCatalogoVarianteDto */
export function mapCatalogoVarianteReporte(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  if (idVariante == null) return null;

  const precioMenudeoRaw = pick(raw, "precioMenudeo", "PrecioMenudeo");
  const precioMayoreoRaw = pick(raw, "precioMayoreo", "PrecioMayoreo");
  const precioMenudeo =
    precioMenudeoRaw == null || precioMenudeoRaw === ""
      ? null
      : Number(precioMenudeoRaw);
  const precioMayoreo =
    precioMayoreoRaw == null || precioMayoreoRaw === ""
      ? null
      : Number(precioMayoreoRaw);

  const productoNombre = String(
    pick(raw, "productoNombre", "ProductoNombre") ?? ""
  ).trim();
  const varianteNombre = String(
    pick(raw, "varianteNombre", "VarianteNombre") ?? ""
  ).trim();

  return {
    idVariante,
    idProducto: toNumberOrNull(pick(raw, "idProducto", "IdProducto")),
    productoNombre: productoNombre || "Producto",
    varianteNombre,
    sku: String(pick(raw, "sku", "Sku") ?? "").trim(),
    categoriaNombre: String(
      pick(raw, "categoriaNombre", "CategoriaNombre") ?? ""
    ).trim(),
    marcaNombre: String(pick(raw, "marcaNombre", "MarcaNombre") ?? "").trim(),
    precioMenudeo:
      precioMenudeo != null && !Number.isNaN(precioMenudeo) ? precioMenudeo : null,
    precioMayoreo:
      precioMayoreo != null && !Number.isNaN(precioMayoreo) ? precioMayoreo : null,
    estadoCatalogo: String(
      pick(raw, "estadoCatalogo", "EstadoCatalogo") ?? ""
    )
      .trim()
      .toUpperCase(),
    estado: Boolean(pick(raw, "estado", "Estado") ?? true),
    etiqueta:
      [productoNombre, varianteNombre].filter(Boolean).join(" · ") || "Variante",
  };
}

/** Listado paginado — GET /api/reportes/catalogo/variantes */
export function unwrapCatalogoVariantesPaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const paged = unwrapPaged(inner);
  return {
    ...paged,
    items: paged.items.map(mapCatalogoVarianteReporte).filter(Boolean),
  };
}

/** Variante valorizada — ReporteInventarioValorizacionVarianteDto */
export function mapInventarioValorizacionVariante(raw) {
  if (!raw) return null;
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  if (idVariante == null) return null;

  const productoNombre = String(
    pick(raw, "productoNombre", "ProductoNombre") ?? ""
  ).trim();
  const varianteNombre = String(
    pick(raw, "varianteNombre", "VarianteNombre") ?? ""
  ).trim();
  const precioMenudeoRaw = pick(raw, "precioMenudeo", "PrecioMenudeo");
  const precioMenudeo =
    precioMenudeoRaw == null || precioMenudeoRaw === ""
      ? null
      : Number(precioMenudeoRaw);

  return {
    idVariante,
    idProducto: toNumberOrNull(pick(raw, "idProducto", "IdProducto")),
    productoNombre: productoNombre || "Producto",
    varianteNombre,
    sku: String(pick(raw, "sku", "Sku") ?? "").trim(),
    categoriaId: toNumberOrNull(pick(raw, "categoriaId", "CategoriaId")),
    categoriaNombre: String(
      pick(raw, "categoriaNombre", "CategoriaNombre") ?? ""
    ).trim(),
    marcaId: toNumberOrNull(pick(raw, "marcaId", "MarcaId")),
    marcaNombre: String(pick(raw, "marcaNombre", "MarcaNombre") ?? "").trim(),
    stockTotal: Number(pick(raw, "stockTotal", "StockTotal") ?? 0),
    costoUnitarioValuado: Number(
      pick(raw, "costoUnitarioValuado", "CostoUnitarioValuado") ?? 0
    ),
    valorCostoTotal: Number(
      pick(raw, "valorCostoTotal", "ValorCostoTotal") ?? 0
    ),
    precioMenudeo:
      precioMenudeo != null && !Number.isNaN(precioMenudeo) ? precioMenudeo : null,
    valorVentaTotal: Number(
      pick(raw, "valorVentaTotal", "ValorVentaTotal") ?? 0
    ),
    margenPotencial: Number(
      pick(raw, "margenPotencial", "MargenPotencial") ?? 0
    ),
    etiqueta:
      [productoNombre, varianteNombre].filter(Boolean).join(" · ") || "Variante",
  };
}

export function mapValorizacionPorCategoria(raw) {
  if (!raw) return null;
  const categoriaId = toNumberOrNull(
    pick(raw, "categoriaId", "CategoriaId", "idCategoria", "IdCategoria")
  );
  const categoriaNombre = String(
    pick(raw, "categoriaNombre", "CategoriaNombre") ?? ""
  ).trim();
  if (categoriaId == null && !categoriaNombre) return null;
  return {
    categoriaId,
    categoriaNombre: categoriaNombre || `Categoría #${categoriaId}`,
    variantesConStock: Number(
      pick(raw, "variantesConStock", "VariantesConStock") ?? 0
    ),
    unidades: Number(pick(raw, "unidades", "Unidades") ?? 0),
    valorCosto: Number(pick(raw, "valorCosto", "ValorCosto") ?? 0),
    valorVenta: Number(pick(raw, "valorVenta", "ValorVenta") ?? 0),
    porcentajeDelCapital: Number(
      pick(raw, "porcentajeDelCapital", "PorcentajeDelCapital") ?? 0
    ),
  };
}

export function mapValorizacionPorMarca(raw) {
  if (!raw) return null;
  const marcaId = toNumberOrNull(
    pick(raw, "marcaId", "MarcaId", "idMarca", "IdMarca")
  );
  const marcaNombre = String(
    pick(raw, "marcaNombre", "MarcaNombre") ?? ""
  ).trim();
  if (marcaId == null && !marcaNombre) return null;
  return {
    marcaId,
    marcaNombre: marcaNombre || `Marca #${marcaId}`,
    variantesConStock: Number(
      pick(raw, "variantesConStock", "VariantesConStock") ?? 0
    ),
    unidades: Number(pick(raw, "unidades", "Unidades") ?? 0),
    valorCosto: Number(pick(raw, "valorCosto", "ValorCosto") ?? 0),
    valorVenta: Number(pick(raw, "valorVenta", "ValorVenta") ?? 0),
    porcentajeDelCapital: Number(
      pick(raw, "porcentajeDelCapital", "PorcentajeDelCapital") ?? 0
    ),
  };
}

export function mapValorizacionRangoCosto(raw) {
  if (!raw) return null;
  const rango = String(pick(raw, "rango", "Rango") ?? "").trim();
  if (!rango) return null;
  return {
    rango,
    variantes: Number(pick(raw, "variantes", "Variantes") ?? 0),
    valorCosto: Number(pick(raw, "valorCosto", "ValorCosto") ?? 0),
    porcentajeDelCapital: Number(
      pick(raw, "porcentajeDelCapital", "PorcentajeDelCapital") ?? 0
    ),
  };
}

/**
 * Resumen capital — GET /api/reportes/inventario/valorizacion
 */
export function unwrapInventarioValorizacion(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const catRaw = pick(inner, "porCategoria", "PorCategoria") ?? [];
  const marcaRaw = pick(inner, "porMarca", "PorMarca") ?? [];
  const rangoRaw = pick(inner, "rangosCosto", "RangosCosto") ?? [];
  const topRaw =
    pick(inner, "topVariantesPorValor", "TopVariantesPorValor") ?? [];

  return {
    resumen: {
      valorCostoTotal: Number(
        pick(resumenRaw, "valorCostoTotal", "ValorCostoTotal") ?? 0
      ),
      valorVentaMenudeoTotal: Number(
        pick(resumenRaw, "valorVentaMenudeoTotal", "ValorVentaMenudeoTotal") ?? 0
      ),
      valorVentaMayoreoTotal: Number(
        pick(resumenRaw, "valorVentaMayoreoTotal", "ValorVentaMayoreoTotal") ?? 0
      ),
      margenPotencial: Number(
        pick(resumenRaw, "margenPotencial", "MargenPotencial") ?? 0
      ),
      unidadesTotales: Number(
        pick(resumenRaw, "unidadesTotales", "UnidadesTotales") ?? 0
      ),
      variantesConStock: Number(
        pick(resumenRaw, "variantesConStock", "VariantesConStock") ?? 0
      ),
      variantesSinCosto: Number(
        pick(resumenRaw, "variantesSinCosto", "VariantesSinCosto") ?? 0
      ),
      variantesSinPrecio: Number(
        pick(resumenRaw, "variantesSinPrecio", "VariantesSinPrecio") ?? 0
      ),
      metodoValuacion: String(
        pick(resumenRaw, "metodoValuacion", "MetodoValuacion") ?? ""
      ).trim(),
    },
    porCategoria: unwrapList(catRaw)
      .map(mapValorizacionPorCategoria)
      .filter(Boolean),
    porMarca: unwrapList(marcaRaw).map(mapValorizacionPorMarca).filter(Boolean),
    rangosCosto: unwrapList(rangoRaw)
      .map(mapValorizacionRangoCosto)
      .filter(Boolean),
    topVariantesPorValor: unwrapList(topRaw)
      .map(mapInventarioValorizacionVariante)
      .filter(Boolean),
  };
}

/** Listado — GET /api/reportes/inventario/valorizacion/variantes */
export function unwrapInventarioValorizacionVariantesPaged(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const paged = unwrapPaged(inner);
  return {
    ...paged,
    items: paged.items.map(mapInventarioValorizacionVariante).filter(Boolean),
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

/** Sesión/turno de caja — GET /api/reportes/caja/sesiones (CajaSesionDto) */
export function mapCajaSesionReporte(raw) {
  if (!raw) return null;
  const idCaja = toNumberOrNull(pick(raw, "idCaja", "IdCaja"));
  if (idCaja == null) return null;

  const montoEsperadoRaw = pick(
    raw,
    "montoCierreEsperado",
    "MontoCierreEsperado",
    "montoEsperado",
    "MontoEsperado"
  );
  const montoRealRaw = pick(
    raw,
    "montoCierreReal",
    "MontoCierreReal",
    "montoReal",
    "MontoReal"
  );
  const diferenciaRaw = pick(raw, "diferencia", "Diferencia");

  const montoEsperado =
    montoEsperadoRaw == null || montoEsperadoRaw === "" ? null : Number(montoEsperadoRaw);
  const montoReal =
    montoRealRaw == null || montoRealRaw === "" ? null : Number(montoRealRaw);
  let diferencia =
    diferenciaRaw == null || diferenciaRaw === "" ? null : Number(diferenciaRaw);

  // Si el backend no guardó diferencia pero hay real y esperado, calcularla.
  if (
    (diferencia == null || Number.isNaN(diferencia)) &&
    montoReal != null &&
    montoEsperado != null
  ) {
    diferencia = Math.round((montoReal - montoEsperado) * 100) / 100;
  }

  // Sin esperado, un 0 en diferencia suele ser dato vacío (no sobrante/faltante real).
  if (montoEsperado == null && (diferencia == null || diferencia === 0)) {
    diferencia = null;
  }

  return {
    idCaja,
    estado: String(pick(raw, "estado", "Estado") ?? "").trim(),
    fechaApertura: pick(raw, "fechaApertura", "FechaApertura") ?? null,
    fechaCierre: pick(raw, "fechaCierre", "FechaCierre") ?? null,
    montoApertura: Number(pick(raw, "montoApertura", "MontoApertura") ?? 0),
    montoEsperado,
    montoReal,
    diferencia,
    usuarioAperturaNombre: String(
      pick(
        raw,
        "usuarioAperturaNombre",
        "UsuarioAperturaNombre",
        "nombreUsuarioApertura",
        "NombreUsuarioApertura"
      ) ?? ""
    ).trim(),
    usuarioCierreNombre: String(
      pick(
        raw,
        "usuarioCierreNombre",
        "UsuarioCierreNombre",
        "nombreUsuarioCierre",
        "NombreUsuarioCierre"
      ) ?? ""
    ).trim(),
  };
}

export function unwrapCajaSesionesReporte(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const paged = unwrapPaged(inner);
  return {
    ...paged,
    items: paged.items.map(mapCajaSesionReporte).filter(Boolean),
  };
}

/** Flujo diario — CajaResumenFlujoDiarioDto */
export function mapCajaFlujoDiario(raw) {
  if (!raw) return null;
  const fecha =
    pick(raw, "fecha", "Fecha", "dia", "Dia") ??
    (typeof raw === "string" ? raw : null);
  if (!fecha) return null;
  const fechaKey = String(fecha).slice(0, 10);
  return {
    fecha: fechaKey,
    totalEntradas: Number(
      pick(raw, "totalEntradas", "TotalEntradas", "entradas", "Entradas") ?? 0
    ),
    totalSalidas: Number(
      pick(raw, "totalSalidas", "TotalSalidas", "salidas", "Salidas") ?? 0
    ),
    balanceNeto: Number(
      pick(raw, "balanceNeto", "BalanceNeto", "balance", "Balance") ?? 0
    ),
  };
}

/** Resumen del período — GET /api/reportes/caja/resumen-periodo */
export function unwrapCajaResumenPeriodo(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  // KPIs vienen anidados en `resumen` (ReporteCajaResumenPeriodoResponse).
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? inner;
  const flujoRaw =
    pick(inner, "flujoDiario", "FlujoDiario", "flujo", "Flujo", "dias", "Dias") ??
    [];

  const flujoDiario = unwrapList(flujoRaw)
    .map(mapCajaFlujoDiario)
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    totalSesiones: Number(
      pick(resumenRaw, "totalSesiones", "TotalSesiones") ?? 0
    ),
    totalAperturas: Number(
      pick(resumenRaw, "totalAperturas", "TotalAperturas") ?? 0
    ),
    totalCierresReales: Number(
      pick(resumenRaw, "totalCierresReales", "TotalCierresReales") ?? 0
    ),
    ventasEfectivo: Number(
      pick(
        resumenRaw,
        "totalVentasEfectivo",
        "TotalVentasEfectivo",
        "ventasEfectivo",
        "VentasEfectivo"
      ) ?? 0
    ),
    reembolsosEfectivo: Number(
      pick(
        resumenRaw,
        "totalReembolsosEfectivo",
        "TotalReembolsosEfectivo",
        "reembolsosEfectivo",
        "ReembolsosEfectivo"
      ) ?? 0
    ),
    ingresosManuales: Number(
      pick(
        resumenRaw,
        "totalIngresosManuales",
        "TotalIngresosManuales",
        "ingresosManuales",
        "IngresosManuales"
      ) ?? 0
    ),
    egresosManuales: Number(
      pick(
        resumenRaw,
        "totalEgresosManuales",
        "TotalEgresosManuales",
        "egresosManuales",
        "EgresosManuales"
      ) ?? 0
    ),
    totalDiferencia: Number(
      pick(
        resumenRaw,
        "diferenciaNeta",
        "DiferenciaNeta",
        "totalDiferencia",
        "TotalDiferencia"
      ) ?? 0
    ),
    fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
    fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    flujoDiario,
  };
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

function fechaClaveDia(iso) {
  if (!iso) return null;
  const s = String(iso);
  if (s.length >= 10) return s.slice(0, 10);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Agrega métricas de rendimiento a partir de ventas del período.
 * Agrupa por cajero y por día.
 */
export function construirMetricasRendimiento(ventas = []) {
  const items = Array.isArray(ventas) ? ventas : [];
  const porCajeroMap = new Map();
  const porDiaMap = new Map();

  let totalMonto = 0;
  let totalTickets = 0;

  for (const v of items) {
    const monto = Number(v.total) || 0;
    const cajero = String(v.usuarioNombre || "Sin cajero").trim() || "Sin cajero";
    const idUsuario = v.idUsuario ?? null;
    const dia = fechaClaveDia(v.fechaHora);

    totalMonto += monto;
    totalTickets += 1;

    const prevCajero = porCajeroMap.get(cajero) ?? {
      cajero,
      idUsuario,
      tickets: 0,
      monto: 0,
    };
    prevCajero.tickets += 1;
    prevCajero.monto += monto;
    if (prevCajero.idUsuario == null && idUsuario != null) prevCajero.idUsuario = idUsuario;
    porCajeroMap.set(cajero, prevCajero);

    if (dia) {
      const prevDia = porDiaMap.get(dia) ?? { fecha: dia, tickets: 0, monto: 0 };
      prevDia.tickets += 1;
      prevDia.monto += monto;
      porDiaMap.set(dia, prevDia);
    }
  }

  const porCajero = [...porCajeroMap.values()]
    .map((c) => ({
      ...c,
      monto: Math.round(c.monto * 100) / 100,
      ticketPromedio: c.tickets > 0 ? Math.round((c.monto / c.tickets) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.monto - a.monto);

  const porDia = [...porDiaMap.values()]
    .map((d) => ({
      ...d,
      monto: Math.round(d.monto * 100) / 100,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const ticketPromedio =
    totalTickets > 0 ? Math.round((totalMonto / totalTickets) * 100) / 100 : 0;
  const topCajero = porCajero[0] ?? null;

  return {
    totalTickets,
    totalMonto: Math.round(totalMonto * 100) / 100,
    ticketPromedio,
    cajerosActivos: porCajero.length,
    topCajero,
    porCajero,
    porDia,
  };
}

/** Ítem del ranking GET /api/reportes/ventas/productos-mas-vendidos */
export function mapProductoMasVendidoItem(raw, index = 0) {
  if (!raw) return null;
  const idProducto = toNumberOrNull(pick(raw, "idProducto", "IdProducto"));
  const idVariante = toNumberOrNull(pick(raw, "idVariante", "IdVariante"));
  const nombreProducto = String(
    pick(raw, "nombreProducto", "NombreProducto", "producto", "Producto") ?? ""
  ).trim();
  const nombreVariante = String(
    pick(raw, "nombreVariante", "NombreVariante") ?? pickNombreVariante(raw) ?? ""
  ).trim();
  const cantidadVendida = Number(
    pick(raw, "cantidadVendida", "CantidadVendida", "cantidad", "Cantidad") ?? 0
  );
  const montoVendido = Number(
    pick(raw, "montoVendido", "MontoVendido", "monto", "Monto", "total", "Total") ?? 0
  );

  if (!nombreProducto && idProducto == null && idVariante == null && cantidadVendida <= 0) {
    return null;
  }

  const etiqueta = [nombreProducto, nombreVariante].filter(Boolean).join(" · ") || "Producto";

  return {
    posicion: Number(pick(raw, "posicion", "Posicion") ?? index + 1),
    idProducto,
    idVariante,
    nombreProducto,
    nombreVariante,
    sku: String(pick(raw, "sku", "Sku", "SKU") ?? "").trim(),
    cantidadVendida,
    montoVendido: Math.round(montoVendido * 100) / 100,
    ticketPromedioLinea: Number(
      pick(raw, "ticketPromedioLinea", "TicketPromedioLinea") ?? 0
    ),
    numeroTickets: Number(pick(raw, "numeroTickets", "NumeroTickets") ?? 0),
    porcentajeCantidad: Number(
      pick(raw, "porcentajeCantidad", "PorcentajeCantidad") ?? 0
    ),
    porcentajeMonto: Number(pick(raw, "porcentajeMonto", "PorcentajeMonto") ?? 0),
    etiqueta,
  };
}

export function unwrapProductosMasVendidos(resp) {
  const inner = pick(resp, "data", "Data") ?? resp;
  const resumenRaw = pick(inner, "resumen", "Resumen") ?? {};
  const itemsRaw =
    pick(inner, "items", "Items") ??
    pick(inner, "productos", "Productos") ??
    (Array.isArray(inner) ? inner : []);

  const items = unwrapList(itemsRaw)
    .map((row, i) => mapProductoMasVendidoItem(row, i))
    .filter(Boolean);

  return {
    resumen: {
      totalUnidades: Number(
        pick(resumenRaw, "totalUnidades", "TotalUnidades") ??
          items.reduce((a, i) => a + i.cantidadVendida, 0)
      ),
      totalMonto: Number(
        pick(resumenRaw, "totalMonto", "TotalMonto") ??
          items.reduce((a, i) => a + i.montoVendido, 0)
      ),
      productosDistintos: Number(
        pick(resumenRaw, "productosDistintos", "ProductosDistintos") ?? items.length
      ),
      fechaDesde: pick(resumenRaw, "fechaDesde", "FechaDesde") ?? null,
      fechaHasta: pick(resumenRaw, "fechaHasta", "FechaHasta") ?? null,
    },
    items,
  };
}

/**
 * Agrega métricas de ventas del período (menudeo/mayoreo y tendencia diaria).
 */
export function construirMetricasVentas(ventas = []) {
  const items = Array.isArray(ventas) ? ventas : [];
  const porDiaMap = new Map();

  let totalMonto = 0;
  let totalTickets = 0;
  let menudeoTickets = 0;
  let menudeoMonto = 0;
  let mayoreoTickets = 0;
  let mayoreoMonto = 0;

  for (const v of items) {
    const monto = Number(v.total) || 0;
    const dia = fechaClaveDia(v.fechaHora);
    const esMayoreo = esVentaMayoreo(v.tipoVenta);
    const esMenudeo = esVentaMenudeo(v.tipoVenta);

    totalMonto += monto;
    totalTickets += 1;

    if (esMayoreo) {
      mayoreoTickets += 1;
      mayoreoMonto += monto;
    } else if (esMenudeo) {
      menudeoTickets += 1;
      menudeoMonto += monto;
    }

    if (dia) {
      const prev = porDiaMap.get(dia) ?? {
        fecha: dia,
        tickets: 0,
        monto: 0,
        menudeo: 0,
        mayoreo: 0,
      };
      prev.tickets += 1;
      prev.monto += monto;
      if (esMayoreo) prev.mayoreo += monto;
      else if (esMenudeo) prev.menudeo += monto;
      porDiaMap.set(dia, prev);
    }
  }

  const porDia = [...porDiaMap.values()]
    .map((d) => ({
      ...d,
      monto: Math.round(d.monto * 100) / 100,
      menudeo: Math.round(d.menudeo * 100) / 100,
      mayoreo: Math.round(d.mayoreo * 100) / 100,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const ticketPromedio =
    totalTickets > 0 ? Math.round((totalMonto / totalTickets) * 100) / 100 : 0;

  return {
    totalTickets,
    totalMonto: Math.round(totalMonto * 100) / 100,
    ticketPromedio,
    menudeo: {
      tickets: menudeoTickets,
      monto: Math.round(menudeoMonto * 100) / 100,
    },
    mayoreo: {
      tickets: mayoreoTickets,
      monto: Math.round(mayoreoMonto * 100) / 100,
    },
    porDia,
    porTipo: [
      {
        key: "MENUDEO",
        name: "Menudeo",
        tickets: menudeoTickets,
        value: Math.round(menudeoMonto * 100) / 100,
      },
      {
        key: "MAYOREO",
        name: "Mayoreo",
        tickets: mayoreoTickets,
        value: Math.round(mayoreoMonto * 100) / 100,
      },
    ].filter((t) => t.tickets > 0 || t.value > 0),
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
