import { pick, toNumberOrNull, unwrapList } from "@/lib/apiNormalizer";

const pickFrom = (sources, ...keys) => {
  for (const source of sources) {
    const value = pick(source, ...keys);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const resolverCodigoPrincipal = (...sources) => {
  for (const source of sources) {
    const directo = pick(
      source,
      "codigoPrincipal",
      "CodigoPrincipal",
      "codigoBarras",
      "CodigoBarras",
      "codigoBarra",
      "CodigoBarra",
      "codigoExterno",
      "CodigoExterno"
    );
    if (directo !== undefined && directo !== null && directo !== "") return directo;

    const codigosExternos = pick(source, "codigosExternos", "CodigosExternos") ?? [];
    if (!Array.isArray(codigosExternos)) continue;

    const principal = codigosExternos.find((item) =>
      typeof item === "string" ? item.trim() : pick(item, "esPrincipal", "EsPrincipal")
    );
    const candidato = principal ?? codigosExternos[0];
    const codigo = typeof candidato === "string" ? candidato : pick(candidato, "codigo", "Codigo");
    if (codigo !== undefined && codigo !== null && codigo !== "") return codigo;
  }

  return undefined;
};

export function resolverIdProducto(item) {
  if (item == null) return null;
  if (typeof item === "number" || typeof item === "string") {
    const n = Number(item);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const directo = toNumberOrNull(
    pick(
      item,
      "idProducto",
      "IdProducto",
      "id_producto",
      "productoId",
      "ProductoId",
      "productoID",
      "ProductoID"
    )
  );
  if (directo != null && directo > 0) return directo;

  const idGenerico = toNumberOrNull(pick(item, "id", "Id"));
  const idVariante = toNumberOrNull(
    pick(item, "idVariante", "IdVariante", "id_variante", "varianteId", "VarianteId")
  );
  const nombreProducto = pick(item, "productoNombre", "ProductoNombre", "nombreProducto", "NombreProducto");
  if (idGenerico != null && idGenerico > 0 && idVariante == null && !nombreProducto) {
    return idGenerico;
  }

  const producto = pick(item, "producto", "Producto", "product", "Product");
  if (producto && typeof producto === "object") {
    return toNumberOrNull(
      pick(
        producto,
        "idProducto",
        "IdProducto",
        "id_producto",
        "productoId",
        "ProductoId",
        "productoID",
        "ProductoID",
        "id",
        "Id"
      )
    );
  }

  return null;
}

/** Variante devuelta por GET /api/Productos/variantes/buscar → fila de inventario. */
export function normalizarVarianteBusqueda(raw) {
  if (!raw || typeof raw !== "object") return null;

  const producto = pick(raw, "producto", "Producto") ?? {};
  const variante = pick(raw, "variante", "Variante", "productoVariante", "ProductoVariante") ?? {};
  const categoria = pick(raw, "categoria", "Categoria") ?? {};
  const marca = pick(raw, "marca", "Marca") ?? {};
  const sources = [raw, variante, producto];
  const idProducto = resolverIdProducto(raw);
  const idVariante =
    toNumberOrNull(pickFrom(sources, "idVariante", "IdVariante", "varianteId", "VarianteId")) ??
    toNumberOrNull(pick(raw, "id", "Id"));
  const nombre =
    pickFrom(sources, "productoNombre", "ProductoNombre", "nombreProducto", "NombreProducto") ||
    (typeof producto === "string" ? producto : "") ||
    pickFrom(sources, "nombre", "Nombre") ||
    pickFrom(sources, "presentacionNombre", "PresentacionNombre", "nombrePresentacion", "NombrePresentacion") ||
    "";
  const stockActual =
    toNumberOrNull(
      pickFrom(
        sources,
        "stockActual",
        "StockActual",
        "existenciaActual",
        "ExistenciaActual",
        "existencia",
        "Existencia",
        "cantidadExistente",
        "CantidadExistente",
        "stock",
        "Stock"
      )
    ) ?? 0;
  const stockMinimo = toNumberOrNull(
    pickFrom(sources, "stockMinimo", "StockMinimo", "stockMin", "StockMin", "minimo", "Minimo")
  );
  const precioVenta =
    toNumberOrNull(
      pickFrom(
        sources,
        "precioVentaActual",
        "PrecioVentaActual",
        "precioVenta",
        "PrecioVenta",
        "precio",
        "Precio"
      )
    ) ?? null;

  return {
    ...raw,
    idProducto,
    idVariante,
    nombre,
    productoNombre:
      pickFrom(sources, "productoNombre", "ProductoNombre", "nombreProducto", "NombreProducto") || nombre,
    sku: pickFrom(sources, "sku", "Sku", "SKU", "codigoPrincipal", "CodigoPrincipal", "codigo", "Codigo"),
    codigoPrincipal: resolverCodigoPrincipal(...sources),
    categoriaNombre:
      pickFrom(sources, "categoriaNombre", "CategoriaNombre", "nombreCategoria", "NombreCategoria") ||
      (typeof categoria === "string" ? categoria : "") ||
      pick(categoria, "nombre", "Nombre"),
    marcaNombre:
      pickFrom(sources, "marcaNombre", "MarcaNombre", "nombreMarca", "NombreMarca") ||
      (typeof marca === "string" ? marca : "") ||
      pick(marca, "nombre", "Nombre"),
    estadoCatalogo: pickFrom(sources, "estadoCatalogo", "EstadoCatalogo"),
    estado:
      pickFrom(sources, "productoActivo", "ProductoActivo") ??
      pickFrom(sources, "varianteActiva", "VarianteActiva") ??
      pickFrom(sources, "estado", "Estado"),
    precioVenta,
    precioVentaActual: precioVenta,
    stockActual,
    stock: stockActual,
    stockMinimo,
    urlImagen: pickFrom(
      sources,
      "urlImagen",
      "UrlImagen",
      "imagenUrl",
      "ImagenUrl",
      "imagen",
      "Imagen",
      "fotoUrl",
      "FotoUrl"
    ),
    fechaCreacion: pickFrom(sources, "fechaCreacion", "FechaCreacion"),
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

  const varianteRaw = pick(raw, "variante", "Variante", "productoVariante", "ProductoVariante");
  const variante =
    varianteRaw && typeof varianteRaw === "object" && !Array.isArray(varianteRaw) ? varianteRaw : {};
  const sources = [raw, variante];
  const varianteBase = { ...variante, ...raw };
  const presentacion = normalizarCampoCatalogoVariante(varianteBase, ["presentacion", "Presentacion"], [
    "presentacionNombre",
    "PresentacionNombre",
  ]);
  const talla = normalizarCampoCatalogoVariante(varianteBase, ["talla", "Talla"], [
    "tallaNombre",
    "TallaNombre",
  ]);
  const ubicacion = normalizarCampoCatalogoVariante(
    varianteBase,
    [
      "ubicacion",
      "Ubicacion",
      "idUbicacion",
      "IdUbicacion",
      "idUbicacionDefault",
      "IdUbicacionDefault",
      "ubicacionDefault",
      "UbicacionDefault",
    ],
    [
      "ubicacionNombre",
      "UbicacionNombre",
      "nombreUbicacion",
      "NombreUbicacion",
      "ubicacionDefaultNombre",
      "UbicacionDefaultNombre",
    ]
  );
  const stockActual =
    toNumberOrNull(
      pickFrom(
        sources,
        "stockActual",
        "StockActual",
        "existenciaActual",
        "ExistenciaActual",
        "existencia",
        "Existencia",
        "cantidadExistente",
        "CantidadExistente",
        "stock",
        "Stock"
      )
    ) ?? 0;

  return {
    ...raw,
    idVariante:
      toNumberOrNull(pickFrom(sources, "idVariante", "IdVariante", "varianteId", "VarianteId")) ??
      toNumberOrNull(pick(variante, "id", "Id")) ??
      toNumberOrNull(pick(raw, "id", "Id")),
    sku: pickFrom(sources, "sku", "Sku", "SKU", "codigo", "Codigo"),
    color: pickFrom(sources, "color", "Color"),
    presentacion: presentacion.id,
    presentacionNombre: presentacion.nombre,
    talla: talla.id,
    tallaNombre: talla.nombre,
    ubicacion: ubicacion.id,
    idUbicacionDefault: ubicacion.id,
    ubicacionNombre: ubicacion.nombre,
    codigoPrincipal: resolverCodigoPrincipal(...sources),
    precioVentaActual: pickFrom(
      sources,
      "precioVentaActual",
      "PrecioVentaActual",
      "precioVenta",
      "PrecioVenta",
      "precio",
      "Precio"
    ),
    stockMinimo: pickFrom(sources, "stockMinimo", "StockMinimo", "stockMin", "StockMin", "minimo", "Minimo"),
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

export function normalizarProductoDetalleDesdeBusqueda(raw) {
  if (!raw || typeof raw !== "object") return null;

  const varianteBusqueda = normalizarVarianteBusqueda(raw) ?? raw;
  const variante = normalizarVarianteDetalle(varianteBusqueda);
  const producto = pick(raw, "producto", "Producto") ?? {};
  const varianteRaw = pick(raw, "variante", "Variante", "productoVariante", "ProductoVariante") ?? {};
  const categoria = pick(raw, "categoria", "Categoria") ?? {};
  const marca = pick(raw, "marca", "Marca") ?? {};
  const sources = [raw, varianteRaw, producto];
  const nombre =
    pickFrom(sources, "productoNombre", "ProductoNombre", "nombreProducto", "NombreProducto") ||
    pickFrom(sources, "nombre", "Nombre") ||
    pick(raw, "presentacionNombre", "PresentacionNombre", "nombrePresentacion", "NombrePresentacion") ||
    "Producto";

  return {
    ...raw,
    idProducto: resolverIdProducto(raw),
    nombre,
    descripcion: pick(raw, "descripcion", "Descripcion") ?? "",
    categoriaNombre:
      pickFrom(sources, "categoriaNombre", "CategoriaNombre", "nombreCategoria", "NombreCategoria") ||
      (typeof categoria === "string" ? categoria : "") ||
      pick(categoria, "nombre", "Nombre"),
    marcaNombre:
      pickFrom(sources, "marcaNombre", "MarcaNombre", "nombreMarca", "NombreMarca") ||
      (typeof marca === "string" ? marca : "") ||
      pick(marca, "nombre", "Nombre"),
    estadoCatalogo: pick(raw, "estadoCatalogo", "EstadoCatalogo"),
    fechaCreacion: pick(raw, "fechaCreacion", "FechaCreacion"),
    estado:
      pick(raw, "productoActivo", "ProductoActivo") ??
      pick(raw, "varianteActiva", "VarianteActiva") ??
      pick(raw, "estado", "Estado"),
    urlImagen: pick(raw, "urlImagen", "UrlImagen", "imagenUrl", "ImagenUrl", "imagen", "Imagen"),
    variantes: variante ? [variante] : [],
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
