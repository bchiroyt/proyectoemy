import { apiClient } from "../lib/apiClient";

// CREAR
export const crearMarca = async (data) => {
  const res = await apiClient.post("/api/Marcas", data);
  return res.data;
};

// OBTENER
export const obtenerMarcas = async () => {

  const res = await apiClient.get("/api/Marcas");
  return res.data?.data?.items || [];
};

// ACTUALIZAR
export const actualizarMarca = async (id, data) => {
  const res = await apiClient.put(`/api/Marcas/${id}`, data);
  return res.data;
};

// ELIMINAR
export const eliminarMarca = async (id) => {
  const res = await apiClient.delete(`/api/Marcas/${id}`);
  return res.data;
};