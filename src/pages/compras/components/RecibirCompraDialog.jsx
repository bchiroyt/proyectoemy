import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CalendarDays, PackageCheck, Store, X } from "lucide-react";
import {
  useCompraDetalleQuery,
  useFinalizarCompraMutation,
} from "@/hooks/queries/useComprasQueries";
import { getApiErrorMessage } from "@/lib/apiClient";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

const fmtFechaLarga = (iso) => {
  if (!iso) return "—";
  const d = new Date(String(iso).slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function mapDetalleApiToLinea(d) {
  return {
    idDetalleCompra: d.idDetalleCompra ?? d.IdDetalleCompra,
    idVariante: d.idVariante ?? d.IdVariante,
    sku: d.sku ?? d.Sku ?? "",
    productoNombre: d.productoNombre ?? d.ProductoNombre ?? "",
    color: d.color ?? d.Color ?? "",
    tallaNombre: d.tallaNombre ?? d.TallaNombre ?? "",
    presentacionNombre: d.presentacionNombre ?? d.PresentacionNombre ?? "",
    cantidadSolicitada: Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 0),
    costoEstimado: Number(d.costoEstimado ?? d.CostoEstimado ?? 0),
    cantidadRecibida: Number(d.cantidadSolicitada ?? d.CantidadSolicitada ?? 0),
    costoReal: Number(d.costoEstimado ?? d.CostoEstimado ?? 0),
  };
}

const RecibirCompraDialog = ({ open, onOpenChange, idCompra }) => {
  const compraQ = useCompraDetalleQuery(idCompra, { enabled: open && Number(idCompra) > 0 });
  const finalizarMut = useFinalizarCompraMutation();

  const [lineas, setLineas] = useState([]);
  const [confirmarMayor, setConfirmarMayor] = useState(false);
  const [error, setError] = useState("");
  const lastLoadedIdRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const data = compraQ.data;
    if (!data) return;
    const detalles = data.detalles ?? data.Detalles ?? [];
    const idActual = data.idCompra ?? data.IdCompra ?? idCompra;
    if (lastLoadedIdRef.current === idActual) return;
    lastLoadedIdRef.current = idActual;
    queueMicrotask(() => {
      setLineas(detalles.map(mapDetalleApiToLinea));
      setConfirmarMayor(false);
      setError("");
    });
  }, [open, compraQ.data, idCompra]);

  const handleOpenChange = (next) => {
    if (!next) {
      lastLoadedIdRef.current = null;
      setLineas([]);
      setConfirmarMayor(false);
      setError("");
    }
    onOpenChange(next);
  };

  const setRecibida = (idDetalleCompra, valor) => {
    const num = Number(valor);
    setLineas((prev) =>
      prev.map((l) =>
        l.idDetalleCompra === idDetalleCompra
          ? { ...l, cantidadRecibida: Number.isFinite(num) ? Math.max(0, num) : 0 }
          : l
      )
    );
  };

  const setCostoReal = (idDetalleCompra, valor) => {
    const num = Number(valor);
    setLineas((prev) =>
      prev.map((l) =>
        l.idDetalleCompra === idDetalleCompra
          ? { ...l, costoReal: Number.isFinite(num) ? Math.max(0, num) : 0 }
          : l
      )
    );
  };

  const algunaMayor = useMemo(
    () => lineas.some((l) => l.cantidadRecibida > l.cantidadSolicitada),
    [lineas]
  );

  const totalRecepcion = useMemo(
    () => lineas.reduce((acc, l) => acc + l.cantidadRecibida * l.costoReal, 0),
    [lineas]
  );

  const proveedorNombre =
    compraQ.data?.proveedorNombre ?? compraQ.data?.ProveedorNombre ?? "—";
  const fechaCompra = compraQ.data?.fechaCompra ?? compraQ.data?.FechaCompra;
  const numeroOrden = compraQ.data?.numeroOrden ?? compraQ.data?.NumeroOrden;

  const submit = async () => {
    setError("");
    if (!Number(idCompra)) return;
    if (lineas.length === 0) {
      setError("La compra no tiene productos para recibir.");
      return;
    }
    for (const l of lineas) {
      if (!Number.isFinite(l.cantidadRecibida) || l.cantidadRecibida < 0) {
        setError("Las cantidades recibidas no pueden ser negativas.");
        return;
      }
      if (!(l.costoReal > 0)) {
        setError("Debe ingresar el costo real (mayor a cero) de los productos recibidos.");
        return;
      }
    }
    if (algunaMayor && !confirmarMayor) {
      setError(
        "Hay productos con cantidad recibida mayor a la solicitada. Marca la casilla para confirmar."
      );
      return;
    }
    try {
      await finalizarMut.mutateAsync({
        idCompra,
        body: {
          confirmarCantidadMayorSolicitada: confirmarMayor,
          detalles: lineas.map((l) => ({
            idDetalleCompra: l.idDetalleCompra,
            cantidadRecibida: l.cantidadRecibida,
            costoReal: l.costoReal,
          })),
        },
      });
      handleOpenChange(false);
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo finalizar la compra."));
    }
  };

  const cargando = compraQ.isLoading || compraQ.isFetching;
  const guardando = finalizarMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[95vh] sm:h-[90vh] w-[95vw] sm:max-w-[1100px] sm:w-full gap-0 overflow-hidden p-0 flex flex-col"
      >
        <DialogHeader className="border-b border-(--color-gris-claro-2) px-5 py-4 text-left shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold text-(--color-negro)">
                  Recibir pedido de compra
                </DialogTitle>
                <Badge className="bg-pink-100 text-pink-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  En Proceso
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-gris-letra)">
                <span className="inline-flex items-center gap-1 font-medium">
                  # {idCompra ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {fmtFechaLarga(fechaCompra)}
                </span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Store className="size-3.5 shrink-0" />
                  <span className="truncate">{proveedorNombre}</span>
                </span>
                {numeroOrden ? (
                  <span className="font-mono">Ref: {numeroOrden}</span>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-slate-500"
              onClick={() => handleOpenChange(false)}
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {compraQ.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-(--color-blanco) p-4 text-sm text-(--color-rojo)">
              {getApiErrorMessage(compraQ.error, "No se pudo cargar la compra.")}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-red-50 p-3 text-sm text-(--color-rojo)"
            >
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {cargando ? (
            <div className="space-y-2 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <ScrollArea className="max-h-[55vh]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                          Producto
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 w-28">
                          SKU
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-24">
                          Solicitada
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-24">
                          Recibida
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-28">
                          Costo est.
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-28">
                          Costo real
                        </TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right w-28">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-slate-500 py-6">
                            La compra no tiene productos.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineas.map((l) => {
                          const detalleTexto = [l.color, l.tallaNombre, l.presentacionNombre]
                            .filter(Boolean)
                            .join(" · ");
                          const mayor = l.cantidadRecibida > l.cantidadSolicitada;
                          return (
                            <TableRow key={l.idDetalleCompra}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">
                                    {l.productoNombre}
                                  </p>
                                  <p className="text-xs text-slate-500">{detalleTexto || "—"}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {l.cantidadSolicitada}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  step="1"
                                  value={l.cantidadRecibida}
                                  onChange={(e) =>
                                    setRecibida(l.idDetalleCompra, e.target.value)
                                  }
                                  className={`h-8 text-right tabular-nums ${
                                    mayor ? "border-amber-400 bg-amber-50" : ""
                                  }`}
                                />
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-slate-500">
                                {fmtQ(l.costoEstimado)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={l.costoReal}
                                  onChange={(e) =>
                                    setCostoReal(l.idDetalleCompra, e.target.value)
                                  }
                                  className="h-8 text-right tabular-nums"
                                />
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-semibold">
                                {fmtQ(l.cantidadRecibida * l.costoReal)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {algunaMayor ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Cantidad recibida mayor a la solicitada</p>
                    <Label className="mt-2 flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmarMayor}
                        onChange={(e) => setConfirmarMayor(e.target.checked)}
                        className="size-4 accent-amber-600"
                      />
                      Confirmo que se recibió más cantidad de la solicitada
                    </Label>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/80 shrink-0">
          <div className="text-sm">
            <span className="text-slate-500">Total recepción:</span>{" "}
            <span className="font-bold tabular-nums text-(--color-negro)">
              {fmtQ(totalRecepcion)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              size="sm"
              type="button"
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              disabled={guardando || cargando || lineas.length === 0}
              onClick={submit}
            >
              <PackageCheck className="size-4" />
              {guardando ? "Confirmando…" : "Confirmar recepción"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecibirCompraDialog;
