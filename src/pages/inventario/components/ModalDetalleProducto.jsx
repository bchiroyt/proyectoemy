import React, { useState, useEffect } from "react";
import {
  Barcode,
  Edit2,
  X,
  Save,
  Loader2,
} from "lucide-react";

// IMPORTACIONES OFICIALES DE TU ARQUITECTURA
import { actualizarVariante } from "@/services/productos";
import { apiClient } from "@/lib/apiClient"; 

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Obtener el ID del producto de forma segura
  const idProducto = producto?.idProducto || producto?.id_producto || (typeof producto === "number" || typeof producto === "string" ? producto : null);

  // EFECTO: Consulta al servidor al abrirse el modal
  useEffect(() => {
    const cargarDetalleProducto = async () => {
      if (!open || !idProducto) return;
      
      try {
        setCargandoDetalle(true);
        const respuesta = await apiClient.get(`/api/Productos/${idProducto}`);
        if (respuesta?.data?.exito && respuesta?.data?.data) {
          setEstadoProducto(respuesta.data.data);
        }
      } catch (error) {
        console.error("Error al obtener el detalle del producto mediante apiClient:", error);
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
    }
  }, [open]);

  const handleIntentoCierre = () => {
    if (editandoId !== null) {
      setOpenConfirmarSalida(true);
    } else {
      onClose();
    }
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
        presentacion: v.presentacion > 0 ? v.presentacion : null,
        limpiarPresentacion: !v.presentacion,
        talla: v.talla > 0 ? v.talla : null,
        limpiarTalla: !v.talla,
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

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleIntentoCierre}>
        <DialogContent className="w-[95vw] md:w-[90vw] !max-w-[1100px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white max-h-[90vh] flex flex-col z-50">
          
          {/* HEADER (Permanente para satisfacer los requerimientos de Radix UI) */}
          <div className="p-6 md:p-8 pb-4 flex flex-col justify-start shrink-0 relative">
            
            {/* Se removió el botón manual con <X /> porque DialogContent ya renderiza su propio botón de cierre */}

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

            <DialogDescription className="text-slate-500 text-xs md:text-sm mt-1 truncate max-w-2xl">
              {cargandoDetalle ? "Por favor espere un momento." : (estadoProducto?.descripcion || "Sin descripción disponible.")}
            </DialogDescription>
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
            <>
              {/* INFORMACIÓN PRINCIPAL DEL PRODUCTO */}
              <div className="shrink-0 border-y border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 md:px-8 py-3.5 text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Categoría
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                      {estadoProducto.categoriaNombre || "---"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                      Marca
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                      {estadoProducto.marcaNombre || "---"}
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
              <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
                <div className="mb-4 shrink-0">
                  <span className="text-pink-600 font-bold text-sm border-b-2 border-pink-500 pb-2 inline-block">
                    Variantes ({estadoProducto.variantes?.length || 0})
                  </span>
                </div>

                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-3 pb-2">
                    {estadoProducto.variantes?.map((v, index) => {
                      const idActual = v.idVariante || index;
                      const esModoEdicion = editandoId === idActual;
                      const tieneCambios = verificarCambios(v);

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
                                  Especificación
                                </p>
                                <p className="text-xs text-slate-600 truncate">
                                  {v.presentacionNombre || "Gral"} {v.tallaNombre ? `• ${v.tallaNombre}` : ""}
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
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${v.stock > 0 ? 'bg-slate-100 text-slate-800' : 'bg-red-50 text-red-600'}`}>
                                  {v.stock ?? 0}
                                </span>
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
                </ScrollArea>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SUB-MODAL DE CONFIRMACIÓN */}
      {openConfirmarSalida && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col border-t-4 border-pink-600 p-6 space-y-4">
            <h4 className="text-md font-semibold text-gray-800 text-center">¿Estás seguro de salir?</h4>
            <p className="text-sm text-gray-500 text-center shadow-none">No se guardarán los cambios</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  cancelarEdicion();
                  setOpenConfirmarSalida(false);
                  onClose(); 
                }}
                className="w-full bg-red-500 text-white py-2.5 rounded-xl font-medium hover:bg-red-600 transition-all cursor-pointer text-sm"
              >
                Sí, salir
              </button>
              <button
                type="button"
                onClick={() => setOpenConfirmarSalida(false)}
                className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all cursor-pointer text-sm"
              >
                No, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalDetalleProducto;