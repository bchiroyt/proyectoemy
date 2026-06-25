import React, { useState, useEffect } from "react";
import {
  Barcode,
  Edit2,
  Loader2,
  PlusCircle,
  Save,
  X,
  Package
} from "lucide-react";

// IMPORTACIONES OFICIALES DE TU ARQUITECTURA
import { actualizarVariante, obtenerProductoPorId, agregarVariantesAProducto } from "@/services/productos";
import { obtenerTallas } from "@/services/tallas";
import { obtenerPresentaciones } from "@/services/presentaciones";
import { throwIfEnvelopeFailed } from "@/lib/apiNormalizer";
import { getApiErrorMessage, API_BASE_URL } from "@/lib/apiClient";
import {
  resolverIdProducto,
  unwrapProductoDetalleBody,
  FORM_NUEVA_VARIANTE_VACIO,
  crearFormNuevaVarianteDesdeReferencia,
  formatearEspecificacionVariante,
} from "@/lib/productoUtils";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ModalDetalleProducto = ({
  open,
  onClose,
  producto,
  onRefresh,
}) => {
  const [editandoId, setEditandoId] = useState(null);
  const [colorInput, setColorInput] = useState("");
  const [precioVentaInput, setPrecioVentaInput] = useState("");
  const [codigoBarrasInput, setCodigoBarrasInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  
  // ESTADO LOCAL sincronizado con la data real del backend
  const [estadoProducto, setEstadoProducto] = useState(null);

  // Estado para controlar el sub-modal personalizado de confirmación de salida
  const [openConfirmarSalida, setOpenConfirmarSalida] = useState(false);

  // ESTADOS PARA AGREGAR NUEVA VARIANTE
  const [mostrandoNuevaVariante, setMostrandoNuevaVariante] = useState(false);
  const [guardandoNuevaVariante, setGuardandoNuevaVariante] = useState(false);
  const [tallas, setTallas] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [formNuevaVariante, setFormNuevaVariante] = useState({ ...FORM_NUEVA_VARIANTE_VACIO });
  const [formNuevaVarianteInicial, setFormNuevaVarianteInicial] = useState({ ...FORM_NUEVA_VARIANTE_VACIO });
  const [errorNuevaVariante, setErrorNuevaVariante] = useState("");
  const [accionSalidaPendiente, setAccionSalidaPendiente] = useState(null);

  // Obtener el ID del producto de forma segura
  const idProducto = resolverIdProducto(producto) || producto?.idProducto || producto?.id_producto || (typeof producto === "number" || typeof producto === "string" ? producto : null);

  // EFECTO: Consulta al servidor al abrirse el modal
  useEffect(() => {
    const cargarDetalleProducto = async () => {
      if (!open || !idProducto) return;

      try {
        setCargandoDetalle(true);
        const raw = await obtenerProductoPorId(idProducto);
        throwIfEnvelopeFailed(raw, "No se pudo cargar el detalle del producto");
        const detalle = unwrapProductoDetalleBody(raw);
        if (detalle) {
          setEstadoProducto({
            ...detalle,
            idProducto: resolverIdProducto(detalle) ?? idProducto,
          });
        }
      } catch (error) {
        console.error("Error al obtener el detalle del producto:", error);
      } finally {
        setCargandoDetalle(false);
      }
    };

    cargarDetalleProducto();
  }, [open, idProducto]);

  // Limpiar estados al cerrar
  useEffect(() => {
    if (!open) {
      setEstadoProducto(null);
      setEditandoId(null);
      setOpenConfirmarSalida(false);
      setMostrandoNuevaVariante(false);
      setFormNuevaVariante({ ...FORM_NUEVA_VARIANTE_VACIO });
      setFormNuevaVarianteInicial({ ...FORM_NUEVA_VARIANTE_VACIO });
      setErrorNuevaVariante("");
      setAccionSalidaPendiente(null);
    }
  }, [open]);

  // Cargar catálogos para selects de nueva variante
  const cargarCatalogosVariante = async () => {
    setCargandoCatalogos(true);
    try {
      const [resTallas, resPres] = await Promise.all([
        obtenerTallas({ Activo: true, Page: 1, PageSize: 500 }),
        obtenerPresentaciones({ Activo: true, Page: 1, PageSize: 500 }),
      ]);
      const itemsTallas = resTallas.items || [];
      const itemsPresentaciones = resPres.items || [];
      setTallas(itemsTallas);
      setPresentaciones(itemsPresentaciones);
      return { tallas: itemsTallas, presentaciones: itemsPresentaciones };
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      return { tallas: [], presentaciones: [] };
    } finally {
      setCargandoCatalogos(false);
    }
  };

  // Cargar catálogos al mostrar el formulario de nueva variante
  useEffect(() => {
    if (mostrandoNuevaVariante && tallas.length === 0 && presentaciones.length === 0) {
      cargarCatalogosVariante();
    }
  }, [mostrandoNuevaVariante, tallas.length, presentaciones.length]);

  const hayCambiosNuevaVariante = () => {
    if (!mostrandoNuevaVariante) return false;
    return (
      formNuevaVariante.talla !== formNuevaVarianteInicial.talla ||
      formNuevaVariante.presentacion !== formNuevaVarianteInicial.presentacion ||
      formNuevaVariante.color !== formNuevaVarianteInicial.color ||
      formNuevaVariante.precioVenta !== formNuevaVarianteInicial.precioVenta ||
      formNuevaVariante.precioCompra !== formNuevaVarianteInicial.precioCompra ||
      formNuevaVariante.stockMinimo !== formNuevaVarianteInicial.stockMinimo ||
      formNuevaVariante.codigoBarras !== formNuevaVarianteInicial.codigoBarras
    );
  };

  const hayEdicionPendiente = () =>
    editandoId !== null || (mostrandoNuevaVariante && hayCambiosNuevaVariante());

  const cancelarNuevaVarianteForm = () => {
    setMostrandoNuevaVariante(false);
    setFormNuevaVariante({ ...FORM_NUEVA_VARIANTE_VACIO });
    setFormNuevaVarianteInicial({ ...FORM_NUEVA_VARIANTE_VACIO });
    setErrorNuevaVariante("");
  };

  const handleToggleNuevaVariante = async () => {
    if (mostrandoNuevaVariante) {
      if (hayCambiosNuevaVariante()) {
        setAccionSalidaPendiente("cancelarNuevaVariante");
        setOpenConfirmarSalida(true);
        return;
      }
      cancelarNuevaVarianteForm();
      return;
    }

    let catalogos = { tallas, presentaciones };
    if (tallas.length === 0 || presentaciones.length === 0) {
      catalogos = await cargarCatalogosVariante();
    }
    const inicial = crearFormNuevaVarianteDesdeReferencia(estadoProducto?.variantes, catalogos);
    setFormNuevaVariante(inicial);
    setFormNuevaVarianteInicial(inicial);
    setMostrandoNuevaVariante(true);
    setErrorNuevaVariante("");
  };

  const handleIntentoCierre = (nextOpen) => {
    if (nextOpen) return;
    if (hayEdicionPendiente()) {
      setAccionSalidaPendiente("cerrarModal");
      setOpenConfirmarSalida(true);
      return;
    }
    onClose();
  };

  const handleSalirSinGuardar = () => {
    const accion = accionSalidaPendiente;
    cancelarEdicion();
    cancelarNuevaVarianteForm();
    setOpenConfirmarSalida(false);
    setAccionSalidaPendiente(null);
    if (accion === "cerrarModal") {
      onClose();
    }
  };

  const handleContinuarEditando = () => {
    setOpenConfirmarSalida(false);
    setAccionSalidaPendiente(null);
  };

  const solicitarConfirmacionSalida = (event) => {
    if (!hayEdicionPendiente()) return;
    event.preventDefault();
    setAccionSalidaPendiente("cerrarModal");
    setOpenConfirmarSalida(true);
  };

  const iniciarEdicion = (v, idActual) => {
    setEditandoId(idActual);
    setColorInput(v.color || "");
    setPrecioVentaInput(v.precioVentaActual !== undefined ? v.precioVentaActual : "");
    setCodigoBarrasInput(v.codigoPrincipal || "");
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setColorInput("");
    setPrecioVentaInput("");
    setCodigoBarrasInput("");
  };

  const verificarCambios = (v) => {
    const colorOriginal = v.color || "";
    const precioOriginal = String(v.precioVentaActual !== undefined ? v.precioVentaActual : "");
    const codigoOriginal = v.codigoPrincipal || "";

    return (
      colorInput !== colorOriginal ||
      String(precioVentaInput) !== precioOriginal ||
      codigoBarrasInput !== codigoOriginal
    );
  };

  const handleUpdateVariante = async (v, idVariante) => {
    try {
      setCargando(true);

      const payload = {
        color: colorInput,
        precioVenta: Number(precioVentaInput),
        estado: v.estado !== undefined ? v.estado : true,
        permiteNegativoDefault: v.permiteNegativoDefault !== undefined ? v.permiteNegativoDefault : true,
        codigosExternos: [
          {
            codigo: codigoBarrasInput,
            esPrincipal: true,
          },
        ],
      };

      await actualizarVariante(idVariante, payload);

      setEstadoProducto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variantes: prev.variantes.map((variante) => {
            if (variante.idVariante === idVariante) {
              return {
                ...variante,
                color: colorInput,
                precioVentaActual: Number(precioVentaInput),
                codigoPrincipal: codigoBarrasInput,
              };
            }
            return variante;
          }),
        };
      });

      if (onRefresh) {
        await onRefresh();
      }

      setEditandoId(null);
    } catch (error) {
      console.error("Error al actualizar la variante:", error);
    } finally {
      setCargando(false);
    }
  };

  const nuevaVarianteValida = () => {
    const tieneEspecificacion =
      formNuevaVariante.talla ||
      formNuevaVariante.presentacion ||
      formNuevaVariante.color.trim();
    const precioVenta = Number(formNuevaVariante.precioVenta);
    const stockMinimo = formNuevaVariante.stockMinimo;
    const stockMinimoInvalido =
      stockMinimo !== "" &&
      (!Number.isFinite(Number(stockMinimo)) || Number(stockMinimo) < 0);
    return (
      tieneEspecificacion &&
      Number.isFinite(precioVenta) &&
      precioVenta > 0 &&
      !stockMinimoInvalido
    );
  };

  const handleGuardarNuevaVariante = async () => {
    if (!nuevaVarianteValida()) {
      setErrorNuevaVariante(
        "Indica al menos talla, presentación o color, y un precio de venta mayor que 0."
      );
      return;
    }

    try {
      setGuardandoNuevaVariante(true);
      setErrorNuevaVariante("");
      
      const payload = [{
        talla: formNuevaVariante.talla ? Number(formNuevaVariante.talla) : null,
        presentacion: formNuevaVariante.presentacion ? Number(formNuevaVariante.presentacion) : null,
        color: formNuevaVariante.color.trim() || null,
        precioVenta: Number(formNuevaVariante.precioVenta),
        stockMinimo: formNuevaVariante.stockMinimo !== "" ? Number(formNuevaVariante.stockMinimo) : null,
        codigosExternos: formNuevaVariante.codigoBarras ? [{ codigo: formNuevaVariante.codigoBarras, esPrincipal: true }] : []
      }];

      await agregarVariantesAProducto(idProducto, payload);
      
      cancelarNuevaVarianteForm();
      
      // Recargar producto
      setCargandoDetalle(true);
      const raw = await obtenerProductoPorId(idProducto);
      const detalle = unwrapProductoDetalleBody(raw);
      if (detalle) {
        setEstadoProducto({ ...detalle, idProducto: resolverIdProducto(detalle) ?? idProducto });
      }
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Error al crear variante:", error);
      setErrorNuevaVariante(
        getApiErrorMessage(error, "No se pudo crear la variante.")
      );
    } finally {
      setGuardandoNuevaVariante(false);
      setCargandoDetalle(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleIntentoCierre}>
        <DialogContent
          className="z-50 flex max-h-[94vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl sm:max-w-6xl lg:max-w-7xl"
          onInteractOutside={solicitarConfirmacionSalida}
          onEscapeKeyDown={solicitarConfirmacionSalida}
        >
          {openConfirmarSalida && (
            <div className="absolute inset-0 z-index[60]">
              <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
              <div className="absolute left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2">
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="confirmar-salida-titulo"
                  aria-describedby="confirmar-salida-descripcion"
                  className="rounded-2xl border-t-4 border-pink-600 bg-white p-6 shadow-2xl"
                >
                <h4 id="confirmar-salida-titulo" className="text-center text-md font-semibold text-gray-800">
                  ¿Estás seguro de salir?
                </h4>
                <p id="confirmar-salida-descripcion" className="mt-2 text-center text-sm text-gray-500">
                  No se guardarán los cambios
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleSalirSinGuardar}
                    className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Sí, salir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleContinuarEditando}
                    className="w-full rounded-xl border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    No, continuar
                  </Button>
                </div>
                </div>
              </div>
            </div>
          )}
          
          {/* HEADER (Permanente para satisfacer los requerimientos de Radix UI) */}
          <div className="p-6 md:p-8 pb-4 flex gap-4 md:gap-6 items-start shrink-0 relative">
            
            {/* Apartado de Imagen a la izquierda */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 shrink-0 bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-sm">
              {cargandoDetalle ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              ) : (estadoProducto?.urlImagen || estadoProducto?.imagenUrl || estadoProducto?.imagen) ? (
                <img
                  src={`${API_BASE_URL}${estadoProducto.urlImagen || estadoProducto.imagenUrl || estadoProducto.imagen}`}
                  alt={estadoProducto.nombre || "Producto"}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Package className="w-10 h-10 md:w-12 md:h-12 text-slate-300 stroke-[1.25]" />
              )}
            </div>

            {/* Detalles a la derecha */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {estadoProducto?.estadoCatalogo || "ACTIVO"}
                </Badge>
                <span className="text-slate-400 text-xs font-mono">
                  ID: #{estadoProducto?.idProducto || idProducto || "---"}
                </span>
              </div>

              <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 pr-8 truncate">
                {cargandoDetalle ? "Cargando información..." : (estadoProducto?.nombre || "Detalle del Producto")}
              </DialogTitle>

              <DialogDescription className="text-slate-500 text-xs md:text-sm mt-1 whitespace-pre-wrap line-clamp-3">
                {cargandoDetalle ? "Por favor espere un momento." : (estadoProducto?.descripcion || "Sin descripción disponible.")}
              </DialogDescription>
            </div>
          </div>

          {/* CUERPO DINÁMICO */}
          {cargandoDetalle ? (
            <div className="flex flex-col items-center justify-center p-20 flex-1 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
              <p className="text-sm text-slate-500 font-medium">Consultando servidor...</p>
            </div>
          ) : !estadoProducto ? (
            <div className="p-12 text-center text-slate-500 flex-1">
              No se pudo cargar la información del producto.
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden">
              {/* INFORMACIÓN PRINCIPAL DEL PRODUCTO */}
              <div className="shrink-0 border-y border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 md:px-8 py-3.5 text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Categoría
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                      {estadoProducto.categoriaNombre || estadoProducto.categoria || "---"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Marca
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                      {estadoProducto.marcaNombre || estadoProducto.marca || "---"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Fecha Registro
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                      {estadoProducto.fechaCreacion
                        ? new Date(estadoProducto.fechaCreacion).toLocaleDateString()
                        : "---"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Estado
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${estadoProducto.estado ? 'bg-green-500' : 'bg-red-400'}`} />
                      {estadoProducto.estado ? "Habilitado" : "Deshabilitado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENEDOR DE VARIANTES */}
              <div className="flex flex-col overflow-hidden p-6 md:p-8">
                <div className="mb-4 shrink-0 flex items-center justify-between">
                  <span className="text-pink-600 font-bold text-sm border-b-2 border-pink-500 pb-2 inline-block">
                    Variantes ({estadoProducto.variantes?.length || 0})
                  </span>
                  <Button
                    size="sm"
                    onClick={handleToggleNuevaVariante}
                    className="h-8 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg"
                  >
                    {mostrandoNuevaVariante ? <X className="w-3.5 h-3.5 mr-1" /> : <PlusCircle className="w-3.5 h-3.5 mr-1" />}
                    {mostrandoNuevaVariante ? "Cancelar" : "Añadir Variante"}
                  </Button>
                </div>

                <div className="max-h-[52vh] overflow-y-auto overscroll-contain pr-2 lg:max-h-[56vh]">
                  <div className="space-y-3 pb-2">
                    {mostrandoNuevaVariante && (
                      <Card className="border-2 border-pink-200 shadow-md bg-pink-50/30 overflow-hidden mb-4">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Talla</label>
                              <select
                                className="w-full h-8 text-xs rounded-md border-slate-200 focus:ring-pink-500"
                                value={formNuevaVariante.talla}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, talla: e.target.value })}
                                disabled={cargandoCatalogos}
                              >
                                <option value="">N/A</option>
                                {tallas.map((t) => (
                                  <option key={t.idTalla} value={t.idTalla}>{t.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Presentación</label>
                              <select
                                className="w-full h-8 text-xs rounded-md border-slate-200 focus:ring-pink-500"
                                value={formNuevaVariante.presentacion}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, presentacion: e.target.value })}
                                disabled={cargandoCatalogos}
                              >
                                <option value="">N/A</option>
                                {presentaciones.map((p) => (
                                  <option key={p.idPresentacion} value={p.idPresentacion}>{p.nombre}</option>
                                ))}
                              </select>
                            </div>
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Color</label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Ej. Rojo"
                                value={formNuevaVariante.color}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, color: e.target.value })}
                              />
                            </div>
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">Cód. Barras</label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="EAN/UPC"
                                value={formNuevaVariante.codigoBarras}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, codigoBarras: e.target.value })}
                              />
                            </div>
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">
                                Precio Venta <span className="text-red-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                className="h-8 text-xs"
                                placeholder="0.00"
                                value={formNuevaVariante.precioVenta}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, precioVenta: e.target.value })}
                              />
                            </div>
                            <div className="lg:col-span-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 block">
                                Stock mín.
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                className="h-8 text-xs"
                                placeholder="Opcional"
                                title="Unidades mínimas antes de alerta de bajo stock"
                                value={formNuevaVariante.stockMinimo}
                                onChange={(e) => setFormNuevaVariante({ ...formNuevaVariante, stockMinimo: e.target.value })}
                              />
                            </div>
                            <div className="lg:col-span-1 flex items-end justify-end">
                              <Button
                                size="sm"
                                onClick={handleGuardarNuevaVariante}
                                disabled={guardandoNuevaVariante || !nuevaVarianteValida()}
                                className="h-8 w-full text-xs bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                {guardandoNuevaVariante ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                Guardar
                              </Button>
                            </div>
                          </div>
                          {errorNuevaVariante && (
                            <p className="mt-3 text-xs font-medium text-red-600">
                              {errorNuevaVariante}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {estadoProducto.variantes?.map((v, index) => {
                      const idActual = v.idVariante || index;
                      const esModoEdicion = editandoId === idActual;
                      const tieneCambios = verificarCambios(v);
                      const stockActual = v.stockActual ?? v.stock ?? 0;

                      return (
                        <Card key={idActual} className="border border-slate-100 shadow-sm overflow-hidden bg-white">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                              
                              {/* SKU */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  SKU Variante
                                </p>
                                <p className="text-xs font-mono font-semibold text-slate-700 truncate">
                                  {v.sku || "Sin SKU"}
                                </p>
                              </div>

                              {/* ESPECIFICACIONES */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  Presentación / Talla
                                </p>
                                <p className="text-xs text-slate-600 truncate" title={formatearEspecificacionVariante(v)}>
                                  {formatearEspecificacionVariante(v)}
                                </p>
                              </div>

                              {/* COLOR */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  Color
                                </p>
                                {esModoEdicion ? (
                                  <Input
                                    className="h-8 text-xs focus-visible:ring-pink-500"
                                    value={colorInput}
                                    onChange={(e) => setColorInput(e.target.value)}
                                  />
                                ) : (
                                  <p className="text-xs font-bold uppercase text-slate-800">
                                    {v.color || "N/A"}
                                  </p>
                                )}
                              </div>

                              {/* CÓDIGO DE BARRAS */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  Código Barras
                                </p>
                                {esModoEdicion ? (
                                  <div className="relative">
                                    <Barcode className="w-4 h-4 absolute left-2 top-2 text-slate-400" />
                                    <Input
                                      className="h-8 pl-8 text-xs focus-visible:ring-pink-500"
                                      value={codigoBarrasInput}
                                      onChange={(e) => setCodigoBarrasInput(e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-xs font-mono truncate text-slate-700">
                                      {v.codigoPrincipal || "Sin código"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* STOCK */}
                              <div className="lg:col-span-1">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  Stock
                                </p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(stockActual) > 0 ? 'bg-slate-100 text-slate-800' : 'bg-red-50 text-red-600'}`}>
                                  {stockActual}
                                </span>
                                {v.stockMinimo != null && v.stockMinimo !== "" && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Mín. {Number(v.stockMinimo)}
                                  </p>
                                )}
                              </div>

                              {/* PRECIO DE VENTA */}
                              <div className="lg:col-span-1">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                                  Venta
                                </p>
                                {esModoEdicion ? (
                                  <Input
                                    type="number"
                                    className="h-8 text-xs focus-visible:ring-pink-500"
                                    value={precioVentaInput}
                                    onChange={(e) => setPrecioVentaInput(e.target.value)}
                                  />
                                ) : (
                                  <p className="text-xs font-extrabold text-pink-600">
                                    Q {Number(v.precioVentaActual || 0).toFixed(2)}
                                  </p>
                                )}
                              </div>

                              {/* BOTONES ACCIÓN */}
                              <div className="lg:col-span-2 flex justify-end">
                                {esModoEdicion ? (
                                  <div className="flex gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 px-2 text-xs text-slate-500"
                                      onClick={cancelarEdicion}
                                    >
                                      Cancelar
                                    </Button>

                                    <Button
                                      size="sm"
                                      disabled={!tieneCambios || cargando}
                                      onClick={() => handleUpdateVariante(v, idActual)}
                                      className="h-8 px-3 text-xs bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg"
                                    >
                                      {cargando ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        "Guardar"
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                                    onClick={() => iniciarEdicion(v, idActual)}
                                    disabled={editandoId !== null}
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Editar
                                  </Button>
                                )}
                              </div>

                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModalDetalleProducto;
