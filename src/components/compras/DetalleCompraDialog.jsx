import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Store, FileText, Printer, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

const fmtQ = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

const fmtFechaLarga = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const estadoBadge = (estado) => {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
  if (estado === "Recibido")
    return cn(base, "bg-emerald-100 text-emerald-800");
  if (estado === "En Proceso")
    return cn(base, "bg-pink-100 text-pink-700");
  return cn(base, "bg-slate-100 text-slate-600");
};

const DetalleCompraDialog = ({ open, onOpenChange, compra }) => {
  if (!compra) return null;

  const subtotal = compra.items.reduce(
    (acc, it) => acc + it.cantidad * it.precioUnitario,
    0
  );
  const descuento = 0;
  const total = subtotal - descuento;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(90vh,800px)] w-[min(100vw-1rem,920px)] gap-0 overflow-hidden p-0 flex flex-col"
      >
        <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-800">
                  Detalle de Compra
                </DialogTitle>
                <Badge className={estadoBadge(compra.estado)} variant="secondary">
                  {compra.estado}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium">
                  <FileText className="size-3.5 shrink-0" /># {compra.id}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {fmtFechaLarga(compra.fechaPedido)}
                </span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Store className="size-3.5 shrink-0" />
                  <span className="truncate">{compra.proveedor.nombre}</span>
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-slate-500"
              onClick={() => onOpenChange(false)}
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {compra.items.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No hay líneas de detalle para esta compra.
            </p>
          ) : (
            <div className="rounded-lg border border-slate-100 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                      Descripción
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                      Color
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                      Talla
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                      SKU
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600">
                      Código
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right">
                      Cant.
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right">
                      P. unit.
                    </TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-600 text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compra.items.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-slate-800">
                        {row.descripcion}
                      </TableCell>
                      <TableCell>{row.color}</TableCell>
                      <TableCell>{row.talla}</TableCell>
                      <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.codigoBarras}
                      </TableCell>
                      <TableCell className="text-right">{row.cantidad}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtQ(row.precioUnitario)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {fmtQ(row.cantidad * row.precioUnitario)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Notas del proveedor
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {compra.notasProveedor || "Sin notas registradas."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{fmtQ(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Descuento (0%)</span>
                <span className="tabular-nums">{fmtQ(descuento)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800">Total final</span>
                <span className="text-xl font-black text-(--color-pagina) tabular-nums">
                  {fmtQ(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/80 shrink-0">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" type="button">
              <Printer className="size-4" />
              Imprimir recibo
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-(--color-pagina) hover:bg-(--color-borde-button) text-white"
              type="button"
            >
              <Download className="size-4" />
              Descargar PDF
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleCompraDialog;
