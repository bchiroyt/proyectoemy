import { apiClient } from "@/lib/apiClient";

export const crearMarca = async (data) => {
  const res = await apiClient.post("/marcas", data);
  return res.data;
};

export const obtenerMarcas = async () => {
  const res = await apiClient.get("/marcas");
  return res.data;
};