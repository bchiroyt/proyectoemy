import { apiClient } from "../lib/apiClient";

// OBTENER PRESENTACIONES
export const obtenerPresentaciones = async (params = {}) => {
  const res = await apiClient.get("/api/Presentaciones", {
    params,
  });

  return (
    res.data?.data || {
      items: [],
      page: 1,
      totalPages: 1,
    }
  );
};

// CREAR PRESENTACIÓN
export const crearPresentacion = async (data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado:
      data.estado === true ||
      data.estado === "Activo" ||
      data.estado === "activo",
  };

  const res = await apiClient.post("/api/Presentaciones", payload);

  return res.data?.data;
};

// ACTUALIZAR PRESENTACIÓN
export const actualizarPresentacion = async (id, data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado:
      data.estado === true ||
      data.estado === "Activo" ||
      data.estado === "activo",
  };

  const res = await apiClient.put(`/api/Presentaciones/${id}`, payload);

  return res.data?.data;
};

// ELIMINAR PRESENTACIÓN
export const eliminarPresentacion = async (id) => {
  const res = await apiClient.delete(`/api/Presentaciones/${id}`);

  return res.data;
};