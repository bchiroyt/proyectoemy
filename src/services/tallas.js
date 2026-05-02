import { apiClient } from "../lib/apiClient";

// 🔥 OBTENER TALLAS
export const obtenerTallas = async (params = {}) => {
  const res = await apiClient.get("/api/Tallas", {
    params,
  });

  return res.data?.data || {
    items: [],
    page: 1,
    totalPages: 1,
  };
};

// 🔥 CREAR
export const crearTalla = async (data) => {
  const res = await apiClient.post("/api/Tallas", data);
  return res.data?.data;
};

// 🔥 ACTUALIZAR
export const actualizarTalla = async (id, data) => {
  const res = await apiClient.put(`/api/Tallas/${id}`, data);
  return res.data?.data;
};

// 🔥 ELIMINAR (soft delete)
export const eliminarTalla = async (id) => {
  const res = await apiClient.delete(`/api/Tallas/${id}`);
  return res.data;
};