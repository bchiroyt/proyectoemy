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
  disabled = false,
}) {
  return (
    <section
      aria-labelledby="compra-datos-generales-titulo"
      className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm"
    >
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
