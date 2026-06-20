import { apiClient } from "../lib/apiClient";

// NORMALIZADOR
const mapMarca = (marca) => ({
  idMarca: marca?.idMarca ?? 0,
  nombre: marca?.nombre ?? "",
  descripcion: marca?.descripcion ?? "",
  activo:
    marca?.activo ??
    marca?.estado ??
    true,
});

// OBTENER
export const obtenerMarcas = async (params = {}) => {
  const res = await apiClient.get("/api/Marcas", {
    params,
  });

  const data = res.data?.data || {};

  return {
    items: Array.isArray(data.items)
      ? data.items.map(mapMarca)
      : [],
    page: data.page || 1,
    totalPages: data.totalPages || 1,
    totalRecords: data.totalRecords || 0,
  };
};

// CREAR
export const crearMarca = async (data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.post("/api/Marcas", payload);

  return mapMarca(res.data?.data || res.data);
};

// ACTUALIZAR
export const actualizarMarca = async (id, data) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.activo,
  };

  const res = await apiClient.put(`/api/Marcas/${id}`, payload);

  return mapMarca(res.data?.data || res.data);
};

// ELIMINAR
export const eliminarMarca = async (id) => {
  const res = await apiClient.delete(`/api/Marcas/${id}`);
  return res.data;
};