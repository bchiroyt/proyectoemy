import { apiClient } from "../lib/apiClient";

const mapTalla = (t) => ({
  idTalla: t.idTalla,
  nombre: t.nombre,
  descripcion: t.descripcion,
  activo:
    t.activo ??
    t.estado ??
    false,
});

// OBTENER
export const obtenerTallas = async (params = {}) => {
  const res = await apiClient.get("/api/Tallas", {
    params,
  });

  const data = res.data?.data;

  return {
    items: Array.isArray(data?.items)
      ? data.items.map(mapTalla)
      : [],
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    totalRecords: data?.totalRecords || 0,
  };
};

// CREAR
export const crearTalla = async (data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.post("/api/Tallas", payload);

  return res.data?.data;
};

// ACTUALIZAR
export const actualizarTalla = async (id, data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.put(`/api/Tallas/${id}`, payload);

  return res.data?.data;
};

// ELIMINAR
export const eliminarTalla = async (id) => {
  const res = await apiClient.delete(`/api/Tallas/${id}`);
  return res.data;
};