import { apiClient } from "../lib/apiClient";

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
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

// ACTUALIZAR VARIANTE DE PRODUCTO
export const actualizarVariante = async (idVariante, data) => {
  const res = await apiClient.patch(`/api/Productos/variantes/${idVariante}`, data);
  return res.data;
};

// BUSCAR VARIANTES (Usado por el buscador debounce con el parámetro 'criterio')
export const buscarVariantesCompra = async (criterio) => {
  const { data } = await apiClient.get("/api/Productos/variantes/buscar", {
    params: { criterio: criterio?.trim() || "" },
  });
  return data;
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