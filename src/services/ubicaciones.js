import { apiClient } from "../lib/apiClient";

// NORMALIZADOR
const mapUbicacion = (ubicacion) => ({
  idUbicacion: ubicacion?.idUbicacion ?? 0,
  nombre: ubicacion?.nombre ?? "",
  descripcion: ubicacion?.descripcion ?? "",
  activo:
    ubicacion?.activo ??
    ubicacion?.estado ??
    true,
});

// OBTENER
export const obtenerUbicaciones = async (params = {}) => {
  const res = await apiClient.get("/api/Ubicaciones", {
    params,
  });

  const data = res.data?.data || {};

  return {
    items: Array.isArray(data.items)
      ? data.items.map(mapUbicacion)
      : [],
    page: data.page || 1,
    totalPages: data.totalPages || 1,
  };
};

// CREAR
export const crearUbicacion = async (data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.post("/api/Ubicaciones", payload);

  return mapUbicacion(res.data?.data || res.data);
};

// ACTUALIZAR
export const actualizarUbicacion = async (id, data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.put(`/api/Ubicaciones/${id}`, payload);

  return mapUbicacion(res.data?.data || res.data);
};

// ELIMINAR
export const eliminarUbicacion = async (id) => {
  const res = await apiClient.delete(`/api/Ubicaciones/${id}`);
  return res.data;
};