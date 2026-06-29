import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useVentaCatalogoQuery } from "@/hooks/queries/useVentaQueries";
import {
  useActualizarCotizacionMutation,
  useCotizacionDetalleQuery,
  useCrearCotizacionMutation,
} from "@/hooks/queries/useCotizacionQueries";
import { useMayoreoStore } from "@/context/useMayoreoStore";
import {
  buildCotizacionActualizarBody,
  buildCotizacionCrearBody,
  brutoLinea,
  mapDetalleCotizacionACarrito,
} from "@/lib/cotizacionMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import { valorInputCantidad, valorInputCosto } from "@/lib/compraVarianteUtils";
import { cn } from "@/lib/utils";
import Toast from "@/components/ui/Toast";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inputNumClass =
  "h-8 tabular-nums text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";

export default function NuevaCotizacion() {
  const { idCotizacion: idCotizacionParam } = useParams();
  const idCotizacionEdit = Number(idCotizacionParam);
  const esEdicion = Number.isFinite(idCotizacionEdit) && idCotizacionEdit > 0;

  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const navigate = useNavigate();
  const {
    carrito,
    agregarProducto,
    setCantidadInput,
    setPrecioNegociadoInput,
    removerProducto,
    limpiarCarrito,
    cargarCarrito,
  } = useMayoreoStore();

  const [criterio, setCriterio] = useState("");
  const [debouncedCriterio, setDebouncedCriterio] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const precargaHecha = useRef(false);

  const cotizacionQ = useCotizacionDetalleQuery(idCotizacionEdit, { enabled: esEdicion });

  useEffect(() => {
    setTitulo(
      esEdicion ? `Mayoreo · Editar cotización #${idCotizacionEdit}` : "Mayoreo · Nueva cotización"
    );
  }, [setTitulo, esEdicion, idCotizacionEdit]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCriterio(criterio), 300);
    return () => clearTimeout(timer);
  }, [criterio]);

  // Resetear el estado al cambiar de cotización o desmontar el componente
  useEffect(() => {
    limpiarCarrito();
    setNombreCliente("");
    setTelefonoCliente("");
    precargaHecha.current = false;

    return () => {
      limpiarCarrito();
    };
  }, [idCotizacionEdit, limpiarCarrito]);

  // Cargar datos de la cotización en edición
  useEffect(() => {
    if (!esEdicion || !cotizacionQ.data?.data || precargaHecha.current) return;

    const cotizacion = cotizacionQ.data.data;

    // Evitar cargar datos de otra cotización debido a caché/carreras de red
    if (cotizacion.idCotizacion !== idCotizacionEdit) return;

    if (String(cotizacion.estado).toUpperCase() !== "PENDIENTE") return;

    const lineas = (cotizacion.detalles ?? [])
      .map(mapDetalleCotizacionACarrito)
      .filter(Boolean);
    cargarCarrito(lineas);
    setNombreCliente(cotizacion.nombreCliente || "");
    precargaHecha.current = true;
  }, [esEdicion, idCotizacionEdit, cotizacionQ.data, cargarCarrito]);

  const catalogoQ = useVentaCatalogoQuery({
    page: 1,
    pageSize: 10,
    criterio: debouncedCriterio,
  });

  const crearM = useCrearCotizacionMutation();
  const actualizarM = useActualizarCotizacionMutation();
  const guardando = crearM.isPending || actualizarM.isPending;

  const handleAgregarProducto = (producto) => {
    agregarProducto(producto);
    setCriterio("");
  };

  const total = useMemo(
    () => carrito.reduce((acc, item) => acc + brutoLinea(item), 0),
    [carrito]
  );

  const handleGuardar = async () => {
    if (carrito.length === 0) {
      setToast({ open: true, message: "Agregue al menos un producto", type: "warning" });
      return;
    }
    if (carrito.some((l) => l.cantidad <= 0)) {
      setToast({ open: true, message: "Indique cantidad válida en todas las líneas", type: "warning" });
      return;
    }
    if (carrito.some((l) => (l.precioNegociado ?? 0) <= 0)) {
      setToast({ open: true, message: "Indique precio negociado válido en todas las líneas", type: "warning" });
      return;
    }
    if (!esEdicion && !nombreCliente.trim()) {
      setToast({ open: true, message: "Indique el nombre del cliente mayorista", type: "warning" });
      return;
    }

    try {
      if (esEdicion) {
        const body = buildCotizacionActualizarBody(carrito);
        await actualizarM.mutateAsync({ idCotizacion: idCotizacionEdit, body });
        setToast({
          open: true,
          message: `Cotización #${idCotizacionEdit} actualizada`,
          type: "success",
        });
      } else {
        const body = buildCotizacionCrearBody(carrito, { nombreCliente, telefonoCliente });
        const result = await crearM.mutateAsync(body);
        setToast({
          open: true,
          message: `Cotización #${result.idCotizacion} guardada (sin afectar inventario)`,
          type: "success",
        });
        limpiarCarrito();
        setNombreCliente("");
        setTelefonoCliente("");
      }
      setTimeout(() => navigate("/mayoreo", { replace: true }), 800);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Error al guardar la cotización."),
        type: "error",
      });
    }
  };

  if (esEdicion && cotizacionQ.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-(--color-gris-letra)">
        <Loader2 className="size-8 animate-spin mb-3" />
        <p className="text-sm">Cargando cotización…</p>
      </div>
    );
  }

  if (esEdicion && cotizacionQ.isError) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-(--color-rojo)">
          {cotizacionQ.error?.message || "No se pudo cargar la cotización"}
        </p>
        <Button asChild variant="outline">
          <Link to="/mayoreo">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  if (
    esEdicion &&
    cotizacionQ.data?.data &&
    String(cotizacionQ.data.data.estado).toUpperCase() !== "PENDIENTE"
  ) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-(--color-gris-letra)">
          Solo se pueden editar cotizaciones pendientes (estado: {cotizacionQ.data.data.estado}).
        </p>
        <Button asChild variant="outline">
          <Link to="/mayoreo">Volver al listado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-(--color-pos-fondo) p-4 md:p-6 gap-6">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm" className="border-(--color-pagina) text-(--color-pagina)">
          <Link to="/mayoreo">
            <ArrowLeft className="size-4 mr-1" />
            Cotizaciones
          </Link>
        </Button>
        <p className="text-xs text-(--color-gris-letra) text-right max-w-md">
          {esEdicion
            ? "Modifique productos, cantidades o precios negociados. El cliente no cambia al editar."
            : "Cotización: precios negociados solo para mayoreo."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-(--color-blanco) p-4 rounded-xl shadow-sm border border-(--color-pos-borde-suave) space-y-3">
          <h2 className="text-sm font-bold text-(--color-negro)">Cliente mayorista</h2>
          {esEdicion ? (
            <div className="rounded-lg bg-(--color-pagina-4) p-3">
              <p className="text-xs text-(--color-gris-letra) mb-1">Cliente (solo lectura)</p>
              <p className="font-semibold text-(--color-negro)">{nombreCliente || "—"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-(--color-gris-letra) block mb-1">Nombre *</label>
                <input
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full border border-(--color-pos-borde-suave) p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina)"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-(--color-gris-letra) block mb-1">Teléfono</label>
                <input
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-(--color-pos-borde-suave) p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-(--color-pagina)"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-(--color-blanco) p-4 rounded-xl shadow-sm border border-(--color-pos-borde-suave)">
          <h2 className="text-lg font-bold text-(--color-negro) mb-4">Buscar producto</h2>
          <div className="relative">
            <BuscadorPrincipal
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
              placeholder="Buscar por nombre, código o SKU..."
              className="w-full"
              autoFocus={!esEdicion}
            />
            {criterio && catalogoQ.data?.items?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-(--color-blanco) border border-(--color-pos-borde-suave) shadow-lg rounded-lg max-h-60 overflow-y-auto z-10">
                {catalogoQ.data.items.map((prod) => (
                  <div
                    key={prod.idVariante}
                    className="flex items-center justify-between p-3 hover:bg-(--color-pagina-3) cursor-pointer border-b border-(--color-pos-borde-suave) last:border-0"
                    onClick={() => handleAgregarProducto(prod)}
                  >
                    <div>
                      <p className="font-semibold text-sm text-(--color-negro)">{prod.nombre}</p>
                      <p className="text-xs text-(--color-gris-letra)">
                        SKU: {prod.sku} | Stock: {prod.stockActual} | Menudeo: Q {prod.precio.toFixed(2)}
                        {prod.precioVentaMayor > 0 && ` | Mayoreo: Q ${prod.precioVentaMayor.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-(--color-blanco) rounded-xl shadow-sm border border-(--color-pos-borde-suave) flex flex-col overflow-hidden min-h-[280px]">
        <div className="bg-(--color-gris-claro-2) px-4 py-3 border-b border-(--color-pos-borde-suave) flex items-center justify-between">
          <h2 className="text-sm font-bold text-(--color-negro) flex items-center gap-2">
            <ShoppingCart className="size-4 text-(--color-pagina)" />
            {esEdicion ? `Editar cotización #${idCotizacionEdit}` : "Detalle de cotización"}
          </h2>
          <span className="text-xs font-semibold bg-(--color-pagina-4) px-2 py-1 rounded-md">
            {carrito.length} artículos
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-(--color-gris-letra) p-6">
              <ShoppingCart className="size-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Agregue productos a la cotización</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-(--color-pagina-4) sticky top-0 text-(--color-gris-letra) text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center w-28">Cantidad</th>
                  <th className="px-4 py-3 text-right w-28">Precio negociado</th>
                  <th className="px-4 py-3 text-right w-32">Subtotal</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-pos-borde-suave)">
                {carrito.map((item) => (
                  <tr key={item.idVariante} className="hover:bg-(--color-pagina-4)">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.nombre}</p>
                      {!esEdicion && item.precio != null && (
                        <p className="text-xs text-(--color-gris-letra)">
                          Ref. menudeo: Q {Number(item.precio).toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="1"
                        className={cn(inputNumClass, "w-20 text-center mx-auto")}
                        value={valorInputCantidad(item.cantidad, item.cantidadText)}
                        onChange={(e) => setCantidadInput(item.idVariante, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className={cn(inputNumClass, "w-24 text-right ml-auto")}
                        value={valorInputCosto(item.precioNegociado, item.precioNegociadoText)}
                        onChange={(e) => setPrecioNegociadoInput(item.idVariante, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      Q {brutoLinea(item).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removerProducto(item.idVariante)}
                        className="p-1.5 text-(--color-gris-claro) hover:text-(--color-rojo)"
                        title="Quitar producto"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-(--color-pagina-4) border-t p-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-semibold text-(--color-gris-letra) uppercase">Total cotización</p>
            <p className="text-3xl font-black text-(--color-pagina) tabular-nums">Q {total.toFixed(2)}</p>
          </div>
          <Button
            onClick={handleGuardar}
            disabled={carrito.length === 0 || guardando}
            className="h-14 px-8 text-lg font-bold bg-(--color-pagina) text-(--color-blanco)"
          >
            <Save className="size-5 mr-2" />
            {guardando
              ? "GUARDANDO…"
              : esEdicion
                ? "GUARDAR CAMBIOS"
                : "GUARDAR COTIZACIÓN"}
          </Button>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
