import { useState } from "react";
import { Eye, PackageSearch, Clock, Package } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiClient";
import { obtenerProductoPorId } from "@/services/productos";

import ModalDetalleProducto from "./ModalDetalleProducto";
import ModalVariantesProducto from "./ModalVariantesProducto";
import ModalKardexProducto from "./ModalKardexProducto";
import { pick, toNumberOrNull } from "@/lib/apiNormalizer";
import { resolverIdProducto, unwrapProductoDetalleBody } from "@/lib/productoUtils";

const obtenerSkuProducto = (producto) =>
  producto.sku || producto.codigoPrincipal || producto.variantes?.[0]?.sku || "Sin SKU";

const toNumero = (valor) => {
  if (valor === undefined || valor === null || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const formatearMoneda = (valor) =>
  valor != null
    ? new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
        minimumFractionDigits: 2,
      }).format(valor)
    : "-";

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
  const directo = toNumberOrNull(
    pick(producto, "precioVentaActual", "PrecioVentaActual", "precioVenta", "PrecioVenta", "precio", "Precio")
  );
  if (directo != null) return directo;

  if (!Array.isArray(producto.variantes) || producto.variantes.length === 0) {
    return null;
  }

  let minimo = null;
  for (const variante of producto.variantes) {
    const precio = toNumberOrNull(
      pick(variante, "precioVentaActual", "PrecioVentaActual", "precioVenta", "PrecioVenta", "precio", "Precio")
    );
    if (precio != null && (minimo === null || precio < minimo)) {
      minimo = precio;
    }
  }

  return minimo;
};

const obtenerPrecioVentaMayorProducto = (producto) => {
  const directo = toNumberOrNull(
    pick(producto, "precioVentaMayorActual", "PrecioVentaMayorActual", "precioVentaMayor", "PrecioVentaMayor")
  );
  if (directo != null) return directo;

  if (!Array.isArray(producto.variantes) || producto.variantes.length === 0) {
    return null;
  }

  let minimo = null;
  for (const variante of producto.variantes) {
    const precio = toNumberOrNull(
      pick(variante, "precioVentaMayorActual", "PrecioVentaMayorActual", "precioVentaMayor", "PrecioVentaMayor")
    );
    if (precio != null && (minimo === null || precio < minimo)) {
      minimo = precio;
    }
  }

  return minimo;
};

const obtenerEstadoStock = (stock, stockMinimo) => {
  const min = stockMinimo > 0 ? stockMinimo : 10;

  if (stock < min) {
    return {
      barra: "bg-red-500",
      texto: "text-red-700",
      fondo: "bg-red-100",
    };
  }

  if (stock < min + 10) {
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

const construirSrcImagenProducto = (producto) => {
  if (!producto?.urlImagen) return null;

  const version = producto.__imagenVersion;
  if (!version) return `${API_BASE_URL}${producto.urlImagen}`;

  const separador = producto.urlImagen.includes("?") ? "&" : "?";
  return `${API_BASE_URL}${producto.urlImagen}${separador}v=${version}`;
};

const TablaProductos = ({ productos = [], loading = false, onRefresh }) => {
  const [openDetalle, setOpenDetalle] = useState(false);
  const [openVariantes, setOpenVariantes] = useState(false);
  const [openKardex, setOpenKardex] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const prepararProductoSeleccionado = (item) => {
    const idProducto = resolverIdProducto(item);
    return idProducto != null ? { ...item, idProducto } : item;
  };

  const obtenerProductoConDetalleSiHaceFalta = async (item) => {
    const base = prepararProductoSeleccionado(item);
    if (Array.isArray(base?.variantes) && base.variantes.length > 0) {
      return base;
    }

    const idProducto = resolverIdProducto(base);
    if (!idProducto) return base;

    try {
      const raw = await obtenerProductoPorId(idProducto);
      const detalle = unwrapProductoDetalleBody(raw);
      return detalle ? { ...base, ...detalle, idProducto: resolverIdProducto(detalle) ?? idProducto } : base;
    } catch (error) {
      console.error("No se pudo enriquecer el producto para la accion:", error);
      return base;
    }
  };

  const handleDetalle = (item) => {
    setProductoSeleccionado(prepararProductoSeleccionado(item));
    setOpenDetalle(true);
  };

  const handleKardex = async (item) => {
    setProductoSeleccionado(await obtenerProductoConDetalleSiHaceFalta(item));
    setOpenKardex(true);
  };

  const handleVariantes = async (item) => {
    setProductoSeleccionado(await obtenerProductoConDetalleSiHaceFalta(item));
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
                <th className="p-4 text-left">Categoria</th>
                <th className="p-4 text-left">Variantes</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-left">Precio venta</th>
                <th className="p-4 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400">
                    Cargando productos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productos.map((item, index) => {
                  const skuProducto = obtenerSkuProducto(item);
                  const esResultadoBusqueda = Boolean(item.__resultadoBusquedaInventario);
                  const identificadorProducto = esResultadoBusqueda
                    ? `ID: ${item.idProducto || "Sin ID"}`
                    : `SKU: ${skuProducto}`;
                  const stockProducto = obtenerStockProducto(item);
                  const stockMinimoProducto = obtenerStockMinimoProducto(item);
                  const estadoStock = obtenerEstadoStock(stockProducto, stockMinimoProducto);
                  const baseMaximo = stockMinimoProducto > 0 ? stockMinimoProducto * 1.5 : 15;
                  const progresoStock = Math.min((stockProducto / baseMaximo) * 100, 100);
                  const llaveUnica = `producto-${item.idProducto ?? "sin-producto"}-variante-${
                    item.idVariante ?? "sin-variante"
                  }-${index}`;
                  const nombreVisual = item.nombre || item.presentacionNombre || "Producto sin nombre";
                  const categoriaVisual =
                    item.categoriaNombre || item.nombreCategoria || item.categoria || "Sin categoria";
                  const cantidadVariantes =
                    Number(item.numeroVariantes ?? item.cantidadVariantes) ||
                    (typeof item.variantes?.length === "number" && item.variantes.length > 0
                      ? item.variantes.length
                      : 1);
                  const precioVentaVisual = formatearMoneda(obtenerPrecioVentaProducto(item));
                  const imagenProductoSrc = construirSrcImagenProducto(item);
                  const precioVentaMayor = obtenerPrecioVentaMayorProducto(item);
                  const precioVentaMayorVisual = precioVentaMayor != null ? formatearMoneda(precioVentaMayor) : null;

                  return (
                    <tr key={llaveUnica} className="border-t transition hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {imagenProductoSrc ? (
                            <div className="relative z-0 h-10 w-10 shrink-0 rounded-md border border-gray-200 bg-gray-50 transition-transform duration-300 ease-out hover:z-20 hover:scale-150 hover:shadow-xl">
                              <img
                                src={imagenProductoSrc}
                                alt={nombreVisual}
                                className="h-full w-full rounded-md object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-gray-100">
                              <Package className="h-5 w-5 text-gray-400 stroke-[1.5]" />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="line-clamp-1 font-semibold text-gray-800">
                              {nombreVisual}
                            </span>
                            <span className="font-mono text-xs text-gray-400">
                              {identificadorProducto}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs">
                          {categoriaVisual}
                        </span>
                      </td>

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
                              <span className="text-[10px] font-medium text-gray-400">
                                Min: {stockMinimoProducto}
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

                      <td className="p-4 text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800">{precioVentaVisual}</span>
                          {precioVentaMayorVisual && (
                            <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
                              Mayor: {precioVentaMayorVisual}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDetalle(item)}
                            className="text-gray-500 transition hover:text-(--color-pagina)"
                            title="Ver detalle"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => handleKardex(item)}
                            className="text-gray-500 transition hover:text-blue-500"
                            title="Kardex"
                          >
                            <PackageSearch className="h-5 w-5" />
                          </button>
{/* 
                          <button
                            onClick={() => handleVariantes(item)}
                            className="text-gray-500 transition hover:text-yellow-500"
                            title="Variantes"
                          >
                            <Clock className="h-5 w-5" />
                          </button> */}
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
