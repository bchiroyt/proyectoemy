import { apiClient } from "../lib/apiClient";

// 🔥 OBTENER
export const obtenerPresentaciones = async (params = {}) => {
  const res = await apiClient.get("/api/Presentaciones", {
    params,
  });

  return res.data?.data || {
    items: [],
    page: 1,
    totalPages: 1,
  };
};

// 🔥 CREAR
export const crearPresentacion = async (data) => {
  const res = await apiClient.post("/api/Presentaciones", data);
  return res.data?.data;
};

// 🔥 ACTUALIZAR
export const actualizarPresentacion = async (id, data) => {
  const res = await apiClient.put(`/api/Presentaciones/${id}`, data);
  return res.data?.data;
};

// 🔥 ELIMINAR
export const eliminarPresentacion = async (id) => {
  const res = await apiClient.delete(`/api/Presentaciones/${id}`);
  return res.data;
};