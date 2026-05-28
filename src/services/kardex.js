import { apiClient } from "@/lib/apiClient";

/**
 * Obtiene el historial del Kardex de inventario para un producto.
 * Ruta mapeada de tu Swagger UI: GET /api/Inventarios/Historial?idProducto={id}
 */
export const obtenerKardexPorProducto = async (idProducto) => {
  const respuesta = await apiClient.get(`/api/Inventarios/Historial`, {
    params: {
      idProducto: idProducto
    }
  });
  return respuesta?.data; 
};