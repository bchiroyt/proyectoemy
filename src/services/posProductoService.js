/**
 * Punto de venta — productos por código de barras.
 * TODO: sustituir la búsqueda local por el endpoint del backend, por ejemplo:
 *   const { data } = await apiClient.get(`/api/Productos/codigo/${encodeURIComponent(codigo)}`);
 */

const MOCK_PRODUCTOS = [
  { id: 1, nombre: "Labial Mate", precio: 10, categoria: "cosmeticos", codigo: "7452017663403" },
  { id: 2, nombre: "Base", precio: 10, categoria: "cosmeticos", codigo: "7501001001002" },
  { id: 3, nombre: "Suéter ecuatoriano", precio: 150, categoria: "ropa", codigo: "7502002002001" },
  { id: 4, nombre: "Zapatos", precio: 150, categoria: "zapatos", codigo: "7503003003001" },
  { id: 5, nombre: "Maquillaje", precio: 65, categoria: "cosmeticos", codigo: "7501001001003" },
  { id: 6, nombre: "Shampoo", precio: 40, categoria: "shampoo", codigo: "7504004004001", notaCatalogo: "Producto en liquidación" },
  { id: 7, nombre: "Rubor", precio: 20, categoria: "cosmeticos", codigo: "7501001001004" },
  { id: 8, nombre: "Ropa interior", precio: 10, categoria: "ropa", codigo: "7502002002002" },
];

export function getProductosPosDemo() {
  return MOCK_PRODUCTOS;
}

/**
 * @param {string} codigo
 * @returns {Promise<object | null>} producto o null si no existe
 */
export async function fetchProductoByCodigo(codigo) {
  const q = String(codigo).trim();
  if (!q) return null;
  await Promise.resolve();
  const found = MOCK_PRODUCTOS.find(
    (p) => p.codigo && p.codigo.toLowerCase() === q.toLowerCase()
  );
  return found ? { ...found } : null;
}
