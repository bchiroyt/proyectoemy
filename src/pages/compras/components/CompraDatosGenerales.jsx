import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard } from "lucide-react";

const controlClass = "h-7 min-h-7 bg-(--color-gris-claro-2) text-xs shadow-none";

function Campo({ label, children, className }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Label className="w-[4.25rem] shrink-0 text-right text-[9px] font-bold uppercase leading-none text-(--color-gris-letra)">
        {label}
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function addDaysToDateString(value, days) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function CompraDatosGenerales({
  proveedor,
  onProveedorChange,
  proveedores,
  proveedoresLoading,
  fechaPedido,
  onFechaPedidoChange,
  documentoRef,
  onDocumentoRefChange,
  tipoComprobante,
  onTipoComprobanteChange,
  showCreditoControls = false,
  esCredito = false,
  onEsCreditoChange,
  fechaVencimientoCredito = "",
  onFechaVencimientoCreditoChange,
  disabled = false,
}) {
  const fechaMinimaVencimiento = addDaysToDateString(fechaPedido, 1);

  return (
    <section
      aria-labelledby="compra-datos-generales-titulo"
      className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm"
    >
      {showCreditoControls ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-(--color-gris-claro-2) px-2.5 py-2">
          <div className="flex min-w-[13rem] flex-1 items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={esCredito}
              aria-label="Compra al credito"
              onClick={() => onEsCreditoChange?.(!esCredito)}
              disabled={disabled}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-pagina-2) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
                esCredito
                  ? "border-emerald-700 bg-emerald-700"
                  : "border-(--color-gris-claro) bg-(--color-gris-claro-2)"
              )}
            >
              <span
                className={cn(
                  "absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-(--color-blanco) shadow-sm transition-transform",
                  esCredito ? "translate-x-[1.35rem]" : "translate-x-1"
                )}
              />
            </button>
            <div className="flex min-w-0 items-center gap-1.5">
              <CreditCard
                className={cn(
                  "size-4 shrink-0",
                  esCredito ? "text-emerald-700" : "text-(--color-gris-letra)"
                )}
              />
              <span className="truncate text-xs font-bold text-(--color-negro)">
                Compra al credito
              </span>
            </div>
          </div>

          {esCredito ? (
            <Campo label="Vence" className="w-full sm:w-auto sm:min-w-[12rem]">
              <Input
                type="date"
                value={fechaVencimientoCredito}
                min={fechaMinimaVencimiento}
                onChange={(e) => onFechaVencimientoCreditoChange?.(e.target.value)}
                className={controlClass}
                disabled={disabled}
              />
            </Campo>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2.5 py-1.5 lg:flex-nowrap">
        <h2
          id="compra-datos-generales-titulo"
          className="w-full shrink-0 text-[10px] font-bold uppercase leading-none text-(--color-negro) lg:w-auto"
        >
          Datos generales
        </h2>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 lg:flex-nowrap">
          <Campo label="Proveedor" className="w-full sm:w-auto sm:min-w-[11rem] lg:min-w-[12rem] lg:flex-[1.35]">
            {proveedoresLoading ? (
              <div className={cn(controlClass, "w-full animate-pulse rounded-md")} />
            ) : (
              <Select value={proveedor} onValueChange={onProveedorChange} disabled={disabled}>
                <SelectTrigger className={cn(controlClass, "w-full")}>
                  <SelectValue placeholder="Seleccione…" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Campo>

          <Campo label="Fecha" className="w-full sm:w-auto sm:min-w-[9.5rem]">
            <Input
              type="date"
              value={fechaPedido}
              onChange={(e) => onFechaPedidoChange(e.target.value)}
              className={controlClass}
              disabled={disabled}
            />
          </Campo>

          <Campo label="No. ref." className="w-full sm:w-auto sm:min-w-[9rem] lg:min-w-[8rem] lg:flex-1">
            <Input
              value={documentoRef}
              onChange={(e) => onDocumentoRefChange(e.target.value)}
              placeholder="REF-00123"
              className={controlClass}
              disabled={disabled}
            />
          </Campo>

          <Campo label="Comprob." className="w-full sm:w-auto sm:min-w-[10rem] lg:min-w-[9.5rem]">
            <Select value={tipoComprobante} onValueChange={onTipoComprobanteChange} disabled={disabled}>
              <SelectTrigger className={cn(controlClass, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin comprobante</SelectItem>
                <SelectItem value="1">Nota de crédito</SelectItem>
                <SelectItem value="2">Factura</SelectItem>
                <SelectItem value="3">Envio</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
        </div>
      </div>
    </section>
  );
}
