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

// CREAR PRODUCTO
export const crearProducto = async (data) => {
  const res = await apiClient.post("/api/Productos", data);
  return res.data?.data;
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