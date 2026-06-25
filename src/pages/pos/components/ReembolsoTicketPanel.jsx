import { Check, Printer } from "lucide-react";
import { usePosVentaStore } from "@/context/usePosVentaStore";
import { imprimirTicket } from "@/lib/printTicket";
import { ReembolsoTicketPreview } from "@/pages/pos/components/ReembolsoTicketPreview";
import { cn } from "@/lib/utils";

/**
 * Ticket de reembolso (respaldo local) con acciones imprimir / finalizar.
 */
export function ReembolsoTicketPanel({ onFinalizar, className }) {
  const ticket = usePosVentaStore((s) => s.ultimoReembolso);

  const handleImprimir = () => {
    void imprimirTicket();
  };

  if (!ticket) {
    return null;
  }

  return (
    <div className={cn("flex flex-col h-full min-h-0 ticket-page", className)}>
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-4 flex flex-col items-center">
        <ReembolsoTicketPreview ticket={ticket} />
      </div>

      <div className="ticket-actions shrink-0 p-4 border-t border-(--color-pos-borde-suave) bg-(--color-pos-panel)">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onFinalizar}
            className={cn(
              "py-3.5 rounded-xl font-bold text-(--color-blanco) text-sm flex items-center justify-center gap-2",
              "bg-(--color-pagina-2) hover:bg-(--color-esmeralda-hover) transition-colors"
            )}
          >
            <Check className="size-4" />
            Finalizar
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            className={cn(
              "py-3.5 rounded-xl font-bold text-sm border-2 flex items-center justify-center gap-2",
              "border-(--color-gris-claro) bg-(--color-blanco) text-(--color-negro)",
              "hover:bg-(--color-pagina-3) transition-colors"
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
