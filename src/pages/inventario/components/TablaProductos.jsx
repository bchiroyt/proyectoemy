import { useState } from "react";
import { Eye, PackageSearch, Clock, Package } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";

import ModalDetalleProducto from "./ModalDetalleProducto";
import ModalVariantesProducto from "./ModalVariantesProducto";
import ModalKardexProducto from "./ModalKardexProducto";
import { resolverIdProducto } from "@/lib/productoUtils";

const obtenerSkuProducto = (producto) =>
  producto.sku || producto.codigoPrincipal || producto.variantes?.[0]?.sku || "Sin SKU";

const toNumero = (valor) => {
  if (valor === undefined || valor === null || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const obtenerStockProducto = (producto) => {
  const stockDirecto = toNumero(
    producto.stockActual ??
      producto.existenciaActual ??
      producto.existencia ??
      producto.cantidadExistente ??
      producto.stock
  );
  if (stockDirecto != null) return stockDirecto;

  return producto.variantes?.reduce(
    (total, variante) =>
      total +
      Number(
        variante.stockActual ??
          variante.existenciaActual ??
          variante.existencia ??
          variante.cantidadExistente ??
          variante.stock ??
          0
      ),
    0
  ) ?? 0;
};

const obtenerStockMinimoProducto = (producto) => {
  const stockMinimoDirecto = toNumero(producto.stockMinimo ?? producto.stockMin ?? producto.minimo);
  if (stockMinimoDirecto != null) return stockMinimoDirecto;

  return producto.variantes?.reduce(
    (total, variante) =>
      total + Number(variante.stockMinimo ?? variante.stockMin ?? variante.minimo ?? 0),
    0
  ) ?? 0;
};

const obtenerPrecioVentaProducto = (producto) => {
  const precio =
    toNumero(producto.precioVentaActual ?? producto.precioVenta ?? producto.precio) ??
    toNumero(
      producto.variantes?.[0]?.precioVentaActual ??
        producto.variantes?.[0]?.precioVenta ??
        producto.variantes?.[0]?.precio
    );

  return precio != null
    ? new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
        minimumFractionDigits: 2,
      }).format(precio)
    : "-";
};

const obtenerEstadoStock = (stock, stockMinimo) => {
  // Si no hay stock mínimo definido, usamos 10 por defecto para mantener algo de lógica visual
  const min = stockMinimo > 0 ? stockMinimo : 10;

  if (stock < min) {
    return {
      barra: "bg-red-500",
      texto: "text-red-700",
      fondo: "bg-red-100",
    };
  }

  // Naranja si el stock está por encima o igual al mínimo, pero a menos de 10 unidades de distancia
  if (stock < min + 10) {
    return {
      barra: "bg-orange-500",
      texto: "text-orange-700",
      fondo: "bg-orange-100",
    };
  }

  // Verde si el stock tiene al menos 10 unidades por encima del mínimo
  return {
    barra: "bg-green-500",
    texto: "text-green-700",
    fondo: "bg-green-100",
  };
};

const TablaProductos = ({ productos = [], loading = false, onRefresh }) => {
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openVariantes, setOpenVariantes] = useState(false);
  const [openKardex, setOpenKardex] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const handleDetalle = (item) => {
    const idProducto = resolverIdProducto(item);
    setProductoSeleccionado(idProducto != null ? { ...item, idProducto } : item);
    setOpenDetalle(true);
  };

  const handleKardex = (item) => {
    const idProducto = resolverIdProducto(item);
    setProductoSeleccionado(idProducto != null ? { ...item, idProducto } : item);
    setOpenKardex(true);
  };

  const handleVariantes = (item) => {
    const idProducto = resolverIdProducto(item);
    setProductoSeleccionado(idProducto != null ? { ...item, idProducto } : item);
    setOpenVariantes(true);
  };

  return (
    <>
      <div className="mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:mx-6">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-500 shadow-[0_1px_0_0_#f3f4f6]">
              <tr>
                <th className="p-4 text-left">Producto</th>
                <th className="p-4 text-left">Categoría</th>
                {/*<th className="p-4 text-left">Marca</th>
                <th className="p-4 text-left">Estado</th> */}
                <th className="p-4 text-left">Variantes</th>
                <th className="p-4 text-left">Stock</th>
                {/* <th className="p-4 text-left">Fecha</th>*/}
                <th className="p-4 text-left">Precio venta</th>
                <th className="p-4 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-10 text-center text-gray-400">
                    Cargando productos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-10 text-center text-gray-400">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productos.map((item, index) => {
                  const skuProducto = obtenerSkuProducto(item);
                  const stockProducto = obtenerStockProducto(item);
                  const stockMinimoProducto = obtenerStockMinimoProducto(item);
                  const estadoStock = obtenerEstadoStock(stockProducto, stockMinimoProducto);

                  // Para la barra de progreso, asumimos un máximo relativo al stock mínimo (ej. 1.5x del mínimo, o 15 si no hay)
                  const baseMaximo = stockMinimoProducto > 0 ? stockMinimoProducto * 1.5 : 15;
                  const progresoStock = Math.min((stockProducto / baseMaximo) * 100, 100);

                  const llaveUnica = `producto-${item.idProducto ?? "sin-producto"}-variante-${
                    item.idVariante ?? "sin-variante"
                  }-${index}`;
                  const nombreVisual = item.nombre || item.presentacionNombre || "Producto sin nombre";
                  const categoriaVisual = item.categoriaNombre || item.nombreCategoria || item.categoria || "Sin categoria";
                  const cantidadVariantes = typeof item.variantes?.length === "number" ? item.variantes.length : 1;
                  const precioVentaVisual = obtenerPrecioVentaProducto(item);

                  return (
                    <tr
                      key={llaveUnica}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.urlImagen ? (
                            <img
                              src={`${API_BASE_URL}${item.urlImagen}`}
                              alt={nombreVisual}
                              className="w-10 h-10 rounded-md object-cover border border-gray-200 shrink-0"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center shrink-0 border border-gray-100">
                              <Package className="w-5 h-5 text-gray-400 stroke-[1.5]" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 line-clamp-1">
                              {nombreVisual}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                              SKU: {skuProducto}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                          {categoriaVisual}
                        </span>
                      </td>

                      {/*<td className="p-4 text-gray-600">
                        {item.marcaNombre || "Sin marca"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${item.estado
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>*/}

                      <td className="p-4">
                        <span className="font-semibold text-(--color-pagina)">
                          {cantidadVariantes}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="min-w-28 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${estadoStock.texto}`}>
                              {stockProducto} uds.
                            </span>
                            {stockMinimoProducto > 0 && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                Mín: {stockMinimoProducto}
                              </span>
                            )}
                          </div>
                          <div className={`h-2 w-full overflow-hidden rounded-full ${estadoStock.fondo}`}>
                            <div
                              className={`h-full rounded-full transition-all ${estadoStock.barra}`}
                              style={{ width: `${progresoStock}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      {/** 
                      <td className="p-4 text-gray-500 text-xs">
                        {item.fechaCreacion
                          ? new Date(item.fechaCreacion).toLocaleDateString()
                          : "-"}
                      </td>*/}
                      <td className="p-4 text-gray-500 text-xs">
                        {precioVentaVisual}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDetalle(item)}
                            className="text-gray-500 hover:text-(--color-pagina) transition"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleKardex(item)}
                            className="text-gray-500 hover:text-blue-500 transition"
                            title="Kardex"
                          >
                            <PackageSearch className="w-5 h-5" />
                          </button>

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
      </div>

      <ModalDetalleProducto
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        producto={productoSeleccionado}
        onRefresh={onRefresh}
      />

      <ModalVariantesProducto
        open={openVariantes}
        onClose={() => setOpenVariantes(false)}
        producto={productoSeleccionado}
      />

      <ModalKardexProducto
        open={openKardex}
        onClose={() => setOpenKardex(false)}
        producto={productoSeleccionado}
      />
    </>
  );
};

export default TablaProductos;
