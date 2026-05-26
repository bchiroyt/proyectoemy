import React, { useState, useEffect } from "react";
import {
  Barcode,
  Edit2,
  X,
  Save,
  Loader2,
} from "lucide-react";

// IMPORTACIÓN OFICIAL DE TU ARQUITECTURA
import { actualizarVariante } from "@/services/productos";

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
  
  // ESTADO LOCAL para controlar el renderizado en tiempo real sin recargar la página
  const [estadoProducto, setEstadoProducto] = useState(producto);

  // Sincronizar el estado interno si el producto cambia desde el padre
  useEffect(() => {
    if (producto) {
      setEstadoProducto(producto);
    }
  }, [producto]);

  if (!estadoProducto) return null;

  // INICIAR EDICIÓN
  const iniciarEdicion = (v, idActual) => {
    setEditandoId(idActual);
    setColorInput(v.color || "");
    setPrecioVentaInput(
      v.precioVentaActual ||
      v.precioVenta ||
      v.precio_venta ||
      ""
    );
    setCodigoBarrasInput(
      v.codigoPrincipal ||
      v.codigo_barras ||
      ""
    );
  };

  // CANCELAR
  const cancelarEdicion = () => {
    setEditandoId(null);
    setColorInput("");
    setPrecioVentaInput("");
    setCodigoBarrasInput("");
  };

  // VALIDAR CAMBIOS
  const verificarCambios = (v) => {
    const colorOriginal = v.color || "";
    const precioOriginal = String(
      v.precioVentaActual ||
      v.precioVenta ||
      v.precio_venta ||
      ""
    );
    const codigoOriginal = v.codigoPrincipal || v.codigo_barras || "";

    return (
      colorInput !== colorOriginal ||
      String(precioVentaInput) !== precioOriginal ||
      codigoBarrasInput !== codigoOriginal
    );
  };

  // ACTUALIZAR VARIANTE
  const handleUpdateVariante = async (v, idVariante) => {
    try {
      setCargando(true);

      const idPresentacion = Number(v.presentacion || v.id_presentacion || 0);
      const idTalla = Number(v.talla || v.id_talla || 0);

      const payload = {
        presentacion: idPresentacion > 0 ? idPresentacion : null,
        limpiarPresentacion: idPresentacion <= 0,
        talla: idTalla > 0 ? idTalla : null,
        limpiarTalla: idTalla <= 0,
        color: colorInput,
        precioVenta: Number(precioVentaInput),
        estado: v.estado !== undefined ? v.estado : true,
        permiteNegativoDefault: 
          v.permiteNegativoDefault !== undefined 
            ? v.permiteNegativoDefault 
            : (v.permite_negativo_default !== undefined ? v.permite_negativo_default : true),
        codigosExternos: [
          {
            codigo: codigoBarrasInput,
            esPrincipal: true,
          },
        ],
      };

      // Petición al servidor utilizando tu apiClient centralizado
      await actualizarVariante(idVariante, payload);

      console.log("¡Variante actualizada con éxito!");

      // REFRESCO OPTIMISTA: Actualizar la interfaz inmediatamente sin esperar recargas
      setEstadoProducto((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variantes: prev.variantes.map((variante) => {
            const idActual = variante.idVariante || variante.id_variante;
            if (idActual === idVariante) {
              return {
                ...variante,
                color: colorInput,
                precioVentaActual: Number(precioVentaInput),
                precioVenta: Number(precioVentaInput),
                precio_venta: Number(precioVentaInput),
                codigoPrincipal: codigoBarrasInput,
                codigo_barras: codigoBarrasInput,
              };
            }
            return variante;
          }),
        };
      });

      // Notificar al componente Padre para que actualice la lista general de fondo
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:w-[90vw] !max-w-[1100px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 pb-4 flex flex-col justify-start shrink-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {estadoProducto.estado_catalogo || "ACTIVO"}
            </Badge>
            <span className="text-slate-400 text-xs font-mono">
              ID: #{estadoProducto.id_producto || estadoProducto.idProducto || "N/A"}
            </span>
          </div>

          <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 truncate">
            {estadoProducto.nombre}
          </DialogTitle>

          <DialogDescription className="text-slate-500 text-xs md:text-sm mt-1 truncate max-w-2xl">
            {estadoProducto.descripcion || "Sin descripción disponible."}
          </DialogDescription>
        </div>

        {/* INFO */}
        <div className="shrink-0 border-y border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-5 gap-2 md:gap-4 px-6 md:px-8 py-3.5 text-left">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                SKU Maestro
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                {estadoProducto.sku || "Sin SKU"}
              </p>
            </div>

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
                {estadoProducto.fecha_creacion || estadoProducto.fechaCreacion
                  ? new Date(estadoProducto.fecha_creacion || estadoProducto.fechaCreacion).toLocaleDateString()
                  : "---"}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
                Proveedor
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">
                {estadoProducto.proveedorNombre || "General"}
              </p>
            </div>
          </div>
        </div>

        {/* VARIANTES */}
        <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
          <div className="mb-4 shrink-0">
            <span className="text-pink-600 font-bold text-sm border-b-2 border-pink-500 pb-2 inline-block">
              Variantes ({estadoProducto.variantes?.length || 0})
            </span>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3 pb-2">
              {estadoProducto.variantes?.map((v, index) => {
                const idActual = v.idVariante || v.id_variante || index;
                const esModoEdicion = editandoId === idActual;
                const tieneCambios = verificarCambios(v);

                return (
                  <Card key={idActual} className="border border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                        
                        {/* COLOR */}
                        <div className="lg:col-span-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                            Color
                          </p>
                          {esModoEdicion ? (
                            <Input
                              className="h-8 text-xs"
                              value={colorInput}
                              onChange={(e) => setColorInput(e.target.value)}
                            />
                          ) : (
                            <p className="text-xs font-bold uppercase">
                              {v.color || "N/A"}
                            </p>
                          )}
                        </div>

                        {/* CODIGO */}
                        <div className="lg:col-span-3">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                            Código
                          </p>
                          {esModoEdicion ? (
                            <div className="relative">
                              <Barcode className="w-4 h-4 absolute left-2 top-2 text-slate-400" />
                              <Input
                                className="h-8 pl-8 text-xs"
                                value={codigoBarrasInput}
                                onChange={(e) => setCodigoBarrasInput(e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Barcode className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-mono">
                                {v.codigoPrincipal || v.codigo_barras || "Sin código"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* PRECIO COMPRA */}
                        <div className="lg:col-span-2">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                            Compra
                          </p>
                          <p className="text-xs font-medium text-slate-400">
                            Q{" "}
                            {v.precio_compra || v.precioCompra
                              ? Number(v.precio_compra || v.precioCompra).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>

                        {/* PRECIO VENTA */}
                        <div className="lg:col-span-2">
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                            Venta
                          </p>
                          {esModoEdicion ? (
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={precioVentaInput}
                              onChange={(e) => setPrecioVentaInput(e.target.value)}
                            />
                          ) : (
                            <p className="text-sm font-bold text-pink-600">
                              Q{" "}
                              {v.precioVentaActual || v.precio_venta || v.precioVenta
                                ? Number(v.precioVentaActual || v.precio_venta || v.precioVenta).toFixed(2)
                                : "0.00"}
                            </p>
                          )}
                        </div>

                        {/* ACCIONES */}
                        <div className="lg:col-span-2 flex justify-end">
                          {esModoEdicion ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicion}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancelar
                              </Button>

                              <Button
                                size="sm"
                                disabled={!tieneCambios || cargando}
                                onClick={() => handleUpdateVariante(v, idActual)}
                                className="bg-pink-600 hover:bg-pink-700"
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

      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalleProducto;