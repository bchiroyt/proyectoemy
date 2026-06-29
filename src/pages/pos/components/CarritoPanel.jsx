import { ShoppingCart, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { descuentoMontoLinea, subtotalLinea, roundVenta, precioUnitarioLinea, precioUnitarioConDescuentoLinea, brutoLinea } from "@/lib/ventaMappers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CarritoPanel({
  carrito,
  setCarrito,
  flashRowId,
  total,
  lineaSeleccionadaId,
  seleccionarLinea,
  deseleccionar,
  cantidadVisible,
  modoReembolso = false,
  lineaReembolsoActivaId = null,
  onAbrirLineaReembolso,
  children,
}) {
  const lineaAportaTotal = (p) =>
    !modoReembolso || !p.esReembolso || p.cantidad > 0;

  const subtotalBrutoCarrito = roundVenta(
    carrito.reduce(
      (acc, p) => acc + (lineaAportaTotal(p) ? brutoLinea(p) : 0),
      0
    )
  );
  const descuentoTotalCarrito = roundVenta(
    carrito.reduce(
      (acc, p) => acc + (lineaAportaTotal(p) ? descuentoMontoLinea(p) : 0),
      0
    )
  );

  const manejarClickLinea = (item) => {
    if (modoReembolso && item.esReembolso && onAbrirLineaReembolso) {
      onAbrirLineaReembolso(item.id);
      return;
    }
    seleccionarLinea(item.id);
  };

  const idLineaActiva = modoReembolso ? lineaReembolsoActivaId : lineaSeleccionadaId;

  return (
    <aside
      className="w-[min(100%,22rem)] shrink-0 bg-(--color-pos-panel) border-r border-(--color-pos-borde-suave) flex flex-col min-h-0 shadow-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) deseleccionar();
      }}
    >
      <div className="p-4 border-b border-(--color-pos-borde-suave) flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-(--color-pagina)">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-bold text-lg">Carrito</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            deseleccionar();
            setCarrito([]);
          }}
          className="text-xs font-semibold text-(--color-pagina) hover:underline"
        >
          Limpiar todo
        </button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto p-2 outline-none"
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) deseleccionar();
        }}
      >
        {carrito.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-3 py-12 text-(--color-pos-texto-muted)">
            <Barcode
              className="size-12 mb-3 opacity-25 text-(--color-pagina)"
              strokeWidth={1.25}
            />
            <p className="text-sm leading-relaxed">
              {modoReembolso
                ? "Configure productos en el detalle de la venta y confirme con «Listo» para agregarlos aquí."
                : "Pase un producto por el escáner para comenzar, o agréguelo desde la cuadrícula."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-(--color-pos-texto-muted) whitespace-normal min-w-0">
                  Producto
                </TableHead>
                <TableHead className="text-(--color-pos-texto-muted) text-right w-12">
                  Cant.
                </TableHead>
                <TableHead className="text-(--color-pos-texto-muted) text-right w-[4.5rem]">
                  P.u.
                </TableHead>
                <TableHead className="text-(--color-pos-texto-muted) text-right w-20">
                  Subt.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carrito.map((item) => {
                const seleccionada = idLineaActiva === item.id;
                const cantStr = cantidadVisible(item);
                const cantNum = item.cantidad;
                const descLinea = descuentoMontoLinea(item);
                const subLinea = subtotalLinea(item);
                const precioUnit = precioUnitarioLinea(item);
                const precioUnitDesc = precioUnitarioConDescuentoLinea(item);
                const brutoLineaItem = brutoLinea(item);

                return (
                  <TableRow
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => manejarClickLinea(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        manejarClickLinea(item);
                      }
                    }}
                    className={cn(
                      "cursor-pointer transition-colors border-l-2 border-l-transparent",
                      seleccionada &&
                        "bg-(--color-pos-accent-suave)/80 border-l-(--color-pagina)",
                      flashRowId === item.id && "animate-pos-scan-flash"
                    )}
                  >
                    <TableCell className="whitespace-normal align-top py-2.5">
                      <span
                        className={cn(
                          "font-medium",
                          seleccionada ? "text-(--color-pagina)" : "text-foreground"
                        )}
                      >
                        {item.nombre}
                      </span>
                      {item.notaLinea && (
                        <p className="text-xs font-medium text-(--color-pagina) mt-1 leading-snug">
                          {item.notaLinea}
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums align-top py-2.5",
                        seleccionada && "font-bold text-(--color-pagina)"
                      )}
                    >
                      {cantStr}
                    </TableCell>
                    <TableCell className="text-right tabular-nums align-top py-2.5">
                      {descLinea > 0 ? (
                        <>
                          <span className="block text-[11px] font-normal text-(--color-pos-texto-muted) line-through">
                            {precioUnit.toFixed(2)}
                          </span>
                          <span className="block font-semibold text-(--color-esmeralda-hover)">
                            {precioUnitDesc.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-(--color-pos-texto-muted)">{precioUnit.toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums align-top py-2.5">
                      {descLinea > 0 ? (
                        <>
                          <span className="block text-[11px] font-normal text-(--color-pos-texto-muted) line-through">
                            {brutoLineaItem.toFixed(2)}
                          </span>
                          <span className="block">{subLinea.toFixed(2)}</span>
                        </>
                      ) : (
                        brutoLineaItem.toFixed(2)
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {modoReembolso && carrito.some((p) => p.esReembolso) && (
          <p className="text-[10px] text-(--color-pos-texto-muted) px-2 pt-2 leading-snug">
            Pulse un producto para abrir el detalle del reembolso.
          </p>
        )}

        {!modoReembolso && lineaSeleccionadaId != null && carrito.length > 0 && (
          <p className="text-[10px] text-(--color-pos-texto-muted) px-2 pt-2 leading-snug">
            Teclado: dígitos cambian cantidad · Supr borra dígito, luego 0, luego quita la línea ·
            Esc cancela
          </p>
        )}
      </div>

      <div className="p-3 border-t border-(--color-pos-borde-suave) space-y-2 bg-(--color-pos-panel)">
        {descuentoTotalCarrito > 0 && (
          <div className="space-y-1 px-1 text-sm">
            <div className="flex justify-between text-(--color-pos-texto-muted)">
              <span>Subtotal</span>
              <span className="tabular-nums">Q {subtotalBrutoCarrito.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-(--color-esmeralda-hover) font-semibold">
              <span>Descuento</span>
              <span className="tabular-nums">- Q {descuentoTotalCarrito.toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-baseline px-1">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold tabular-nums">Q {total.toFixed(2)}</span>
        </div>
        {children}
      </div>
    </aside>
  );
}
