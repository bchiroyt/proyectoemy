import { pick } from "../lib/apiNormalizer";
import { apiClient } from "../lib/apiClient";

const cacheImagenProducto = new Map();

const normalizarIdProducto = (idProducto) => {
  const id = Number(idProducto);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const obtenerUrlImagenProducto = (payload) => {
  const body =
    payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : payload;

  return (
    pick(body, "urlImagen", "UrlImagen", "imagenUrl", "ImagenUrl", "imagen", "Imagen") ?? null
  );
};

const productoTieneImagen = (producto) =>
  Boolean(pick(producto, "urlImagen", "UrlImagen", "imagenUrl", "ImagenUrl", "imagen", "Imagen"));

const crearEntradaCacheImagen = (payload, version = null) => ({
  urlImagen: obtenerUrlImagenProducto(payload),
  version,
});

export const sincronizarCacheImagenProducto = (idProducto, payload, options = {}) => {
  const idNormalizado = normalizarIdProducto(idProducto);
  if (!idNormalizado) return null;

  const version = options.forzarRecarga ? Date.now() : options.version ?? null;
  const entrada = crearEntradaCacheImagen(payload, version);
  cacheImagenProducto.set(idNormalizado, entrada);
  return entrada;
};

// OBTENER PRODUCTOS (Paginado general)
export const obtenerProductos = async (params = {}) => {
  const res = await apiClient.get("/api/Productos", {
    params,
  });

  return res.data?.data || {
    items: [],
    page: 1,
    totalPages: 1,
  };
};

// DETALLE DE UN PRODUCTO
export const obtenerProductoPorId = async (idProducto) => {
  const { data } = await apiClient.get(`/api/Productos/${idProducto}`);
  return data;
};

// CREAR PRODUCTO
export const crearProducto = async (data) => {
  const isFormData = data instanceof FormData;
  const config = isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {};
  const res = await apiClient.post("/api/Productos", data, config);
  return res.data?.data;
};

// ACTUALIZAR IMAGEN DE PRODUCTO
export const actualizarImagenProducto = async (idProducto, formData) => {
  const res = await apiClient.patch(`/api/Productos/${idProducto}/imagen`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ACTUALIZAR VARIANTE DE PRODUCTO
export const actualizarVariante = async (idProducto, idVariante, data) => {
  const res = await apiClient.patch(`/api/Productos/${idProducto}/variantes/${idVariante}`, data);
  return res.data;
};

// BUSCAR PRODUCTOS (Usado por el buscador principal de inventario)
export const buscarProductosInventario = async (criterio) => {
  const { data } = await apiClient.get("/api/Productos/buscar", {
    params: { criterio: criterio?.trim() || "" },
  });
  return data;
};

export const completarProductosConImagen = async (productos = []) => {
  if (!Array.isArray(productos) || productos.length === 0) return productos;

  const idsPendientes = Array.from(
    new Set(
      productos
        .filter((producto) => !productoTieneImagen(producto))
        .map((producto) => Number(producto?.idProducto))
        .filter((id) => Number.isFinite(id) && id > 0)
        .filter((id) => !cacheImagenProducto.has(id))
    )
  );

  if (idsPendientes.length > 0) {
    await Promise.all(
      idsPendientes.map(async (idProducto) => {
        try {
          const detalle = await obtenerProductoPorId(idProducto);
          sincronizarCacheImagenProducto(idProducto, detalle);
        } catch (error) {
          console.error(`No se pudo obtener la imagen del producto ${idProducto}:`, error);
          cacheImagenProducto.set(idProducto, { urlImagen: null, version: null });
        }
      })
    );
  }

  return productos.map((producto) => {
    const idProducto = normalizarIdProducto(producto?.idProducto);
    const entradaCache = idProducto ? cacheImagenProducto.get(idProducto) : null;

    if (productoTieneImagen(producto)) {
      return entradaCache?.version
        ? { ...producto, __imagenVersion: entradaCache.version }
        : producto;
    }

    return entradaCache?.urlImagen
      ? { ...producto, urlImagen: entradaCache.urlImagen, __imagenVersion: entradaCache.version ?? undefined }
      : producto;
  });
};

// AGREGAR VARIANTES A PRODUCTO EXISTENTE
export const agregarVariantesAProducto = async (idProducto, variantes) => {
  const res = await apiClient.patch(`/api/Productos/${idProducto}/variantes`, { variantes });
  return res.data;
};

// ACTUALIZAR PRODUCTO (CABECERA)
export const actualizarProducto = async (idProducto, data) => {
  const res = await apiClient.patch(`/api/Productos/${idProducto}`, data);
  return res.data;
};
