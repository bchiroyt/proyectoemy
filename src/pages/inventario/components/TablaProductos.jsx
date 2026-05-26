import { useEffect, useState } from "react";
import { Eye, PackageSearch, Clock } from "lucide-react";

import { obtenerProductos } from "@/services/productos";

import ModalDetalleProducto from "./ModalDetalleProducto";
import ModalVariantesProducto from "./ModalVariantesProducto";
import ModalKardexProducto from "./ModalKardexProducto";

const TablaProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // MODALES
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openVariantes, setOpenVariantes] = useState(false);
  const [openKardex, setOpenKardex] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // OBTENER PRODUCTOS
  const fetchProductos = async () => {
    try {
      setLoading(true);

      const data = await obtenerProductos({
        Page: 1,
        PageSize: 50,
      });

      setProductos(data.items || []);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // DETALLE
  const handleDetalle = (producto) => {
    setProductoSeleccionado(producto);
    setOpenDetalle(true);
  };

  // VARIANTES
  const handleVariantes = (producto) => {
    setProductoSeleccionado(producto);
    setOpenVariantes(true);
  };

  // KARDEX
  const handleKardex = (producto) => {
    setProductoSeleccionado(producto);
    setOpenKardex(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Categoría</th>
              <th className="p-4 text-left">Marca</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Variantes</th>
              <th className="p-4 text-left">Fecha</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-10 text-center text-gray-400"
                >
                  Cargando productos...
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-10 text-center text-gray-400"
                >
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((item) => (
                <tr
                  key={item.idProducto}
                  className="border-t hover:bg-gray-50 transition"
                >

                  {/* PRODUCTO */}
                  <td className="p-4">

                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {item.nombre}
                      </span>

                      <span className="text-xs text-gray-400">
                        ID: {item.idProducto}
                      </span>
                    </div>

                  </td>

                  {/* CATEGORÍA */}
                  <td className="p-4">

                    <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                      {item.categoriaNombre || "Sin categoría"}
                    </span>

                  </td>

                  {/* MARCA */}
                  <td className="p-4 text-gray-600">
                    {item.marcaNombre || "Sin marca"}
                  </td>

                  {/* ESTADO */}
                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.estado
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.estado ? "Activo" : "Inactivo"}
                    </span>

                  </td>

                  {/* VARIANTES */}
                  <td className="p-4">

                    <span className="font-semibold text-(--color-pagina)">
                      {item.variantes?.length || 0}
                    </span>

                  </td>

                  {/* FECHA */}
                  <td className="p-4 text-gray-500 text-xs">

                    {item.fechaCreacion
                      ? new Date(item.fechaCreacion).toLocaleDateString()
                      : "-"}

                  </td>

                  {/* ACCIONES */}
                  <td className="p-4">

                    <div className="flex items-center gap-3">

                      {/* DETALLE */}
                      <button
                        onClick={() => handleDetalle(item)}
                        className="text-gray-500 hover:text-(--color-pagina) transition"
                        title="Ver detalle"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      {/* KARDEX */}
                      <button
                        onClick={() => handleKardex(item)}
                        className="text-gray-500 hover:text-blue-500 transition"
                        title="Kardex"
                      >
                        <PackageSearch className="w-5 h-5" />
                      </button>

                      {/* VARIANTES */}
                      <button
                        onClick={() => handleVariantes(item)}
                        className="text-gray-500 hover:text-yellow-500 transition"
                        title="Variantes"
                      >
                        <Clock className="w-5 h-5" />
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* MODAL DETALLE */}
      <ModalDetalleProducto
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        producto={productoSeleccionado}
      />

      {/* MODAL VARIANTES */}
      <ModalVariantesProducto
        open={openVariantes}
        onClose={() => setOpenVariantes(false)}
        producto={productoSeleccionado}
      />

      {/* MODAL KARDEX */}
      <ModalKardexProducto
        open={openKardex}
        onClose={() => setOpenKardex(false)}
        producto={productoSeleccionado}
      />
    </>
  );
};

export default TablaProductos;