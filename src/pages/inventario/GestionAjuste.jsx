import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Trash2, Eye, Calendar, User, PlusCircle, FileText, Info, 
  MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useAjustesCatalogosQuery, useAjustesListQuery, useAjusteDetalleQuery,
  useCrearAjusteMutation } from "@/hooks/queries/useAjustesQueries";
import { useVariantesBuscarQuery } from "@/hooks/queries/useComprasQueries";
import { buscarVariantesCompra } from "@/services/productosService";
import {
  elegirVariantePorCriterio,
  enriquecerVarianteDesdeDetalleProducto,
  invalidarCacheDetalleProductoVariantes,
  unwrapVariantesCompraBuscar,
} from "@/lib/compraVarianteUtils";
import { fmtQ } from "@/lib/cajaMappers";
import { cantidadAjusteDisplay, esEntradaAjusteDetalle } from "@/lib/ajustesMappers";
import { buildVarianteDetallePartes } from "@/lib/varianteUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UBICACIONES_UI_HABILITADAS } from "@/lib/featureFlags";
import Paginacion from "@/components/shared/Paginacion";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";

const thClass = "p-3 text-left text-[11px] leading-tight uppercase font-bold text-(--color-gris-letra) bg-(--color-gris-fondo)";
const tdClass = "p-3 align-middle text-sm border-t border-(--color-gris-claro-2)";

const resolverStockLinea = (variante) =>
  Number(
    variante?.stockActual ??
      variante?.StockActual ??
      variante?.stock ??
      variante?.Stock ??
      0
  ) || 0;

const esTipoSalida = (tipo) => tipo?.naturaleza?.toUpperCase() === "SALIDA";

const GestionAjuste = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);

  // Tabs
  const [tab, setTab] = useState("nuevo"); // "nuevo" o "historial"

  // Estado del Formulario "Nuevo Ajuste"
  const [observacion, setObservacion] = useState("");
  const [lineas, setLineas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [debounced, setDebounced] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const buscadorRef = useRef(null);
  const buscadorInputRef = useRef(null);
  const procesandoEnterRef = useRef(false);
  const queryClient = useQueryClient();

  // Estado del Historial
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Estado Modal de Detalles y Notificaciones
  const [selectedAjusteId, setSelectedAjusteId] = useState(null);
  const [notification, setNotification] = useState(null); // { type: "success"|"error", title, message }

  // 1. Cargar Catálogos
  const catalogosQ = useAjustesCatalogosQuery();
  const catalogos = catalogosQ.data;

  // Debounce de búsqueda de productos
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(busqueda.trim()), 300);
    return () => window.clearTimeout(t);
  }, [busqueda]);

  // Búsqueda de productos
  const variantesQ = useVariantesBuscarQuery(debounced, {
    enabled: debounced.length >= 1,
  });
  const resultados = useMemo(() => variantesQ.data ?? [], [variantesQ.data]);
  const buscandoProductos = variantesQ.isFetching && debounced.length >= 1;

  // 2. Cargar Historial
  const historialQ = useAjustesListQuery({
    page,
    pageSize,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  }, {
    enabled: tab === "historial",
  });
  const paginado = historialQ.data;
  const totalRegistros = paginado?.totalCount ?? 0;
  const totalPages = paginado?.totalPages ?? 1;
  const from = totalRegistros === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(from + pageSize - 1, totalRegistros);

  // Mutation para crear
  const crearMutation = useCrearAjusteMutation();

  // Establecer título de página
  useEffect(() => {
    setTitulo("Ajustes de Inventario");
  }, [setTitulo]);

  // Cerrar lista de búsqueda al hacer clic fuera
  useEffect(() => {
    const clickOutside = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target)) {
        setListaAbierta(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // Agregar Variante a las líneas
  const handleAgregarVariante = useCallback(async (v) => {
    const enriquecida = await enriquecerVarianteDesdeDetalleProducto(v);
    const idVariante = enriquecida.idVariante ?? enriquecida.IdVariante;
    if (lineas.some((l) => l.idVariante === idVariante)) {
      setNotification({
        type: "error",
        title: "Producto ya agregado",
        message: `El producto "${enriquecida.productoNombre ?? enriquecida.nombre}" ya está en el detalle del ajuste.`
      });
      return;
    }

    const primerTipo = catalogos?.tiposAjuste?.[0]?.idTipoAjuste || 0;

    const color = enriquecida.color ?? enriquecida.Color ?? "";
    const talla = enriquecida.tallaNombre ?? enriquecida.TallaNombre ?? enriquecida.talla ?? enriquecida.Talla ?? "";
    const presentacion = enriquecida.presentacionNombre ?? enriquecida.PresentacionNombre ?? enriquecida.presentacion ?? enriquecida.Presentacion ?? "";
    const extra =
      buildVarianteDetallePartes(enriquecida).join(" · ") ||
      [color, talla, presentacion].filter(Boolean).join(" · ");
    const sku = enriquecida.sku ?? enriquecida.Sku ?? "";
    const stockActual = resolverStockLinea(enriquecida);

    setLineas((prev) => [
      ...prev,
      {
        idVariante,
        idProducto: enriquecida.idProducto ?? enriquecida.IdProducto ?? null,
        nombre: enriquecida.productoNombre ?? enriquecida.ProductoNombre ?? enriquecida.nombre ?? enriquecida.Nombre ?? "",
        sku,
        extra,
        stockActual,
        idTipoAjuste: primerTipo,
        cantidadAjuste: 1,
        costoUnitario: "",
        observacionDetalle: "",
      }
    ]);

    setBusqueda("");
    setDebounced("");
    setListaAbierta(false);
    window.requestAnimationFrame(() => buscadorInputRef.current?.focus());
  }, [lineas, catalogos]);

  const buscarVariantesInmediato = useCallback(async (criterio) => {
    const q = criterio.trim();
    if (!q) return [];

    const cacheKey = ["productos", "variantes-buscar", q];
    const enCache = queryClient.getQueryData(cacheKey);
    if (Array.isArray(enCache)) return enCache;

    const raw = await buscarVariantesCompra(q);
    if (raw && raw.exito === false) {
      throw new Error(raw.mensaje || raw.Mensaje || "Error en búsqueda");
    }
    const items = unwrapVariantesCompraBuscar(raw);
    queryClient.setQueryData(cacheKey, items);
    return items;
  }, [queryClient]);

  const confirmarBusquedaEnter = useCallback(async () => {
    if (procesandoEnterRef.current) return;

    const criterio = busqueda.trim();
    if (!criterio) return;

    procesandoEnterRef.current = true;
    setDebounced(criterio);
    setListaAbierta(true);

    try {
      let items = resultados;
      const cacheActual = debounced === criterio && !variantesQ.isFetching;
      if (!cacheActual || !items.length) {
        items = await buscarVariantesInmediato(criterio);
      }

      const elegida = elegirVariantePorCriterio(items, criterio);
      if (elegida) {
        await handleAgregarVariante(elegida);
      } else {
        setNotification({
          type: "error",
          title: "Producto no encontrado",
          message: `No se encontró ningún producto para «${criterio}».`
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        title: "Error al buscar",
        message: getApiErrorMessage(err, "No se pudo buscar el producto.")
      });
    } finally {
      procesandoEnterRef.current = false;
    }
  }, [
    busqueda,
    debounced,
    resultados,
    variantesQ.isFetching,
    buscarVariantesInmediato,
    handleAgregarVariante,
  ]);

  const handleUpdateRow = (idVariante, campo, valor) => {
    setLineas((prev) =>
      prev.map((l) => (l.idVariante === idVariante ? { ...l, [campo]: valor } : l))
    );
  };

  const handleQuitarRow = (idVariante) => {
    setLineas((prev) => prev.filter((l) => l.idVariante !== idVariante));
  };

  const handleLimpiarForm = () => {
    setObservacion("");
    setLineas([]);
    setBusqueda("");
    setDebounced("");
  };

  const observacionValida = observacion.trim().length > 0;

  const handleAplicarAjuste = async () => {
    if (!observacionValida) {
      setNotification({
        type: "error",
        title: "Observación requerida",
        message: "Debe ingresar una observación general que describa el motivo del ajuste."
      });
      return;
    }

    if (lineas.length === 0) {
      setNotification({
        type: "error",
        title: "Detalle vacío",
        message: "Debe agregar al menos un producto para aplicar el ajuste."
      });
      return;
    }

    const lineasConStock = await Promise.all(
      lineas.map(async (l) => {
        const enriquecida = await enriquecerVarianteDesdeDetalleProducto(l);
        return { ...l, stockActual: resolverStockLinea(enriquecida) };
      })
    );
    setLineas(lineasConStock);

    for (const l of lineasConStock) {
      const tipo = catalogos?.tiposAjuste?.find((t) => t.idTipoAjuste === l.idTipoAjuste);
      if (tipo?.requiereCostoUnitario) {
        const costo = Number(l.costoUnitario);
        if (Number.isNaN(costo) || costo <= 0) {
          setNotification({
            type: "error",
            title: "Costo unitario requerido",
            message: `El producto "${l.nombre}" requiere un costo unitario válido mayor a cero.`
          });
          return;
        }
      }
      if (Number(l.cantidadAjuste) <= 0) {
        setNotification({
          type: "error",
          title: "Cantidad inválida",
          message: `La cantidad a ajustar para "${l.nombre}" debe ser mayor a cero.`
        });
        return;
      }

      const esSalida = esTipoSalida(tipo);
      if (esSalida && Number(l.cantidadAjuste) > Number(l.stockActual)) {
        setNotification({
          type: "error",
          title: "Stock insuficiente",
          message: `El producto "${l.nombre}" no tiene suficiente stock (${l.stockActual}) para una salida de ${l.cantidadAjuste}.`
        });
        return;
      }
    }

    try {
      const payload = {
        observacion: observacion.trim(),
        detalles: lineasConStock.map((l) => {
          const tipo = catalogos?.tiposAjuste?.find((t) => t.idTipoAjuste === l.idTipoAjuste);
          const esSalida = esTipoSalida(tipo);
          const cantidadVal = Math.abs(Number(l.cantidadAjuste));

          return {
            idTipoAjuste: l.idTipoAjuste,
            idVariante: l.idVariante,
            idUbicacion: null,
            cantidadAjuste: esSalida ? -cantidadVal : cantidadVal,
            costoUnitario: l.costoUnitario ? Number(l.costoUnitario) : null,
            observacionDetalle: l.observacionDetalle.trim() || null,
          };
        }),
      };

      const resp = await crearMutation.mutateAsync(payload);
      
      setNotification({
        type: "success",
        title: "Ajuste aplicado",
        message: `El ajuste de inventario #${resp.data?.idAjuste || ""} se ha guardado correctamente.`
      });

      handleLimpiarForm();
      setTab("historial");
      setPage(1);
    } catch (err) {
      console.error(err);
      const errMsg = getApiErrorMessage(err, "No se pudo completar el ajuste de inventario en el servidor.");
      setNotification({
        type: "error",
        title: "Error al aplicar ajuste",
        message: errMsg
      });
    }
  };

  const limpiarFiltroFechas = () => {
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  return (
    <div className="flex h-full flex-col bg-(--color-pagina-4)">
      {/* 1. Acciones Superior (Tabs y Regresar) */}
      <div className="sticky top-0 z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === "nuevo" ? "default" : "outline"}
            className={cn(
              "h-10 px-5 font-bold rounded-xl text-sm transition-all",
              tab === "nuevo"
                ? "bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra) bg-(--color-blanco) hover:bg-(--color-gris-fondo-suave)"
            )}
            onClick={() => setTab("nuevo")}
          >
            <PlusCircle className="mr-2 size-4" />
            Nuevo Ajuste
          </Button>
          <Button
            type="button"
            variant={tab === "historial" ? "default" : "outline"}
            className={cn(
              "h-10 px-5 font-bold rounded-xl text-sm transition-all",
              tab === "historial"
                ? "bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra) bg-(--color-blanco) hover:bg-(--color-gris-fondo-suave)"
            )}
            onClick={() => setTab("historial")}
          >
            <History className="mr-2 size-4" />
            Historial de Ajustes
          </Button>
        </div>

        <Button
          onClick={() => navigate("/inventario")}
          variant="outline"
          className="h-10 px-2 font-bold border-(--color-pagina-2) text-(--color-pagina-2) bg-(--color-blanco) hover:bg-(--color-verde-fondo-hover) rounded-xl"
        >
          <ArrowLeft className="mr-2 size-4 text-(--color-pagina-2)" />
          Regresar a Inventario
        </Button>
      </div>

      {/* 2. Cuerpo de la página */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        {tab === "nuevo" ? (
          <div className="max-w-[1400px] mx-auto space-y-4">
            
            {/* Observación General */}
            <div className="bg-(--color-blanco) rounded-2xl shadow-sm border border-(--color-gris-claro-2) p-5">
              <label className="block text-sm font-bold text-(--color-texto-principal) mb-2">
                Observación General <span className="text-(--color-rojo)">*</span>
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Describa el motivo general de este ajuste (ej. Auditoría anual, producto dañado, corrección de stock)..."
                required
                className="w-full rounded-xl border border-(--color-gris-claro-2) p-3.5 text-sm outline-none focus:border-(--color-gris-claro) min-h-[70px] resize-y bg-(--color-gris-fondo-suave)/50"
              />
            </div>

            {/* Listado / Tabla de Detalles de Ajuste */}
            <div className="bg-(--color-blanco) rounded-2xl shadow-sm border border-(--color-gris-claro-2) overflow-hidden flex flex-col min-h-[350px]">
              <div className="border-b border-(--color-gris-claro-2) px-5 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-(--color-texto-principal)">Líneas de Ajuste</h3>
                  <p className="text-xs text-(--color-gris-letra) mt-0.5">
                    El stock mostrado corresponde al total del inventario.
                  </p>
                </div>
                {lineas.length > 0 && (
                  <span className="rounded-full bg-(--color-pagina-2)/10 px-3 py-1 text-xs font-bold text-(--color-pagina-2) tabular-nums">
                    {lineas.length} {lineas.length === 1 ? "línea" : "líneas"}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={thClass} style={{ width: "24%" }}>Producto</th>
                      <th className={thClass} style={{ width: "12%" }}>SKU</th>
                      <th className={thClass} style={{ width: "16%" }}>Tipo Ajuste</th>
                      <th className={thClass} style={{ width: "8%", textAlign: "center" }}>Cantidad</th>
                      <th className={thClass} style={{ width: "10%", textAlign: "right" }}>Costo Unit.</th>
                      <th className={thClass} style={{ width: "17%" }}>Observación Línea</th>
                      <th className={thClass} style={{ width: "5%", textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-(--color-gris-claro)">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Info className="size-8 text-(--color-gris-borde)" />
                            <span>No hay productos en este ajuste.</span>
                            <span className="text-xs text-(--color-gris-claro)">Use el buscador de abajo para agregar productos.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      lineas.map((row) => {
                        const tipo = catalogos?.tiposAjuste?.find((t) => t.idTipoAjuste === row.idTipoAjuste);
                        const requiereCosto = tipo?.requiereCostoUnitario === true;
                        const esSalida = esTipoSalida(tipo);

                        return (
                          <tr key={row.idVariante} className="hover:bg-(--color-gris-fondo-suave)/50">
                            <td className={tdClass}>
                              <div className="min-w-0">
                                <p className="font-semibold text-(--color-texto-principal) truncate">{row.nombre}</p>
                                {row.extra && (
                                  <p className="text-xs text-(--color-gris-letra) truncate mt-0.5">{row.extra}</p>
                                )}
                                <p className={cn("text-[10px] font-bold mt-1", row.stockActual > 0 ? "text-emerald-600" : "text-(--color-rojo-obscuro)")}>
                                  Stock: {row.stockActual}
                                </p>
                              </div>
                            </td>
                            <td className={cn(tdClass, "font-mono text-xs text-(--color-gris-letra)")}>
                              {row.sku}
                            </td>
                            <td className={tdClass}>
                              <select
                                value={row.idTipoAjuste}
                                onChange={(e) => handleUpdateRow(row.idVariante, "idTipoAjuste", Number(e.target.value))}
                                className="w-full rounded-lg border border-(--color-gris-claro-2) p-2 text-xs outline-none bg-(--color-blanco) focus:border-(--color-gris-claro)"
                              >
                                {catalogos?.tiposAjuste?.map((t) => (
                                  <option key={t.idTipoAjuste} value={t.idTipoAjuste}>
                                    {t.nombre} ({t.naturaleza})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className={tdClass}>
                              <Input
                                type="number"
                                min="1"
                                step="any"
                                value={row.cantidadAjuste}
                                onChange={(e) => handleUpdateRow(row.idVariante, "cantidadAjuste", e.target.value)}
                                className="h-8 w-20 text-center text-xs border-(--color-gris-claro-2) mx-auto"
                              />
                            </td>
                            <td className={tdClass}>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={esSalida ? "Auto" : requiereCosto ? "Requerido" : "Opcional"}
                                disabled={esSalida}
                                value={row.costoUnitario}
                                onChange={(e) => handleUpdateRow(row.idVariante, "costoUnitario", e.target.value)}
                                className="h-8 w-24 text-right text-xs border-(--color-gris-claro-2) ml-auto disabled:bg-(--color-gris-fondo) disabled:text-(--color-gris-claro)"
                              />
                            </td>
                            <td className={tdClass}>
                              <textarea
                                placeholder="Especifique observación..."
                                value={row.observacionDetalle}
                                onChange={(e) => handleUpdateRow(row.idVariante, "observacionDetalle", e.target.value)}
                                className="w-full rounded-lg border border-(--color-gris-claro-2) p-2 text-xs outline-none bg-(--color-blanco) focus:border-(--color-gris-claro) min-h-[40px] resize-y"
                                rows="2"
                              />
                            </td>
                            <td className={cn(tdClass, "text-center")}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuitarRow(row.idVariante)}
                                className="size-8 text-(--color-gris-claro) hover:text-(--color-rojo-obscuro) hover:bg-(--color-rojo-fondo)"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Input Buscador Inferior Fijo */}
              <div
                ref={buscadorRef}
                className="relative border-t border-(--color-gris-claro-2) bg-(--color-gris-fondo-suave)/50 p-4"
              >
                <div className="relative max-w-lg">
                  <BuscadorPrincipal
                    inputRef={buscadorInputRef}
                    placeholder="Escanee código o busque por nombre — Enter agrega"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setListaAbierta(true);
                    }}
                    onFocus={() => {
                      if (debounced.length >= 1) setListaAbierta(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setListaAbierta(false);
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void confirmarBusquedaEnter();
                      }
                    }}
                    autoComplete="off"
                    className="max-w-none w-full"
                  />

                  {/* Dropdown de sugerencias */}
                  {listaAbierta && debounced.length >= 1 && (
                    <div className="absolute left-0 right-0 bottom-12 max-h-60 overflow-y-auto rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-xl z-20">
                      {buscandoProductos && resultados.length === 0 && (
                        <p className="p-3 text-xs text-(--color-gris-letra)">Buscando variantes...</p>
                      )}
                      {!buscandoProductos && resultados.length === 0 && (
                        <p className="p-3 text-xs text-(--color-gris-letra)">
                          Sin resultados para «{debounced}»
                        </p>
                      )}
                      {resultados.map((v) => {
                        const id = v.idVariante ?? v.IdVariante;
                        const nombre = v.productoNombre ?? v.ProductoNombre ?? v.nombre ?? v.Nombre ?? "";
                        const sku = v.sku ?? v.Sku ?? "";
                        const color = v.color ?? v.Color ?? "";
                        const talla = v.tallaNombre ?? v.TallaNombre ?? v.talla ?? v.Talla ?? "";
                        const extra = [color, talla].filter(Boolean).join(" · ");

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => void handleAgregarVariante(v)}
                            className="w-full text-left px-4 py-2.5 text-xs border-b border-(--color-gris-separador) last:border-0 hover:bg-(--color-gris-fondo-suave) flex justify-between items-center gap-3"
                          >
                            <div>
                              <p className="font-semibold text-(--color-texto-principal)">{nombre}</p>
                              {extra && <p className="text-[10px] text-(--color-gris-letra) mt-0.5">{extra}</p>}
                            </div>
                            <div className="flex flex-col items-end shrink-0 gap-1">
                              <span className="font-mono text-(--color-gris-letra)">{sku}</span>
                              <span className={cn("text-[10px] font-bold", (v.stockActual ?? v.StockActual ?? v.stock ?? v.Stock ?? 0) > 0 ? "text-emerald-600" : "text-(--color-rojo-obscuro)")}>
                                Stock: {v.stockActual ?? v.StockActual ?? v.stock ?? v.Stock ?? 0}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones del Formulario */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleLimpiarForm}
                disabled={crearMutation.isPending || lineas.length === 0}
                className="h-11 px-6 font-bold border-(--color-gris-borde) text-(--color-texto-secundario) bg-(--color-blanco) hover:bg-(--color-gris-fondo-suave) rounded-xl"
              >
                Limpiar todo
              </Button>
              <Button
                type="button"
                onClick={handleAplicarAjuste}
                disabled={crearMutation.isPending || lineas.length === 0 || !observacionValida}
                className="h-11 px-8 font-bold bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90 rounded-xl transition-all"
              >
                {crearMutation.isPending ? "Aplicando..." : "Aplicar Ajuste de Inventario"}
              </Button>
            </div>

          </div>
        ) : (
          /* TAB HISTORIAL */
          <div className="max-w-[1400px] mx-auto space-y-5">
            
            {/* Filtros y paginación */}
            <div className="bg-(--color-blanco) rounded-2xl shadow-sm border border-(--color-gris-claro-2) p-2 flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 items-end flex-1">
                <div className="w-40 min-w-[140px]">
                  <label className="flex text-xs font-bold text-(--color-texto-secundario) mb-1.5 items-center gap-1">
                    <Calendar className="size-3.5 text-(--color-gris-letra)" /> Fecha Desde
                  </label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => {
                      setFechaDesde(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 border-(--color-gris-claro-2) rounded-xl text-xs bg-(--color-gris-fondo-suave)/50"
                  />
                </div>

                <div className="w-40 min-w-[140px]">
                  <label className="flex text-xs font-bold text-(--color-texto-secundario) mb-1.5 items-center gap-1">
                    <Calendar className="size-3.5 text-(--color-gris-letra)" /> Fecha Hasta
                  </label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => {
                      setFechaHasta(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 border-(--color-gris-claro-2) rounded-xl text-xs bg-(--color-gris-fondo-suave)/50"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFiltroFechas}
                  disabled={!fechaDesde && !fechaHasta}
                  className="h-10 px-5 font-bold border-(--color-gris-borde) text-(--color-texto-secundario) bg-(--color-blanco) hover:bg-(--color-gris-fondo-suave) rounded-xl"
                >
                  Limpiar filtro
                </Button>
              </div>

              <Paginacion
                from={from}
                to={to}
                total={totalRegistros}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                disablePrev={page <= 1}
                disableNext={page >= totalPages}
                isLoading={historialQ.isLoading}
              />
            </div>

            {/* Tabla Histórica */}
            <div className="bg-(--color-blanco) rounded-2xl shadow-sm border border-(--color-gris-claro-2) overflow-hidden flex flex-col min-h-[300px]">
              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={thClass}>Ajuste #</th>
                      <th className={thClass}>Fecha y Hora</th>
                      <th className={thClass}>Responsable</th>
                      <th className={thClass}>Observación</th>
                      <th className={thClass} style={{ textAlign: "center" }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialQ.isLoading ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-(--color-gris-letra)">
                          Cargando historial de ajustes...
                        </td>
                      </tr>
                    ) : paginado?.items?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-(--color-gris-claro)">
                          No se encontraron registros de ajustes con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      paginado?.items?.map((aj, index) => (
                        <tr key={aj.idAjuste} className="hover:bg-(--color-gris-fondo-suave)/50">
                          <td className={cn(tdClass, "font-bold text-(--color-texto-principal)")}>
                            {(paginado.page - 1) * pageSize + index + 1}
                          </td>
                          <td className={tdClass}>
                            {new Date(aj.fechaAjuste).toLocaleString("es-GT")}
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-1.5 font-medium">
                              <User className="size-3.5 text-(--color-gris-claro)" />
                              {aj.usuarioNombre}
                            </div>
                          </td>
                          <td className={cn(tdClass, "text-(--color-texto-terciario) italic")}>
                            {aj.observacion || "Sin observaciones"}
                          </td>
                          <td className={cn(tdClass, "text-center")}>
                            <Button
                              type="button"
                              onClick={() => setSelectedAjusteId(aj.idAjuste)}
                              variant="ghost"
                              size="sm"
                              className="text-(--color-pagina) hover:bg-(--color-rosa-fondo) hover:text-(--color-pagina-hover) font-bold rounded-lg"
                            >
                              <Eye className="mr-1.5 size-4" />
                              Ver Detalle
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. Modal Detalle de Ajuste Histórico */}
      {selectedAjusteId != null && (
        <DetalleAjusteDialog
          idAjuste={selectedAjusteId}
          onClose={() => setSelectedAjusteId(null)}
        />
      )}

      {/* 4. Notificaciones Flotantes */}
      {notification && (
        <div className="fixed inset-0 bg-(--color-overlay) flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-blanco) p-6 rounded-2xl w-full max-w-sm border-t-4 shadow-xl border-(--color-pagina)">
            <div className="flex items-start gap-3 mb-3">
              {notification.type === "success" ? (
                <CheckCircle className="size-6 text-(--color-exito) shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="size-6 text-(--color-rojo) shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-lg text-(--color-texto-principal)">{notification.title}</h3>
                <p className="text-sm text-(--color-texto-terciario) mt-1">{notification.message}</p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                onClick={() => setNotification(null)}
                className="px-5 font-bold bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-pagina-hover) rounded-xl"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponente Dialog Detalle
function DetalleAjusteDialog({ idAjuste, onClose }) {
  const detalleQ = useAjusteDetalleQuery(idAjuste);
  const ajuste = detalleQ.data;

  return (
    <div className="fixed inset-0 bg-(--color-overlay-oscuro) flex items-center justify-center z-40 p-4">
      <div className="bg-(--color-blanco) rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border-t-4 border-(--color-pagina) shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera modal */}
        <div className="border-b border-(--color-gris-claro-2) p-5 shrink-0 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-black text-(--color-texto-principal) flex items-center gap-2">
              <FileText className="size-5 text-(--color-pagina)" />
              Detalle de Ajuste #{idAjuste}
            </h2>
            {ajuste && (
              <p className="text-xs text-(--color-gris-letra) mt-1">
                Registrado el {new Date(ajuste.fechaAjuste).toLocaleString("es-GT")} por <strong>{ajuste.usuarioNombre}</strong>
              </p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-(--color-gris-claro) hover:text-(--color-texto-principal) rounded-full"
          >
            Cerrar
          </Button>
        </div>

        {/* Contenido modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {detalleQ.isLoading ? (
            <div className="p-10 text-center text-(--color-gris-letra)">Cargando detalles...</div>
          ) : !ajuste ? (
            <div className="p-10 text-center text-(--color-rojo) font-bold">No se pudo cargar la información del ajuste.</div>
          ) : (
            <>
              {/* Observación */}
              <div className="bg-(--color-gris-fondo-suave) border border-(--color-gris-claro-2) rounded-xl p-4">
                <span className="block text-xs font-bold text-(--color-gris-letra) uppercase tracking-wider">Observación</span>
                <p className="text-sm text-(--color-texto-principal) mt-1 italic">
                  {ajuste.observacion || "Sin observación registrada."}
                </p>
              </div>

              {/* Listado de items */}
              <div className="border border-(--color-gris-claro-2) rounded-xl overflow-hidden bg-(--color-blanco) shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-(--color-gris-fondo)/80">
                        <th className="p-3 font-bold text-(--color-gris-letra)">Producto</th>
                        <th className="p-3 font-bold text-(--color-gris-letra)">SKU</th>
                        <th className="p-3 font-bold text-(--color-gris-letra)">Movimiento</th>
                        {UBICACIONES_UI_HABILITADAS ? (
                        <th className="p-3 font-bold text-(--color-gris-letra)">Ubicación</th>
                        ) : null}
                        <th className="p-3 font-bold text-(--color-gris-letra) text-right">Antes</th>
                        <th className="p-3 font-bold text-(--color-gris-letra) text-right">Ajuste</th>
                        <th className="p-3 font-bold text-(--color-gris-letra) text-right">Después</th>
                        <th className="p-3 font-bold text-(--color-gris-letra) text-right">Costo Unit.</th>
                        <th className="p-3 font-bold text-(--color-gris-letra)">Nota Línea</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ajuste.detalles?.map((det) => {
                        const esEntrada = esEntradaAjusteDetalle(det);
                        const cantidadMostrar = cantidadAjusteDisplay(det);
                        return (
                          <tr key={det.idAjusteDetalle} className="border-t border-(--color-gris-separador) hover:bg-(--color-gris-fondo-suave)/50">
                            <td className="p-3 font-semibold text-(--color-texto-principal)">{det.productoNombre}</td>
                            <td className="p-3 font-mono text-(--color-gris-letra)">{det.varianteSku}</td>
                            <td className="p-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                esEntrada ? "bg-(--color-verde-fondo) text-(--color-verde-texto) border border-(--color-verde-borde)" : "bg-(--color-rojo-fondo) text-(--color-rojo-obscuro) border border-(--color-rojo-borde)"
                              )}>
                                {det.tipoAjusteNombre}
                              </span>
                            </td>
                            {UBICACIONES_UI_HABILITADAS ? (
                            <td className="p-3 text-(--color-texto-secundario)">
                              {det.ubicacionNombre ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3 text-(--color-gris-claro)" />
                                  {det.ubicacionNombre}
                                </span>
                              ) : "—"}
                            </td>
                            ) : null}
                            <td className="p-3 text-right font-mono tabular-nums text-(--color-texto-terciario)">{det.stockSistema}</td>
                            <td className={cn(
                              "p-3 text-right font-bold font-mono tabular-nums",
                              esEntrada ? "text-(--color-verde-acento)" : "text-(--color-rojo-obscuro)"
                            )}>
                              {esEntrada ? "+" : "-"}{cantidadMostrar}
                            </td>
                            <td className="p-3 text-right font-bold font-mono tabular-nums text-(--color-texto-principal)">{det.stockProyectado}</td>
                            <td className="p-3 text-right font-mono tabular-nums">
                              {det.costoUnitario != null ? fmtQ(det.costoUnitario) : "—"}
                            </td>
                            <td className="p-3 text-(--color-texto-terciario) italic">{det.observacionDetalle || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer modal */}
        <div className="border-t border-(--color-gris-claro-2) p-4 bg-(--color-gris-fondo-suave) shrink-0 flex justify-end">
          <Button
            onClick={onClose}
            className="px-6 font-bold bg-(--color-gris-oscuro) text-(--color-blanco) hover:bg-(--color-gris-oscuro-hover) rounded-xl"
          >
            Aceptar
          </Button>
        </div>

      </div>
    </div>
  );
}

export default GestionAjuste;
