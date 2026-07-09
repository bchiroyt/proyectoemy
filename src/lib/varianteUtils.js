import { pick } from "@/lib/apiNormalizer";

export function pickNombreVariante(raw) {
  const valor = pick(raw, "nombreVariante", "NombreVariante");
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  return texto || null;
}

/** Normaliza atributosAdicionales desde API (objeto o string JSON). */
const CLAVES_ENTIDAD_ATRIBUTOS = new Set([
  "id",
  "Id",
  "idVariante",
  "IdVariante",
  "idProducto",
  "IdProducto",
  "idVentaDetalle",
  "IdVentaDetalle",
  "idVenta",
  "IdVenta",
  "idVentaOrigen",
  "IdVentaOrigen",
  "idUbicacion",
  "IdUbicacion",
  "idCaja",
  "IdCaja",
  "nombre",
  "Nombre",
  "nombreProducto",
  "NombreProducto",
  "productoNombre",
  "ProductoNombre",
  "nombreVariante",
  "NombreVariante",
  "sku",
  "Sku",
  "SKU",
  "precio",
  "Precio",
  "precioNetoUnitario",
  "PrecioNetoUnitario",
  "precioUnitario",
  "PrecioUnitario",
  "cantidad",
  "Cantidad",
  "cantidadVendida",
  "CantidadVendida",
  "cantidadYaDevuelta",
  "CantidadYaDevuelta",
  "cantidadDisponible",
  "CantidadDisponible",
  "maxCantidad",
  "MaxCantidad",
  "subtotalLineaSnapshot",
  "SubtotalLineaSnapshot",
  "esReembolso",
  "productoRecibido",
  "regresaInventario",
  "puedeReintegrarInventario",
  "descuentoTipo",
  "descuentoValor",
  "montoPenalizacion",
  "motivoPenalizacion",
  "observacionDetalle",
  "notaLinea",
  "talla",
  "Talla",
  "tallaNombre",
  "TallaNombre",
  "color",
  "Color",
  "presentacion",
  "Presentacion",
  "presentacionNombre",
  "PresentacionNombre",
  "atributosAdicionales",
  "AtributosAdicionales",
  "imagen",
  "Imagen",
  "stock",
  "Stock",
]);

function esObjetoAtributosPlano(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  return !keys.some((k) => CLAVES_ENTIDAD_ATRIBUTOS.has(k));
}

function parsearAtributosDesdeString(valor) {
  const trimmed = String(valor ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function normalizarAtributosAdicionales(raw) {
  if (raw == null) return null;

  if (typeof raw === "string") {
    return parsearAtributosDesdeString(raw);
  }

  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const valor = pick(raw, "atributosAdicionales", "AtributosAdicionales");
  if (valor != null) {
    if (typeof valor === "object" && !Array.isArray(valor)) return valor;
    if (typeof valor === "string") return parsearAtributosDesdeString(valor);
    return null;
  }

  if (esObjetoAtributosPlano(raw)) return raw;

  return null;
}

export function formatearAtributosAdicionales(atributos) {
  if (!atributos || typeof atributos !== "object" || Array.isArray(atributos)) return "";
  const entries = Object.entries(atributos).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  if (entries.length === 1 && entries[0][0] === "detalle") {
    return String(entries[0][1]);
  }
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

export function atributosAdicionalesALineaTexto(atributos) {
  if (atributos == null) return "";
  if (typeof atributos === "string") {
    try {
      const parsed = JSON.parse(atributos);
      return atributosAdicionalesALineaTexto(parsed);
    } catch {
      return atributos;
    }
  }
  if (typeof atributos === "object" && !Array.isArray(atributos)) {
    if ("detalle" in atributos) {
      return String(atributos.detalle ?? "");
    }
    return Object.entries(atributos).map(([k, v]) => `${k}: ${v}`).join(", ");
  }
  return "";
}

export function convertirTextoAAtributosAdicionales(texto) {
  const trimmed = String(texto ?? "").trim();
  if (!trimmed) return null;
  return { detalle: trimmed };
}

export function atributosAdicionalesATexto(atributos) {
  return atributosAdicionalesALineaTexto(atributos);
}

export function parsearAtributosAdicionalesDesdeTexto(texto) {
  return convertirTextoAAtributosAdicionales(texto);
}

const normalizarTextoVariante = (valor) => {
  const texto = String(valor ?? "").trim();
  return texto && texto.toUpperCase() !== "N/A" ? texto : "";
};

export function variantesTienenEspecificacion(variante) {
  const atributos = normalizarAtributosAdicionales(variante);
  return Boolean(
    variante?.talla ||
      variante?.presentacion ||
      normalizarTextoVariante(variante?.color) ||
      pickNombreVariante(variante) ||
      (atributos && Object.keys(atributos).length > 0)
  );
}

export function buildVarianteDetallePartes(variante) {
  if (!variante) return [];

  const partes = [];
  const nombreVariante = pickNombreVariante(variante);
  if (nombreVariante) partes.push(nombreVariante);

  const presentacion = normalizarTextoVariante(
    variante.presentacionNombre ?? variante.PresentacionNombre ?? variante.presentacion ?? variante.Presentacion
  );
  const talla = normalizarTextoVariante(
    variante.tallaNombre ?? variante.TallaNombre ?? variante.talla ?? variante.Talla
  );
  const color = normalizarTextoVariante(variante.color ?? variante.Color);

  if (presentacion) partes.push(presentacion);
  if (talla) partes.push(talla);
  if (color) partes.push(color);

  const atributosTexto = formatearAtributosAdicionales(normalizarAtributosAdicionales(variante));
  if (atributosTexto) partes.push(atributosTexto);

  return partes;
}

export function buildVarianteDetalleTexto(variante, fallback = "—") {
  const partes = buildVarianteDetallePartes(variante);
  return partes.length > 0 ? partes.join(" · ") : fallback;
}

export function obtenerEtiquetasVariante(variante) {
  const color = normalizarTextoVariante(variante?.color ?? variante?.Color);
  const talla = normalizarTextoVariante(
    variante?.tallaNombre ?? variante?.nombreTalla ?? variante?.TallaNombre ?? variante?.NombreTalla ?? variante?.talla ?? variante?.Talla
  );
  const presentacion = normalizarTextoVariante(
    variante?.presentacionNombre ??
      variante?.nombrePresentacion ??
      variante?.PresentacionNombre ??
      variante?.NombrePresentacion ??
      variante?.presentacion ??
      variante?.Presentacion
  );
  const nombreVariante = pickNombreVariante(variante);
  const atributosTexto = formatearAtributosAdicionales(normalizarAtributosAdicionales(variante));

  return [
    nombreVariante ? { key: "nombreVariante", value: nombreVariante } : null,
    presentacion ? { key: "presentacion", value: presentacion } : null,
    talla ? { key: "talla", value: talla } : null,
    color ? { key: "color", value: color } : null,
    atributosTexto ? { key: "atributos", value: atributosTexto } : null,
  ].filter(Boolean);
}

/** Nombre legible para POS, tickets y carrito. */
export function buildNombreDisplayConVariante(raw) {
  const base = pick(raw, "nombreProducto", "NombreProducto", "productoNombre", "ProductoNombre", "nombre", "Nombre") ?? "";
  
  const extras = buildVarianteDetallePartes(raw);

  if (!base) return extras.join(" · ") || "Producto";
  if (extras.length === 0) return base;
  return `${base} · ${extras.join(" · ")}`;
}

/**
 * Nombre para la tarjeta del catálogo POS.
 * Muestra el nombreVariante como base si existe (junto a los demás atributos),
 * o el nombre del producto si no existe. Nunca ambos a la vez.
 */
export function buildNombreCatalogoPos(raw) {
  const nombreVariante = pickNombreVariante(raw);
  const nombreProducto =
    pick(raw, "nombreProducto", "NombreProducto", "productoNombre", "ProductoNombre", "nombre", "Nombre") ?? "";

  const base = nombreVariante || nombreProducto;

  const presentacion = normalizarTextoVariante(
    raw.presentacionNombre ?? raw.PresentacionNombre ?? raw.presentacion ?? raw.Presentacion
  );
  const talla = normalizarTextoVariante(
    raw.tallaNombre ?? raw.TallaNombre ?? raw.talla ?? raw.Talla
  );
  const color = normalizarTextoVariante(raw.color ?? raw.Color);
  const atributosTexto = formatearAtributosAdicionales(normalizarAtributosAdicionales(raw));

  const extras = [presentacion, talla, color, atributosTexto].filter(Boolean);

  if (!base) return extras.join(" · ") || "Producto";
  if (extras.length === 0) return base;
  return `${base} · ${extras.join(" · ")}`;
}

/** Nombre ultra-resumido exclusivo para tickets físicos (ahorro de papel) */
export function buildNombreTicket(raw) {
  const nombreVariante = pickNombreVariante(raw);
  const nombreProducto = pick(raw, "nombreProducto", "NombreProducto", "productoNombre", "ProductoNombre", "nombre", "Nombre") ?? "";

  const base = nombreVariante ? nombreVariante : nombreProducto;
  return base || "Producto";
}

export const CLASES_ETIQUETA_VARIANTE = {
  nombreVariante: "border-violet-200 bg-violet-50 text-violet-700",
  color: "border-sky-200 bg-sky-50 text-sky-700",
  talla: "border-amber-200 bg-amber-50 text-amber-700",
  presentacion: "border-emerald-200 bg-emerald-50 text-emerald-700",
  atributos: "border-slate-200 bg-slate-50 text-slate-700",
};
