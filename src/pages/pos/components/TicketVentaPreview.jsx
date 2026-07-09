import { Tag } from "lucide-react";
import { fmtQ } from "@/lib/cajaMappers";
import { roundVenta } from "@/lib/ventaMappers";
import { cn } from "@/lib/utils";
import { TicketEncabezadoImagen } from "@/pages/pos/components/TicketEncabezadoImagen";

function normalizarDetalleTicket(item) {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precio) || 0;
  const bruto = roundVenta(cantidad * precio);
  const subtotal =
    item.subtotal != null ? roundVenta(Number(item.subtotal)) : bruto;
  const descuento =
    Number(item.descuento) > 0
      ? roundVenta(Number(item.descuento))
      : bruto > subtotal
        ? roundVenta(bruto - subtotal)
        : 0;

  return {
    ...item,
    cantidad,
    precio,
    bruto,
    subtotal: roundVenta(subtotal || Math.max(0, bruto - descuento)),
    descuento,
  };
}

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
export function TicketVentaPreview({ ticket, className, ...rest }) {
  if (!ticket) return null;

  const detalles = ticket.detalles.map(normalizarDetalleTicket);
  const totalDescuento = roundVenta(
    detalles.reduce((sum, item) => sum + (Number(item.descuento) || 0), 0)
  );
  const subtotalBruto = roundVenta(
    detalles.reduce((sum, item) => sum + (Number(item.bruto) || 0), 0)
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
        <p className="ticket-header-text text-xs font-medium text-(--color-negro) mt-3">
          Servido por <span className="font-bold">{ticket.cajero}</span>
        </p>
      </header>

      <ul className="space-y-2 mb-4">
        {detalles.map((item, idx) => {
          const tieneDescuento = item.descuento > 0;
          return (
            <li
              key={`${item.nombre}-${idx}`}
              className="ticket-line-item bg-(--color-pagina-3) rounded-lg px-3 py-2.5"
            >
              <div className="flex justify-between items-baseline gap-4 w-full">
                <span className="font-bold text-sm text-(--color-negro) leading-snug break-words max-w-[65%]">
                  {item.nombre}
                </span>
                <span className="shrink-0 text-right text-sm font-bold text-(--color-negro) tabular-nums">
                  {item.cantidad} x {fmtQ(item.precio)}
                </span>
              </div>
              {tieneDescuento && (
                <div className="ticket-discount-row flex justify-between items-baseline text-xs font-semibold text-(--color-pagina) mt-1 pl-2 w-full">
                  <span>Descuento</span>
                  <span className="tabular-nums">- {fmtQ(item.descuento)}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-dashed border-(--color-gris-claro) pt-4">
        {totalDescuento > 0 && (
          <>
            <div className="flex justify-between items-baseline text-sm font-semibold">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmtQ(subtotalBruto)}</span>
            </div>
            <div className="ticket-discount-row flex justify-between items-baseline text-sm font-bold text-(--color-pagina)">
              <span>Total Descuento</span>
              <span className="tabular-nums">- {fmtQ(totalDescuento)}</span>
            </div>
          </>
        )}

        <div className="ticket-total-row flex justify-between items-baseline">
          <span className="ticket-summary-label">Total</span>
          <span className="ticket-summary-value tabular-nums">{fmtQ(ticket.total)}</span>
        </div>

        {ticket.pagos.map((p, idx) => {
          const montoMostrado =
            Number(p.montoRecibido) > 0 ? Number(p.montoRecibido) : Number(p.montoAplicado);
          return (
            <div key={`${p.metodoPago}-${idx}`} className="flex justify-between text-sm font-semibold">
              <span>{p.metodoPago}</span>
              <span className="tabular-nums">{fmtQ(montoMostrado)}</span>
            </div>
          );
        })}

        <div className="ticket-cambio-row flex justify-between items-baseline pt-2">
          <span className="ticket-summary-label">Cambio</span>
          <span className="ticket-summary-value ticket-summary-cambio tabular-nums">
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
