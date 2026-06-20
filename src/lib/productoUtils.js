import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

export function resolverIdProducto(item) {
  if (item == null) return null;
  if (typeof item === "number" || typeof item === "string") {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return toNumberOrNull(pick(item, "idProducto", "IdProducto", "id_producto"));
}

/** Variante devuelta por GET /api/Productos/variantes/buscar → fila de inventario. */
export function normalizarVarianteBusqueda(raw) {
  if (!raw || typeof raw !== "object") return null;

  const idProducto = resolverIdProducto(raw);
  const nombre =
    pick(raw, "productoNombre", "ProductoNombre", "nombre", "Nombre") ||
    pick(raw, "presentacionNombre", "PresentacionNombre") ||
    "";

  return {
    ...raw,
    idProducto,
    idVariante: toNumberOrNull(pick(raw, "idVariante", "IdVariante")),
    nombre,
    productoNombre: pick(raw, "productoNombre", "ProductoNombre") || nombre,
    sku: pick(raw, "sku", "Sku", "codigoPrincipal", "CodigoPrincipal"),
    categoriaNombre: pick(raw, "categoriaNombre", "CategoriaNombre"),
    marcaNombre: pick(raw, "marcaNombre", "MarcaNombre"),
    estadoCatalogo: pick(raw, "estadoCatalogo", "EstadoCatalogo"),
    estado:
      pick(raw, "productoActivo", "ProductoActivo") ??
      pick(raw, "varianteActiva", "VarianteActiva") ??
      pick(raw, "estado", "Estado"),
    stockActual:
      toNumberOrNull(pick(raw, "stockActual", "StockActual", "stock", "Stock")) ?? 0,
    fechaCreacion: pick(raw, "fechaCreacion", "FechaCreacion"),
  };
}

/** GET detalle envía nombres en presentacion/talla; el listado envía IDs + *Nombre. */
function normalizarCampoCatalogoVariante(raw, idKeys, nombreKeys) {
  const nombreExplicito = pick(raw, ...nombreKeys);
  const valorCrudo = pick(raw, ...idKeys);
  const idNumerico = toNumberOrNull(valorCrudo);

  if (idNumerico != null && idNumerico > 0) {
    const nombre =
      typeof nombreExplicito === "string" && nombreExplicito.trim()
        ? nombreExplicito.trim()
        : nombreExplicito ?? null;
    return { id: idNumerico, nombre };
  }

  if (typeof valorCrudo === "string" && valorCrudo.trim()) {
    return { id: null, nombre: valorCrudo.trim() };
  }

  if (typeof nombreExplicito === "string" && nombreExplicito.trim()) {
    return { id: null, nombre: nombreExplicito.trim() };
  }

  return { id: null, nombre: null };
}

export function formatearEspecificacionVariante(variante) {
  if (!variante) return "—";
  const partes = [];
  if (variante.presentacionNombre) partes.push(variante.presentacionNombre);
  if (variante.tallaNombre) partes.push(variante.tallaNombre);
  return partes.length > 0 ? partes.join(" • ") : "—";
}

export function resolverIdCatalogoPorNombre(catalogo, idField, nombre) {
  if (!nombre || !Array.isArray(catalogo)) return "";
  const busqueda = String(nombre).trim().toLowerCase();
  const item = catalogo.find(
    (entrada) => String(entrada?.nombre ?? "").trim().toLowerCase() === busqueda
  );
  const id = item?.[idField];
  return id != null && id !== "" ? String(id) : "";
}

export const FORM_NUEVA_VARIANTE_VACIO = {
  talla: "",
  presentacion: "",
  color: "",
  precioVenta: "",
  precioCompra: "",
  stockMinimo: "10",
  codigoBarras: "",
};

export function crearFormNuevaVarianteDesdeReferencia(variantes = [], catalogos = {}) {
  const referencia = variantes[0];
  if (!referencia) return { ...FORM_NUEVA_VARIANTE_VACIO };

  const { tallas = [], presentaciones = [] } = catalogos;

  let presentacion =
    referencia.presentacion > 0 ? String(referencia.presentacion) : "";
  if (!presentacion && referencia.presentacionNombre) {
    presentacion = resolverIdCatalogoPorNombre(
      presentaciones,
      "idPresentacion",
      referencia.presentacionNombre
    );
  }

  let talla = referencia.talla > 0 ? String(referencia.talla) : "";
  if (!talla && referencia.tallaNombre) {
    talla = resolverIdCatalogoPorNombre(tallas, "idTalla", referencia.tallaNombre);
  }

  const precioVenta = pick(
    referencia,
    "precioVentaActual",
    "PrecioVentaActual",
    "precioVenta",
    "PrecioVenta"
  );
  const stockMinimo = pick(referencia, "stockMinimo", "StockMinimo");

  return {
    ...FORM_NUEVA_VARIANTE_VACIO,
    presentacion,
    talla,
    precioVenta:
      precioVenta != null && precioVenta !== "" ? String(precioVenta) : "",
    stockMinimo:
      stockMinimo != null && stockMinimo !== "" ? String(stockMinimo) : "",
  };
}

export function normalizarVarianteDetalle(raw) {
  if (!raw || typeof raw !== "object") return null;

  const presentacion = normalizarCampoCatalogoVariante(raw, ["presentacion", "Presentacion"], [
    "presentacionNombre",
    "PresentacionNombre",
  ]);
  const talla = normalizarCampoCatalogoVariante(raw, ["talla", "Talla"], [
    "tallaNombre",
    "TallaNombre",
  ]);
  const stockActual =
    toNumberOrNull(pick(raw, "stockActual", "StockActual", "stock", "Stock")) ?? 0;

  return {
    ...raw,
    idVariante: toNumberOrNull(pick(raw, "idVariante", "IdVariante")),
    sku: pick(raw, "sku", "Sku"),
    color: pick(raw, "color", "Color"),
    presentacion: presentacion.id,
    presentacionNombre: presentacion.nombre,
    talla: talla.id,
    tallaNombre: talla.nombre,
    codigoPrincipal: pick(raw, "codigoPrincipal", "CodigoPrincipal", "codigoBarras", "CodigoBarras"),
    precioVentaActual: pick(raw, "precioVentaActual", "PrecioVentaActual", "precioVenta", "PrecioVenta"),
    stockMinimo: pick(raw, "stockMinimo", "StockMinimo"),
    stockActual,
    stock: stockActual,
  };
}

export function agruparVariantesEnProductos(variantes) {
  const porProducto = new Map();

  for (const variante of variantes) {
    const idProducto = resolverIdProducto(variante);
    if (!idProducto) continue;

    const stockVariante =
      toNumberOrNull(pick(variante, "stockActual", "StockActual", "stock", "Stock")) ?? 0;
    const existente = porProducto.get(idProducto);

    if (!existente) {
      porProducto.set(idProducto, {
        idProducto,
        nombre:
          pick(variante, "productoNombre", "ProductoNombre", "nombre", "Nombre") || "",
        categoriaNombre: pick(variante, "categoriaNombre", "CategoriaNombre"),
        marcaNombre: pick(variante, "marcaNombre", "MarcaNombre"),
        estadoCatalogo: pick(variante, "estadoCatalogo", "EstadoCatalogo"),
        estado:
          pick(variante, "productoActivo", "ProductoActivo") ??
          pick(variante, "varianteActiva", "VarianteActiva") ??
          pick(variante, "estado", "Estado"),
        fechaCreacion: pick(variante, "fechaCreacion", "FechaCreacion"),
        sku: pick(variante, "sku", "Sku"),
        stockActual: stockVariante,
        variantes: [variante],
      });
      continue;
    }

    existente.variantes.push(variante);
    existente.stockActual += stockVariante;
    if (!existente.categoriaNombre) {
      existente.categoriaNombre = pick(variante, "categoriaNombre", "CategoriaNombre");
    }
    if (!existente.marcaNombre) {
      existente.marcaNombre = pick(variante, "marcaNombre", "MarcaNombre");
    }
  }

  return Array.from(porProducto.values());
}

export function normalizarProductoDetalle(raw) {
  if (!raw || typeof raw !== "object") return null;

  const variantesRaw = pick(raw, "variantes", "Variantes") ?? [];

  return {
    ...raw,
    idProducto: resolverIdProducto(raw),
    nombre: pick(raw, "nombre", "Nombre") ?? "",
    descripcion: pick(raw, "descripcion", "Descripcion") ?? "",
    categoriaNombre: pick(raw, "categoriaNombre", "CategoriaNombre", "categoria", "Categoria"),
    marcaNombre: pick(raw, "marcaNombre", "MarcaNombre", "marca", "Marca"),
    estadoCatalogo: pick(raw, "estadoCatalogo", "EstadoCatalogo"),
    fechaCreacion: pick(raw, "fechaCreacion", "FechaCreacion"),
    estado: pick(raw, "estado", "Estado") ?? pick(raw, "productoActivo", "ProductoActivo"),
    variantes: Array.isArray(variantesRaw)
      ? variantesRaw.map(normalizarVarianteDetalle).filter(Boolean)
      : [],
  };
}

export function unwrapVariantesBuscar(raw) {
  return unwrapList(raw).map(normalizarVarianteBusqueda).filter(Boolean);
}

export function unwrapProductoDetalleBody(raw) {
  const body = raw ?? {};
  const anidado = pick(body, "data", "Data");
  const candidato =
    anidado && typeof anidado === "object" && !Array.isArray(anidado) ? anidado : body;
  return normalizarProductoDetalle(candidato);
}

export function unwrapProductoDetalleResponse(respuesta) {
  return unwrapProductoDetalleBody(respuesta?.data ?? respuesta);
}
