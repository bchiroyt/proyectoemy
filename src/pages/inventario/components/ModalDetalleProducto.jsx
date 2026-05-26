import React, { useState, useEffect } from "react";
import { Barcode, Edit2, X, Save, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const obtenerDetalleProducto = (producto) => producto?.data ?? producto;

// validacion para evitar errores en caso de que no se reciba un producto o tenga una estructura diferente a la esperada
const obtenerSkuProducto = (producto) =>
  producto?.sku || producto?.variantes?.[0]?.sku || "N/A";

const formatearFecha = (fecha) => {
  if (!fecha) return "---";

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return "---";

  return fechaObj.toLocaleDateString();
};

const formatearMonto = (monto) => {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return "0.00";

  return numero.toFixed(2);
};

const obtenerPrecioCompra = (variante) =>
  variante?.precioCompraActual ?? variante?.precio_compra ?? variante?.precioCompra;

const obtenerPrecioVenta = (variante) =>
  variante?.precioVentaActual ?? variante?.precio_venta ?? variante?.precioVenta;

const obtenerStock = (variante) =>
  variante?.stockActual ?? variante?.stock ?? 0;

const ModalDetalleProducto = ({ open, onClose, producto, onRefresh }) => {
  const [editandoId, setEditandoId] = useState(null);

  const [colorInput, setColorInput] = useState("");
  const [tallaInput, setTallaInput] = useState("");
  const [precioVentaInput, setPrecioVentaInput] = useState("");
  const [codigoBarrasInput, setCodigoBarrasInput] = useState("");

  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (open && producto) {
      console.info("[ModalDetalleProducto] Producto recibido:", producto);
    }
  }, [open, producto]);

  const detalleProducto = obtenerDetalleProducto(producto);

  if (!detalleProducto) return null;

  const iniciarEdicion = (v, idActual) => {
    setEditandoId(idActual);
    setColorInput(v.color || "");
    setTallaInput(v.talla || "");
    setPrecioVentaInput(obtenerPrecioVenta(v) ?? "");
    setCodigoBarrasInput(v.codigo_barras || v.codigoPrincipal || "");
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setColorInput("");
    setTallaInput("");
    setPrecioVentaInput("");
    setCodigoBarrasInput("");
  };

  const verificarCambios = (v) => {
    const colorOriginal = v.color || "";
    const tallaOriginal = v.talla || "";
    const precioOriginal = String(obtenerPrecioVenta(v) ?? "");
    const codigoOriginal = v.codigo_barras || v.codigoPrincipal || "";

    return (
      colorInput !== colorOriginal ||
      tallaInput !== tallaOriginal ||
      String(precioVentaInput) !== precioOriginal ||
      codigoBarrasInput !== codigoOriginal
    );
  };

  const handleUpdateVariante = async (v, idVariante) => {
    setCargando(true);

    const payload = {
      presentacion: Number(v.presentacion) || 0,
      limpiarPresentacion: false,
      talla: Number(tallaInput) || 0,
      limpiarTalla: false,
      color: colorInput,
      precioVenta: Number(precioVentaInput) || 0,
      estado: v.estado !== undefined ? v.estado : true,
      permiteNegativoDefault: v.permite_negativo_default !== undefined ? v.permite_negativo_default : true,
      codigosExternos: [
        {
          codigo: codigoBarrasInput,
          esPrincipal: true,
        },
      ],
    };

    try {
      // Ejemplo con fetch/axios:
      // await axios.put(`/api/Productos/variantes/${idVariante}`, payload);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onRefresh) onRefresh();
      setEditandoId(null);
    } catch (error) {
      console.error("Error al actualizar la variante:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-[95vw] md:w-[90vw] !max-w-[1100px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white max-h-[90vh] flex flex-col"
      >
        {/* Cabecera Principal */}
        <div className="p-6 md:p-8 pb-4 flex flex-col justify-start shrink-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {detalleProducto.estadoCatalogo || detalleProducto.estado_catalogo || "ACTIVO"}
            </Badge>
            <span className="text-slate-400 text-xs font-mono">
              ID: #{detalleProducto.idProducto || detalleProducto.id_producto || "N/A"}
            </span>
          </div>

          <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 truncate">
            {detalleProducto.nombre || "Producto sin nombre"}
          </DialogTitle>

          <p className="text-slate-500 text-xs md:text-sm mt-1 truncate max-w-2xl">
            {detalleProducto.descripcion || "Sin descripcion disponible."}
          </p>
        </div>

        {/* Grid de Metadatos Maestros */}
        <div className="shrink-0 border-y border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-5 gap-2 md:gap-4 px-6 md:px-8 py-3.5 text-left">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">SKU Maestro</p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{obtenerSkuProducto(detalleProducto)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Categoria</p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{detalleProducto.categoriaNombre || detalleProducto.categoria || "---"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Marca</p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{detalleProducto.marcaNombre || detalleProducto.marca || "---"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Fecha Registro</p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                {formatearFecha(detalleProducto.fechaCreacion || detalleProducto.fecha_creacion)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Proveedor</p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{detalleProducto.proveedorNombre || "General"}</p>
            </div>
          </div>
        </div>

        {/* Seccion de Variantes */}
        <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
          <div className="mb-4 shrink-0">
            <span className="text-pink-600 font-bold text-sm border-b-2 border-pink-500 pb-2 inline-block">
              Variantes ({detalleProducto.variantes?.length || 0})
            </span>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3 pb-2">
              {detalleProducto.variantes?.map((v, index) => {
                const idActual = v.idVariante || v.id_variante || index;
                const esModoEdicion = editandoId === idActual;
                const tieneCambios = verificarCambios(v);

                return (
                  <Card key={idActual} className={`border transition-all ${esModoEdicion ? "border-pink-300 shadow-md ring-1 ring-pink-100" : "border-slate-100 shadow-sm"} overflow-hidden bg-white`}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center text-left">
                        {/* 1. Color y Talla */}
                        <div className="lg:col-span-3 min-w-0 space-y-1">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Color / Talla</p>
                          {esModoEdicion ? (
                            <div className="space-y-1">
                              <Input
                                className="h-8 text-xs font-bold uppercase bg-white border-slate-200 focus-visible:ring-pink-500"
                                value={colorInput}
                                onChange={(e) => setColorInput(e.target.value)}
                              />
                              <Input
                                className="h-8 text-xs font-semibold bg-white border-slate-200 focus-visible:ring-pink-500 w-full"
                                value={tallaInput}
                                onChange={(e) => setTallaInput(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 py-0.5">
                                <span className="text-xs font-bold text-slate-800 uppercase truncate">{v.color || "N/A"}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-slate-50 text-slate-600 mt-1">
                                Talla: {v.talla || "U"}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* 2. Codigo de Barras */}
                        <div className="lg:col-span-3 min-w-0 space-y-1">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Codigo (EAN-13)</p>
                          {esModoEdicion ? (
                            <div className="flex items-center gap-2 relative">
                              <Barcode className="w-4 h-4 absolute left-2 text-slate-400" />
                              <Input
                                className="h-8 pl-8 text-xs font-mono bg-white border-slate-200 focus-visible:ring-pink-500"
                                value={codigoBarrasInput}
                                onChange={(e) => setCodigoBarrasInput(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-600 py-1">
                              <Barcode className="w-4 h-4 shrink-0 text-slate-400" />
                              <span className="text-xs font-mono tracking-tight truncate">{v.codigoPrincipal || v.codigo_barras || "N/A"}</span>
                            </div>
                          )}
                        </div>

                        {/* 3. Precio Compra */}
                        <div className="lg:col-span-1 space-y-1">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Compra</p>
                          <p className="text-xs font-medium text-slate-400 font-mono py-1">
                            Q {formatearMonto(obtenerPrecioCompra(v))}
                          </p>
                        </div>

                        {/* 4. Precio Venta */}
                        <div className="lg:col-span-2 space-y-1">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Venta</p>
                          {esModoEdicion ? (
                            <div className="flex items-center gap-1 relative">
                              <span className="text-xs font-bold text-pink-600 absolute left-2">Q</span>
                              <Input
                                type="number"
                                className="h-8 pl-6 text-xs font-bold text-pink-600 font-mono bg-white border-slate-200 focus-visible:ring-pink-500"
                                value={precioVentaInput}
                                onChange={(e) => setPrecioVentaInput(e.target.value)}
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-pink-600 font-mono py-1">
                              Q {formatearMonto(obtenerPrecioVenta(v))}
                            </p>
                          )}
                        </div>

                        {/* 5. Stock */}
                        <div className="lg:col-span-1 space-y-1 lg:text-center">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Stock</p>
                          <p className={`text-base font-black leading-none py-1 ${obtenerStock(v) <= 5 ? "text-red-500" : "text-slate-900"}`}>
                            {obtenerStock(v)}
                          </p>
                        </div>

                        {/* 6. Acciones */}
                        <div className="lg:col-span-2 flex justify-end items-center pt-2 lg:pt-0">
                          {esModoEdicion ? (
                            <div className="flex gap-1.5 w-full lg:w-auto justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicion}
                                disabled={cargando}
                                className="h-8 text-[11px] px-2.5 font-semibold border-slate-200 hover:bg-slate-50"
                              >
                                <X className="w-3 h-3 mr-1" /> Cancelar
                              </Button>
                              <Button
                                size="sm"
                                disabled={!tieneCambios || cargando}
                                onClick={() => handleUpdateVariante(v, idActual)}
                                className="h-8 text-[11px] px-2.5 font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-sm"
                              >
                                {cargando ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3 mr-1" />
                                )}
                                Guardar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => iniciarEdicion(v, idActual)}
                              className="h-8 text-[11px] px-3.5 font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 w-full lg:w-auto shadow-sm"
                            >
                              <Edit2 className="w-3 h-3 mr-1.5 text-slate-400" /> Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalleProducto;
