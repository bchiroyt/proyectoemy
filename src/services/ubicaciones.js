import { apiClient } from "../lib/apiClient";

// 🔥 OBTENER UBICACIONES
export const obtenerUbicaciones = async (params = {}) => {
  const res = await apiClient.get("/api/Ubicaciones", {
    params,
  });

  return res.data?.data || {
    items: [],
    page: 1,
    totalPages: 1,
  };
};

// 🔥 CREAR
export const crearUbicacion = async (data) => {
  const res = await apiClient.post("/api/Ubicaciones", data);
  return res.data?.data;
};

// 🔥 ACTUALIZAR
export const actualizarUbicacion = async (id, data) => {
  const res = await apiClient.put(`/api/Ubicaciones/${id}`, data);
  return res.data?.data;
};

// 🔥 ELIMINAR (soft delete)
export const eliminarUbicacion = async (id) => {
  const res = await apiClient.delete(`/api/Ubicaciones/${id}`);
  return res.data;
};