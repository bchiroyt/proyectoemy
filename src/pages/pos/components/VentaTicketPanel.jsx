import { useMemo } from "react";
import { Printer } from "lucide-react";
import { useAuthStore } from "@/context/useAuthStore";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import { useVentaTicketQuery } from "@/hooks/queries/useVentaQueries";
import { buildTicketDesdeCobro } from "@/lib/ventaMappers";
import { imprimirTicket } from "@/lib/printTicket";
import { TicketVentaPreview } from "@/pages/pos/components/TicketVentaPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Ticket de venta (API o respaldo local) con acciones imprimir / nueva venta.
 */
export function VentaTicketPanel({ onNuevaVenta, className }) {
  const ultimaVenta = usePosVentaStore((s) => s.ultimaVenta);
  const user = useAuthStore((s) => s.user);
  const nombreMostrar =
    user?.nombreMostrar ||
    [user?.nombres, user?.apellidos].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "";

  const idVenta = ultimaVenta?.idVenta;
  const ticketQ = useVentaTicketQuery(idVenta, { enabled: !!idVenta });

  const ticket = useMemo(() => {
    if (ticketQ.data?.data) return ticketQ.data.data;
    if (!ultimaVenta) return null;
    return buildTicketDesdeCobro({
      ventaCreada: ultimaVenta,
      lineas: ultimaVenta.lineas,
      pagos: ultimaVenta.pagos,
      cajeroNombre: nombreMostrar,
    });
  }, [ticketQ.data, ultimaVenta, nombreMostrar]);

  const handleImprimir = () => {
    void imprimirTicket();
  };

  if (!ultimaVenta) {
    return null;
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0 ticket-page", className)}>
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-4 flex flex-col items-center">
        {ticketQ.isLoading && idVenta && !ticket && (
          <Skeleton className="w-full max-w-md h-[520px] rounded-lg" />
        )}

        {ticketQ.isError && idVenta && !ticketQ.data?.data && (
          <p className="text-sm text-(--color-rojo-obscuro) mb-4 text-center max-w-md">
            No se pudo cargar el ticket del servidor. Se muestra el comprobante local.
          </p>
        )}

        {ticket && <TicketVentaPreview ticket={ticket} />}
      </div>

      <div className="ticket-actions shrink-0 p-4 border-t border-(--color-pos-borde-suave) bg-(--color-pos-panel)">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onNuevaVenta}
            className={cn(
              "py-3.5 rounded-xl font-bold text-(--color-blanco) text-sm",
              "bg-(--color-pagina-2) hover:bg-(--color-esmeralda-hover) transition-colors"
            )}
          >
            Nueva venta
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            disabled={!ticket}
            className={cn(
              "py-3.5 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-2",
              "border-(--color-gris-claro) bg-(--color-blanco) text-(--color-negro)",
              "hover:bg-(--color-pagina-3) transition-colors disabled:opacity-50"
            )}
          >
            <Printer className="size-4" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
