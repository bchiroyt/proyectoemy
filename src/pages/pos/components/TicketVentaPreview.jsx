import { Tag } from "lucide-react";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";
import { TicketEncabezadoImagen } from "@/pages/pos/components/TicketEncabezadoImagen";

function fmtFechaTicket(valor) {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return String(valor);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Vista del ticket (pantalla e impresión).
 */
export function TicketVentaPreview({ ticket, className }) {
  if (!ticket) return null;

  return (
    <article
      className={cn(
        "ticket-print-area bg-(--color-blanco) text-(--color-negro) max-w-md w-full mx-auto",
        "px-5 py-6 shadow-sm border border-(--color-pos-borde-suave) rounded-lg",
        className
      )}
    >
      <header className="ticket-header border-b border-dashed border-(--color-gris-claro) pb-4 mb-4 text-center">
        <TicketEncabezadoImagen className="mb-3" />
        <p className="ticket-header-text font-bold text-sm text-(--color-negro)">
          {ticket.nombreNegocio}
        </p>
        <p className="ticket-header-text text-xs text-(--color-negro) mt-0.5">
          {ticket.direccion}
        </p>
        <p className="ticket-header-text text-xs font-medium text-(--color-negro) mt-3">
          Servido por <span className="font-bold">{ticket.cajero}</span>
        </p>
      </header>

      <ul className="space-y-2 mb-4">
        {ticket.detalles.map((item, idx) => (
          <li
            key={`${item.nombre}-${idx}`}
            className="ticket-line-item bg-(--color-pagina-3) rounded-lg px-3 py-2.5"
          >
            <div className="flex justify-between gap-2 items-start">
              <span className="font-bold text-sm leading-snug">{item.nombre}</span>
              <span className="font-bold text-sm tabular-nums shrink-0">
                {item.subtotal % 1 === 0 ? item.subtotal : item.subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-(--color-gris-letra) mt-1 tabular-nums">
              {item.cantidad} X {item.precio}
            </p>
            {item.descuento > 0 && (
              <p className="text-xs font-semibold text-(--color-pagina) mt-1 flex justify-between tabular-nums">
                <span>Descuento</span>
                <span>- {fmtQ(item.descuento)}</span>
              </p>
            )}
            {item.notaLinea && (
              <p className="text-xs font-semibold text-(--color-pagina) mt-1.5 flex items-center gap-1">
                <Tag className="size-3 shrink-0" />
                {item.notaLinea}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-dashed border-(--color-gris-claro) pt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-lg font-black">Total</span>
          <span className="text-2xl font-black tabular-nums">{fmtQ(ticket.total)}</span>
        </div>

        {ticket.pagos.map((p, idx) => (
          <div key={`${p.metodoPago}-${idx}`} className="flex justify-between text-sm font-semibold">
            <span>{p.metodoPago}</span>
            <span className="tabular-nums">{fmtQ(p.montoAplicado)}</span>
          </div>
        ))}

        <div className="flex justify-between items-baseline pt-2">
          <span className="text-lg font-black">Cambio</span>
          <span className="text-2xl font-black text-(--color-pagina) tabular-nums">
            {fmtQ(ticket.cambio)}
          </span>
        </div>
      </div>

      <footer className="mt-6 pt-4 border-t border-(--color-gris-claro-2) text-center space-y-2">
        <p className="text-[10px] leading-snug text-(--color-gris-letra)">
          Solo se recibirán cambios por defecto los primeros 3 días después de la compra
        </p>
        <p className="text-xs font-bold">Pedido #{ticket.numeroDocumento}</p>
        <p className="text-[10px] text-(--color-gris-letra) tabular-nums">
          {fmtFechaTicket(ticket.fechaHora)}
        </p>
      </footer>
    </article>
  );
}
