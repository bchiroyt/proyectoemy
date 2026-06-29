import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Paginacion from "@/components/shared/Paginacion";
import { useVentasHistorialQuery } from "@/hooks/queries/useVentaQueries";
import { etiquetaEstadoVenta } from "@/lib/ventaMappers";
import { fmtQ } from "@/lib/cajaMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import { useVentaTicketQuery } from "@/hooks/queries/useVentaQueries";
import { TicketVentaPreview } from "@/pages/pos/components/TicketVentaPreview";
import { ReembolsoTicketPreview } from "@/pages/pos/components/ReembolsoTicketPreview";
import { imprimirTicket } from "@/lib/printTicket";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

function badgeEstadoClase(estado) {
  const valor = String(estado ?? "").trim().toUpperCase();
  if (valor === "CONFIRMADA") {
    return "bg-green-100 text-green-800 hover:bg-green-100";
  }
  if (valor === "REEMBOLSADA" || valor === "PARC_REEMBOLSADA") {
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
  return "bg-muted text-muted-foreground hover:bg-muted";
}

function formatearFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-GT");
}

export function HistorialTransaccionesDialog({ open, onOpenChange, idCaja }) {
  const [page, setPage] = useState(1);
  const [ticketPreviewId, setTicketPreviewId] = useState(null);

  useEffect(() => {
    if (open) setPage(1);
  }, [open, idCaja]);

  const ventasQ = useVentasHistorialQuery(
    { page, pageSize: PAGE_SIZE },
    { enabled: open }
  );

  const items = ventasQ.data?.items ?? [];
  const totalCount = ventasQ.data?.totalCount ?? 0;
  const totalPages = ventasQ.data?.totalPages ?? 1;
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(88vh,720px)] w-[95vw] max-h-[90vh] flex-col gap-0 overflow-hidden border-t-4 border-(--color-pagina) p-0 sm:max-w-5xl sm:w-full">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-lg">Historial de transacciones</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
          {ventasQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : ventasQ.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-red-50 p-4 text-sm text-(--color-rojo)">
              {getApiErrorMessage(ventasQ.error, "No se pudo cargar el historial de transacciones.")}
            </div>
          ) : (
            <ScrollArea className="h-full min-h-0 flex-1 rounded-lg border border-border bg-(--color-blanco) shadow-sm">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[140px] font-bold">No. transacción</TableHead>
                    <TableHead className="min-w-[180px] font-bold">Fecha y hora</TableHead>
                    <TableHead className="min-w-[160px] font-bold">Cajero</TableHead>
                    <TableHead className="min-w-[120px] font-bold">Estado</TableHead>
                    <TableHead className="min-w-[100px] text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((venta) => (
                    <TableRow 
                      key={venta.idVenta} 
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setTicketPreviewId(venta.idVenta)}
                    >
                      <TableCell className="font-mono font-semibold text-(--color-pagina)">
                        {venta.numeroTicket || `#${venta.idVenta}`}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatearFechaHora(venta.fechaHora)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {venta.usuarioNombre || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeEstadoClase(venta.estadoVenta)}>
                          {etiquetaEstadoVenta(venta.estadoVenta)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {fmtQ(venta.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!items.length && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No hay transacciones registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {!ventasQ.isLoading && !ventasQ.isError && (
            <div className="flex shrink-0 justify-end pt-1">
              <Paginacion
                from={from}
                to={to}
                total={totalCount}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                disablePrev={page <= 1}
                disableNext={page >= totalPages}
                isLoading={ventasQ.isFetching}
              />
            </div>
          )}
        </div>
      </DialogContent>
      
      <Dialog open={!!ticketPreviewId} onOpenChange={(o) => !o && setTicketPreviewId(null)}>
        <DialogContent aria-describedby={undefined} className="flex flex-col gap-0 p-0 sm:max-w-md h-[90vh] sm:h-auto overflow-hidden">
          <DialogHeader className="shrink-0 border-b px-6 py-4 flex flex-row justify-between items-center">
            <DialogTitle className="text-lg">Reimpresión de ticket</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-4">
            <TicketPreviewContent idVenta={ticketPreviewId} />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function TicketPreviewContent({ idVenta }) {
  const ticketQ = useVentaTicketQuery(idVenta, { enabled: !!idVenta });
  
  if (ticketQ.isLoading) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p>Cargando ticket...</p>
      </div>
    );
  }
  
  if (ticketQ.isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-red-50 p-4 text-sm text-(--color-rojo)">
        {getApiErrorMessage(ticketQ.error, "Error al cargar el ticket.")}
      </div>
    );
  }
  
  const ticket = ticketQ.data?.data;
  if (!ticket) return null;
  
  const isReembolso = ticket.tipo === "reembolso";

  return (
    <div className="flex flex-col gap-4">
      {isReembolso ? (
        <ReembolsoTicketPreview ticket={ticket} />
      ) : (
        <TicketVentaPreview ticket={ticket} />
      )}
      
      <Button 
        onClick={() => imprimirTicket()} 
        className="w-full mt-2 font-bold bg-(--color-pagina) hover:bg-(--color-pagina-2) text-white"
        size="lg"
      >
        <Printer className="mr-2 h-5 w-5" />
        Imprimir Ticket
      </Button>
    </div>
  );
}
