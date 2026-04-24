import { apiClient } from "../lib/apiClient";

// CREAR MARCA
export const crearMarca = async (data) => {
  const res = await apiClient.post("/api/Marcas", data);
  return res.data;
};

// OBTENER MARCAS
export const obtenerMarcas = async () => {
  const res = await apiClient.get("/api/Marcas");
  return res.data?.data?.items || [];
};