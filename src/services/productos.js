import { apiClient } from "../lib/apiClient";

// OBTENER PRODUCTOS
export const obtenerProductos = async (params = {}) => {
  const res = await apiClient.get("/api/Productos", {
    params,
  });

  return (
    res.data?.data || {
      items: [],
      page: 1,
      totalPages: 1,
      totalRecords: 0,
    }
  );
};

// OBTENER PRODUCTO POR ID
export const obtenerProductoPorId = async (id) => {
  const res = await apiClient.get(`/api/Productos/${id}`);
  return res.data?.data;
};

// CREAR PRODUCTO
export const crearProducto = async (data) => {
  const payload = {
    nombre: data.nombre,
    categoria: Number(data.categoria),
    marca: Number(data.marca),
    descripcion: data.descripcion || "",
    estadoCatalogo: data.estadoCatalogo || "BORRADOR",

    variantes: (data.variantes || []).map((v) => ({
      talla: v.talla ? Number(v.talla) : null,
      presentacion: v.presentacion
        ? Number(v.presentacion)
        : null,
      color: v.color || null,

      precioVenta: v.precioVenta
        ? Number(v.precioVenta)
        : null,

      permiteNegativoDefault:
        v.permiteNegativoDefault || false,

      codigosExternos: (v.codigosExternos || [])
        .filter((c) => c.codigo?.trim())
        .map((c) => ({
          codigo: c.codigo,
          esPrincipal: c.esPrincipal || false,
        })),
    })),
  };

  const res = await apiClient.post(
    "/api/Productos",
    payload
  );

  return res.data?.data;
};

// ELIMINAR PRODUCTO
export const eliminarProducto = async (id) => {
  const res = await apiClient.delete(
    `/api/Productos/${id}`
  );

  return res.data;
};