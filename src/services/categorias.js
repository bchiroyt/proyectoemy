import { apiClient } from "../lib/apiClient";

// 🔥 OBTENER CATEGORÍAS (PAGINADO)
export const obtenerCategorias = async (params = {}) => {
  const res = await apiClient.get("/api/Categorias", {
    params,
  });

  return res.data?.data || {
    items: [],
    page: 1,
    totalPages: 1,
  };
};

// 🔥 CREAR
export const crearCategoria = async (data) => {
  const res = await apiClient.post("/api/Categorias", data);
  return res.data?.data;
};

// 🔥 ACTUALIZAR
export const actualizarCategoria = async (id, data) => {
  const res = await apiClient.put(`/api/Categorias/${id}`, data);
  return res.data?.data;
};

// 🔥 ELIMINAR (soft delete)
export const eliminarCategoria = async (id) => {
  const res = await apiClient.delete(`/api/Categorias/${id}`);
  return res.data;
};