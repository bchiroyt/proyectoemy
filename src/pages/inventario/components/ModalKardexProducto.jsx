import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

// IMPORTACIONES DE TU ARQUITECTURA
import { ScrollArea } from "@/components/ui/scroll-area";
import { obtenerKardexPorProducto } from "@/services/kardex";

const ModalKardexProducto = ({ open, onClose, producto }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Captura el ID de forma segura
  const idProducto = producto?.idProducto || producto?.id_producto || producto?.id;

  useEffect(() => {
    const cargarKardex = async () => {
      if (!open || !idProducto) return;

      try {
        setCargando(true);
        const res = await obtenerKardexPorProducto(idProducto);
        
        // Estructura estándar RespuestaBase de tu C# (.exito y .data)
        if (res?.exito && res?.data) {
          setMovimientos(Array.isArray(res.data) ? res.data : []);
        } else {
          setMovimientos(Array.isArray(res) ? res : []);
        }
      } catch (error) {
        console.error("Error al obtener los movimientos del kardex:", error);
        setMovimientos([]);
      } finally {
        setCargando(false);
      }
    };

    cargarKardex();
  }, [open, idProducto]);

  useEffect(() => {
    if (!open) {
      setMovimientos([]);
    }
  }, [open]);

  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border-t-4 border-pink-600">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Kardex de Inventario
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Producto: <span className="font-semibold text-slate-700">{producto.nombre || "---"}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO - TABLA DEL PROTOTIPO */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
          {cargando ? (
            <div className="flex flex-col items-center justify-center p-20 flex-1 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
              <p className="text-xs text-slate-500 font-medium">Consultando movimientos en el servidor...</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-medium text-sm flex-1 flex items-center justify-center">
              No se encontraron movimientos registrados para este producto en el kardex.
            </div>
          ) : (
            <ScrollArea className="flex-1 p-6">
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-left">No.</th>
                      <th className="p-4 text-left">Fecha</th>
                      <th className="p-4 text-left">Especificación</th>
                      <th className="p-4 text-left">Color</th>
                      <th className="p-4 text-left">Tipo</th>
                      <th className="p-4 text-right">Cant.</th>
                      <th className="p-4 text-left">Referencia / Documento</th>
                      <th className="p-4 text-right">Saldo Histórico</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {movimientos.map((m, index) => {
                      // Leer el tipo de movimiento ("ENTRADA" o "SALIDA")
                      const tipo = m.tipoMovimiento || m.tipo || "";
                      const esEntrada = tipo.toUpperCase() === "ENTRADA" || tipo.toUpperCase().includes("INGRESO");

                      return (
                        <tr key={m.idInventario || index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono text-xs text-slate-400">
                            #{index + 1}
                          </td>
                          <td className="p-4 whitespace-nowrap text-xs">
                            {m.fechaMovimiento || m.fecha ? new Date(m.fechaMovimiento || m.fecha).toLocaleString() : "---"}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800">
                              {m.nombrePresentacion || m.presentacion || "General"}
                            </span>
                            {(m.nombreTalla || m.talla) ? ` • ${m.nombreTalla || m.talla}` : ""}
                          </td>
                          <td className="p-4 uppercase text-xs font-medium text-slate-500">
                            {m.nombreColor || m.color || "N/A"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                                esEntrada
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-pink-50 text-pink-600 border border-pink-100"
                              }`}
                            >
                              {tipo || "SALIDA"}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-bold text-sm ${esEntrada ? "text-green-700" : "text-red-600"}`}>
                            {esEntrada ? "+" : "-"}
                            {m.cantidad}
                          </td>
                          <td className="p-4 text-slate-500 text-xs max-w-xs truncate">
                            {m.motivo || m.referencia || "Sin especificar"}
                          </td>
                          <td className="p-4 text-right font-bold text-slate-900 bg-slate-50/30">
                            {m.saldoHistorico ?? m.saldo ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end shrink-0 bg-white">
          <button
            onClick={onClose}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-xl text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            Cerrar Kardex
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalKardexProducto;