import { useState } from "react";
import { Eye, PackageSearch, Clock } from "lucide-react";

import ModalDetalleProducto from "./ModalDetalleProducto";
import ModalVariantesProducto from "./ModalVariantesProducto";
import ModalKardexProducto from "./ModalKardexProducto";

const obtenerSkuProducto = (producto) =>
  producto.sku || producto.variantes?.[0]?.sku || "Sin SKU";

// FUNCION PARA OBTENER EL STOCK TOTAL DE UN PRODUCTO SUMANDO LAS VARIANTES
const obtenerStockProducto = (producto) =>
  producto.variantes?.reduce(
    (total, variante) => total + Number(variante.stockActual ?? variante.stock ?? 0),
    0
  ) ?? 0;

  // FUNCION PARA OBTENER EL ESTADO DEL STOCK
const obtenerEstadoStock = (stock) => {
  if (stock <= 10) {
    return {
      barra: "bg-red-500",
      texto: "text-red-700",
      fondo: "bg-red-100",
    };
  }

  if (stock <= 15) {
    return {
      barra: "bg-orange-500",
      texto: "text-orange-700",
      fondo: "bg-orange-100",
    };
  }

  return {
    barra: "bg-green-500",
    texto: "text-green-700",
    fondo: "bg-green-100",
  };
};

const TablaProductos = ({ productos = [], loading = false }) => {
  // MODALES
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openVariantes, setOpenVariantes] = useState(false);
  const [openKardex, setOpenKardex] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

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
      <div className="mx-6 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {/* <th className="p-4 text-left">No.</th> */}
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Categoría</th>
              <th className="p-4 text-left">Marca</th>
              <th className="p-4 text-left">Estado</th>
              <th className="p-4 text-left">Variantes</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-left">Fecha</th>
              <th className="p-4 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="p-10 text-center text-gray-400"
                >
                  Cargando productos...
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="p-10 text-center text-gray-400"
                >
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((item, index) => {
                const skuProducto = obtenerSkuProducto(item);
                const stockProducto = obtenerStockProducto(item);
                const estadoStock = obtenerEstadoStock(stockProducto);
                const progresoStock = Math.min((stockProducto / 15) * 100, 100);

                return (
                  <tr
                    key={item.idProducto}
                    className="border-t hover:bg-gray-50 transition"
                  >

                  {/* NO. */}
                  {/* <td className="p-4 font-medium text-gray-500">
                    {index + 1}
                  </td> */}

                  {/* PRODUCTO */}
                  <td className="p-4">

                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {item.nombre}
                      </span>

                      <span className="font-mono text-xs text-gray-400">
                        SKU: {skuProducto}
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

                  {/* STOCK */}
                  <td className="p-4">

                    <div className="min-w-28 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold ${estadoStock.texto}`}>
                          {stockProducto} uds.
                        </span>
                      </div>

                      <div className={`h-2 w-full overflow-hidden rounded-full ${estadoStock.fondo}`}>
                        <div
                          className={`h-full rounded-full transition-all ${estadoStock.barra}`}
                          style={{ width: `${progresoStock}%` }}
                        />
                      </div>
                    </div>

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
                );
              })
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
