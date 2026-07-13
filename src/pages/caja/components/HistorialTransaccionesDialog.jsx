import { useEffect, useMemo, useState } from "react";
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
import { etiquetaEstadoVenta, enriquecerTicketEncabezado } from "@/lib/ventaMappers";
import { useAuthStore } from "@/context/useAuthStore";
import { fmtQ } from "@/lib/cajaMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";
import { useVentaTicketQuery } from "@/hooks/queries/useVentaQueries";
import { useReembolsoComprobanteQuery } from "@/hooks/queries/useReembolsoQueries";
import { TicketVentaPreview } from "@/pages/pos/components/TicketVentaPreview";
import { ReembolsoTicketPreview } from "@/pages/pos/components/ReembolsoTicketPreview";
import { imprimirTicket } from "@/lib/printTicket";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function badgeEstadoClase(estado, tipo) {
  const valor = String(estado ?? "").trim().toUpperCase();
  if (tipo === "reembolso" || valor === "REEMBOLSO") {
    return "bg-rose-100 text-rose-800 hover:bg-rose-100";
  }
  if (valor === "CONFIRMADA") {
    return "bg-green-100 text-green-800 hover:bg-green-100";
  }
  if (valor === "REEMBOLSADA" || valor === "PARC_REEMBOLSADA") {
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
  return "bg-muted text-muted-foreground hover:bg-muted";
}

function etiquetaHistorial(item) {
  if (item.tipo === "reembolso") return "Reembolso";
  return etiquetaEstadoVenta(item.estadoVenta);
}

function formatearFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-GT");
}

export function HistorialTransaccionesDialog({ open, onOpenChange }) {
  const [page, setPage] = useState(1);
  const [ticketPreview, setTicketPreview] = useState(null);

  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

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
            <EstadoErrorCarga
              compact
              error={ventasQ.error}
              nombreModulo="historial de transacciones"
              fallbackGenerico="No se pudo cargar el historial de transacciones."
              onReintentar={() => ventasQ.refetch()}
            />
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
                  {items.map((transaccion) => (
                    <TableRow
                      key={transaccion.id ?? `${transaccion.tipo}-${transaccion.idVenta ?? transaccion.idReembolso}`}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() =>
                        setTicketPreview({
                          tipo: transaccion.tipo ?? "venta",
                          idVenta: transaccion.idVenta,
                          idReembolso: transaccion.idReembolso,
                          idCaja: transaccion.idCaja,
                          cajeroNombre: transaccion.usuarioNombre,
                        })
                      }
                    >
                      <TableCell className="font-mono font-semibold text-(--color-pagina)">
                        {transaccion.numeroTicket ||
                          (transaccion.tipo === "reembolso"
                            ? `#R-${transaccion.idReembolso}`
                            : `#${transaccion.idVenta}`)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatearFechaHora(transaccion.fechaHora)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {transaccion.usuarioNombre || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeEstadoClase(transaccion.estadoVenta, transaccion.tipo)}>
                          {etiquetaHistorial(transaccion)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-sm tabular-nums",
                          transaccion.tipo === "reembolso" && "text-(--color-rojo-obscuro)"
                        )}
                      >
                        {fmtQ(transaccion.total)}
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
      
      <Dialog open={!!ticketPreview} onOpenChange={(o) => !o && setTicketPreview(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="flex h-[min(90vh,720px)] max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b px-6 py-4">
            <DialogTitle className="text-lg">Reimpresión de ticket</DialogTitle>
          </DialogHeader>
          <TicketPreviewContent venta={ticketPreview} />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function TicketPreviewContent({ venta }) {
  const user = useAuthStore((s) => s.user);
  const nombreSesion =
    user?.nombreMostrar ||
    [user?.nombres, user?.apellidos].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "";
  const cajeroFallback = venta?.cajeroNombre || nombreSesion;
  const esReembolso = venta?.tipo === "reembolso";
  const idVenta = venta?.idVenta;
  const idReembolso = venta?.idReembolso;
  const idCaja = venta?.idCaja;

  const ventaTicketQ = useVentaTicketQuery(idVenta, {
    enabled: !!idVenta && !esReembolso,
    idCaja,
  });
  const reembolsoTicketQ = useReembolsoComprobanteQuery(idReembolso, {
    enabled: !!idReembolso && esReembolso,
    idCaja,
  });

  const ticketQ = esReembolso ? reembolsoTicketQ : ventaTicketQ;

  const ticket = useMemo(() => {
    const base = ticketQ.data?.data;
    if (!base) return null;
    return enriquecerTicketEncabezado(base, { cajeroFallback });
  }, [ticketQ.data, cajeroFallback]);
  
  if (ticketQ.isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 p-4 text-muted-foreground">
        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
        <p>Cargando ticket...</p>
      </div>
    );
  }

  if (ticketQ.isError) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4">
        <div className="rounded-lg border border-destructive/30 bg-red-50 p-4 text-sm text-(--color-rojo)">
          {getApiErrorMessage(ticketQ.error, "Error al cargar el ticket.")}
          <p className="mt-2 text-xs leading-relaxed text-(--color-rojo-obscuro)/80">
            Este mensaje lo devuelve el servidor al generar el ticket. Si menciona
            sucursal activa, debe corregirse en el backend para que use la ubicación
            o sucursal guardada en la venta, no la sesión actual.
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4">
        <div className="ticket-page mx-auto w-full max-w-md">
          {esReembolso ? (
            <ReembolsoTicketPreview ticket={ticket} data-print-source />
          ) : (
            <TicketVentaPreview ticket={ticket} data-print-source />
          )}
        </div>
      </div>

      <div className="ticket-actions shrink-0 border-t bg-(--color-pos-panel) p-4">
        <Button
          onClick={() => imprimirTicket()}
          className="mt-0 w-full bg-(--color-pagina) font-bold text-white hover:bg-(--color-pagina-2)"
          size="lg"
        >
          <Printer className="mr-2 h-5 w-5" />
          Imprimir Ticket
        </Button>
      </div>
    </>
  );
}
