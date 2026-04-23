import api from "./api";

export const crearMarca = async (data) => {
  const res = await api.post("/Marcas", data);
  return res.data;
};

export const obtenerMarcas = async () => {
  const res = await api.get("/Marcas");
  return res.data;
};