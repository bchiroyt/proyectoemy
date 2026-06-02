import { Check, ChevronDown, Plus, Receipt, X } from "lucide-react";
import { useHeaderTicketsStore } from "@/context/useHeaderTicketsStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LIMITE_TICKETS_ESPERA,
  usePosTicketsStore,
} from "@/context/usePosTicketsStore";
import { fmtQ } from "@/lib/cajaMappers";
import { roundVenta, subtotalLinea } from "@/lib/ventaMappers";
import { cn } from "@/lib/utils";

function resumenTicket(ticket) {
  const lineas = ticket.carrito.filter((p) => p.cantidad > 0);
  const numLineas = lineas.length;
  const total = roundVenta(
    lineas.reduce((acc, p) => acc + subtotalLinea(p), 0)
  );
  return { numLineas, total };
}

export function PosTicketsHeaderDropdown() {
  const tickets = usePosTicketsStore((s) => s.tickets);
  const activeId = usePosTicketsStore((s) => s.activeId);
  const setActivo = usePosTicketsStore((s) => s.setActivo);
  const nuevoTicket = usePosTicketsStore((s) => s.nuevoTicket);
  const cerrarTicket = usePosTicketsStore((s) => s.cerrarTicket);
  const onLimiteAlcanzado = useHeaderTicketsStore((s) => s.onLimiteAlcanzado);

  const indiceActivo = Math.max(
    0,
    tickets.findIndex((t) => t.id === activeId)
  );
  const ticketActivo = tickets[indiceActivo] ?? tickets[0];
  const resumenActivo = ticketActivo ? resumenTicket(ticketActivo) : { numLineas: 0, total: 0 };
  const limiteAlcanzado = tickets.length >= LIMITE_TICKETS_ESPERA;

  const handleNuevo = () => {
    const creado = nuevoTicket();
    if (!creado) onLimiteAlcanzado?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-(--color-blanco)/35 bg-(--color-blanco)/15 px-3 py-1.5 text-sm font-semibold text-(--color-blanco) transition-colors hover:bg-(--color-blanco)/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-blanco)/50"
          aria-label="Ventas en espera"
        >
          <Receipt className="size-4 shrink-0 opacity-90" />
          <span className="hidden sm:inline">Venta {indiceActivo + 1}</span>
          <span className="sm:hidden">{indiceActivo + 1}</span>
          {resumenActivo.numLineas > 0 && (
            <span className="rounded-full bg-(--color-blanco) px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-(--color-pagina)">
              {resumenActivo.numLineas}
            </span>
          )}
          <ChevronDown className="size-4 opacity-80" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <DropdownMenuLabel className="border-b border-(--color-pos-borde-suave) px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-(--color-gris-letra)">
          Ventas en espera ({tickets.length}/{LIMITE_TICKETS_ESPERA})
        </DropdownMenuLabel>
        <div className="max-h-72 overflow-y-auto py-1">
          {tickets.map((t, idx) => {
            const activo = t.id === activeId;
            const { numLineas, total } = resumenTicket(t);
            return (
              <DropdownMenuItem
                key={t.id}
                onSelect={() => {
                  if (!activo) setActivo(t.id);
                }}
                className={cn(
                  "mx-1 cursor-pointer rounded-md px-2 py-2 focus:bg-(--color-pos-accent-suave)",
                  activo && "bg-(--color-pos-accent-suave)/60"
                )}
              >
                <div className="flex w-full min-w-0 items-center gap-2">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      activo
                        ? "bg-(--color-pagina) text-(--color-blanco)"
                        : "bg-(--color-gris-claro-2) text-(--color-gris-letra)"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Venta {idx + 1}
                      {activo && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase text-(--color-pagina)">
                          Activa
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-(--color-gris-letra)">
                      {numLineas === 0
                        ? "Sin artículos"
                        : `${numLineas} artículo${numLineas === 1 ? "" : "s"}`}
                      {numLineas > 0 && (
                        <span className="tabular-nums"> · {fmtQ(total)}</span>
                      )}
                    </p>
                  </div>
                  {activo && (
                    <Check className="size-4 shrink-0 text-(--color-pagina)" aria-hidden />
                  )}
                  <button
                    type="button"
                    aria-label={`Cerrar venta ${idx + 1}`}
                    className="shrink-0 rounded-md p-1 text-(--color-gris-letra) transition-colors hover:bg-black/10 hover:text-(--color-rojo-obscuro)"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cerrarTicket(t.id);
                    }}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          disabled={limiteAlcanzado}
          onSelect={handleNuevo}
          className="mx-1 mb-1 gap-2 rounded-md py-2.5 font-semibold text-(--color-pagina) focus:bg-(--color-pos-accent-suave) focus:text-(--color-pagina) disabled:opacity-50"
        >
          <Plus className="size-4" />
          Nueva venta en espera
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
