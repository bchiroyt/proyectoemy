import { cn } from "@/lib/utils";

export function fmtCantidadReembolso(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return Number.isInteger(x) ? String(x) : String(x);
}

export function ReembolsoLineaResumen({ item }) {
  const vendida = fmtCantidadReembolso(item.cantidadVendida);
  const reembolsa = fmtCantidadReembolso(item.cantidad);
  const yaDevuelta = Number(item.cantidadYaDevuelta) || 0;
  const disponible = fmtCantidadReembolso(item.maxCantidad);

  return (
    <div className="rounded-md bg-(--color-pos-accent-suave)/40 px-2 py-1.5 text-[11px] text-(--color-pos-texto-muted) space-y-1">
      <p>
        <span className="font-semibold text-foreground">Vendió {vendida}</span>
        {" · "}
        <span>Disponible {disponible}</span>
        {yaDevuelta > 0 && (
          <>
            {" · "}
            <span>Ya devolvió {fmtCantidadReembolso(yaDevuelta)}</span>
          </>
        )}
      </p>
      {item.cantidad > 0 && (
        <p className="font-semibold text-(--color-pagina)">A reembolsar: {reembolsa}</p>
      )}
    </div>
  );
}

export function ReembolsoLineaConfig({
  item,
  onActualizar,
  onCantidadChange,
  mostrarCantidad = true,
  motivo = "",
  onMotivoChange,
  observacion = "",
  onObservacionChange,
}) {
  const puedeInventario =
    item.productoRecibido && item.puedeReintegrarInventario !== false;

  return (
    <div className="space-y-2.5">
      <div className="space-y-2 pb-1 border-b border-(--color-pos-borde-suave)">
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
          Motivo del reembolso *
          <input
            type="text"
            value={motivo}
            onChange={(e) => onMotivoChange?.(e.target.value)}
            placeholder="Ej. Cambio de talla / Producto defectuoso"
            className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-(--color-pagina)"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
          Observación (opcional)
          <textarea
            rows={2}
            value={observacion}
            onChange={(e) => onObservacionChange?.(e.target.value)}
            placeholder="Comentario del caso..."
            className="w-full resize-none rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-(--color-pagina)"
          />
        </label>
      </div>

      <ReembolsoLineaResumen item={item} />

      {mostrarCantidad && (
        <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
          Cantidad a reembolsar
          <input
            type="number"
            min={0}
            max={item.maxCantidad}
            step={1}
            value={item.cantidad || ""}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onCantidadChange?.(0);
                return;
              }
              const n = Math.floor(Number(raw));
              if (!Number.isFinite(n)) return;
              onCantidadChange?.(Math.max(0, Math.min(item.maxCantidad, n)));
            }}
            className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-(--color-pagina)"
          />
          <span className="font-normal">Máximo {item.maxCantidad}</span>
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-[11px] cursor-pointer">
          <input
            type="checkbox"
            checked={!!item.productoRecibido}
            onChange={(e) =>
              onActualizar(item.id, { productoRecibido: e.target.checked })
            }
          />
          Producto recibido
        </label>
        <label
          className={cn(
            "flex items-center gap-2 text-[11px]",
            puedeInventario ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="checkbox"
            checked={!!item.regresaInventario}
            disabled={!puedeInventario}
            onChange={(e) =>
              onActualizar(item.id, { regresaInventario: e.target.checked })
            }
          />
          Regresa a inventario
        </label>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <EstadoBadge activo={!!item.productoRecibido} label="Recibido" />
        <EstadoBadge activo={!!item.regresaInventario} label="A inventario" />
        {item.regresaInventario && (
          <span className="text-(--color-pos-texto-muted)">Ubicación: ID 1 (automática)</span>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-(--color-pagina)">
          Penalización (opcional)
        </summary>
        <div className="mt-2 space-y-2">
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
            Monto (Q)
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.montoPenalizacion ?? 0}
              onChange={(e) =>
                onActualizar(item.id, {
                  montoPenalizacion: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-(--color-pos-texto-muted)">
            Motivo (si hay monto)
            <input
              type="text"
              value={item.motivoPenalizacion ?? ""}
              onChange={(e) =>
                onActualizar(item.id, { motivoPenalizacion: e.target.value })
              }
              className="w-full rounded-md border border-(--color-pos-borde-suave) bg-(--color-pos-panel) px-2 py-1.5 text-xs"
            />
          </label>
        </div>
      </details>
    </div>
  );
}

function EstadoBadge({ activo, label }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-semibold border",
        activo
          ? "border-(--color-pagina) bg-(--color-pos-accent-suave) text-(--color-pagina)"
          : "border-(--color-pos-borde-suave) text-(--color-pos-texto-muted)"
      )}
    >
      {label}: {activo ? "Sí" : "No"}
    </span>
  );
}
