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
 * Vista del ticket de reembolso (pantalla e impresión).
 */
export function ReembolsoTicketPreview({ ticket, className, ...rest }) {
  if (!ticket) return null;

  const totalPenalizacion = ticket.detalles.reduce(
    (sum, item) => sum + (Number(item.penalizacion) || 0),
    0
  );

  return (
    <article
      className={cn(
        "ticket-print-area bg-(--color-blanco) text-(--color-negro) max-w-md w-full mx-auto",
        "px-5 py-6 shadow-sm border border-(--color-pos-borde-suave) rounded-lg",
        className
      )}
      {...rest}
    >
      <header className="ticket-header border-b border-dashed border-(--color-gris-claro) pb-4 mb-4 text-center">
        <TicketEncabezadoImagen className="mb-3" />
        <p className="ticket-header-text font-bold text-sm text-(--color-negro)">
          {ticket.nombreNegocio}
        </p>
        <p className="ticket-header-text text-xs text-(--color-negro) mt-0.5">
          {ticket.direccion}
        </p>
        <p className="ticket-header-text text-sm font-black text-(--color-negro) mt-3 tracking-wide">
          COMPROBANTE DE REEMBOLSO
        </p>
        <p className="ticket-header-text text-xs font-medium text-(--color-negro) mt-2">
          Atendido por <span className="font-bold">{ticket.cajero}</span>
        </p>
      </header>

      {(ticket.numeroVenta || ticket.motivo) && (
        <div className="mb-4 text-xs text-(--color-negro) space-y-1">
          {ticket.numeroVenta && (
            <p>
              Venta original: <span className="font-bold">#{ticket.numeroVenta}</span>
            </p>
          )}
          {ticket.motivo && (
            <p>
              Motivo: <span className="font-medium">{ticket.motivo}</span>
            </p>
          )}
        </div>
      )}

      <ul className="space-y-2 mb-4">
        {ticket.detalles.map((item, idx) => {
          const tienePenalizacion = item.penalizacion > 0;
          return (
            <li
              key={`${item.nombre}-${idx}`}
              className="ticket-line-item bg-(--color-pagina-3) rounded-lg px-3 py-2.5"
            >
              <div className="flex justify-between items-baseline gap-4 w-full">
                <span className="font-bold text-sm text-(--color-negro) leading-snug break-words max-w-[60%]">
                  {item.nombre}
                </span>
                <span className="shrink-0 text-right text-sm font-bold text-(--color-negro) tabular-nums">
                  {item.cantidad} ud · {fmtQ(item.montoReembolsado)}
                </span>
              </div>
              {tienePenalizacion && (
                <div className="flex justify-between items-baseline text-xs font-semibold text-(--color-pagina) mt-1 pl-2 w-full">
                  <span>Penalización</span>
                  <span className="tabular-nums">- {fmtQ(item.penalizacion)}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-dashed border-(--color-gris-claro) pt-4">
        {totalPenalizacion > 0 && (
          <div className="flex justify-between items-baseline text-sm font-bold text-(--color-pagina)">
            <span>Total Penalización</span>
            <span className="tabular-nums">- {fmtQ(totalPenalizacion)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline">
          <span className="text-lg font-black">Total reembolsado</span>
          <span className="text-2xl font-black tabular-nums">
            {fmtQ(ticket.totalReembolsado)}
          </span>
        </div>

        {ticket.pagos.map((p, idx) => (
          <div
            key={`${p.metodoPago}-${idx}`}
            className="flex justify-between text-sm font-semibold"
          >
            <span>Devuelto en {p.metodoPago}</span>
            <span className="tabular-nums">{fmtQ(p.montoAplicado)}</span>
          </div>
        ))}
      </div>

      <footer className="mt-6 pt-4 border-t border-(--color-gris-claro-2) text-center space-y-2">
        <p className="text-[10px] leading-snug text-(--color-gris-letra)">
          Comprobante de devolución. Conserve este ticket para cualquier aclaración.
        </p>
        {ticket.numeroDocumento && (
          <p className="text-xs font-bold">Reembolso #{ticket.numeroDocumento}</p>
        )}
        <p className="text-[10px] text-(--color-gris-letra) tabular-nums">
          {fmtFechaTicket(ticket.fechaHora)}
        </p>
      </footer>
    </article>
  );
}
