import { Minus, Plus, Banknote, Coins } from "lucide-react";
import { calcularTotalArqueo, fmtQ } from "@/lib/cajaMappers";
import { parseMontoMonedas } from "@/lib/cajaUtils";
import { cn } from "@/lib/utils";

function clampCantidad(n) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99999, Math.floor(n));
}

function FilaDenominacion({ denominacion, cantidad, onChange }) {
  const subtotal = denominacion.valor * cantidad;
  const esMoneda = denominacion.tipo?.includes("MONEDA");

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2 py-2 sm:px-3",
        esMoneda
          ? "border-(--color-gris-claro-2) bg-(--color-pagina-3)/50"
          : "border-pink-100 bg-pink-50/90"
      )}
    >
      {esMoneda ? (
        <Coins className="size-5 shrink-0 text-(--color-pagina-2)" />
      ) : (
        <Banknote className="size-5 shrink-0 text-(--color-pagina-2)" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold text-(--color-negro) text-sm leading-none">{denominacion.nombre}</p>
        <p className="text-xs text-(--color-gris-letra) tabular-nums mt-0.5">
          Total: {fmtQ(subtotal)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clampCantidad(cantidad - 1))}
          className="rounded-md bg-(--color-gris-claro-2) p-1.5 text-(--color-negro) hover:bg-gray-300"
          aria-label={`Menos ${denominacion.nombre}`}
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={cantidad === 0 ? "" : String(cantidad)}
          placeholder="0"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits === "" ? 0 : clampCantidad(parseInt(digits, 10)));
          }}
          className="w-11 rounded-md border border-gray-300 bg-(--color-blanco) py-0.5 text-center text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
        />
        <button
          type="button"
          onClick={() => onChange(clampCantidad(cantidad + 1))}
          className="rounded-md bg-(--color-pagina) p-1.5 text-(--color-blanco) hover:opacity-90"
          aria-label={`Más ${denominacion.nombre}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ConteoDenominaciones({
  denominaciones = [],
  cantidades,
  onCantidadesChange,
  monedasModo = "detalle",
  totalMonedas = "",
  onTotalMonedasChange,
  observacion = "",
  onObservacionChange,
  showObservacion = true,
  observacionRequired = false,
  observacionHint,
  resumenExtra,
  className = "",
}) {
  const billetes = denominaciones.filter((d) => !d.tipo?.includes("MONEDA"));
  const monedas = denominaciones.filter((d) => d.tipo?.includes("MONEDA"));
  const usaMonedasTotal = monedasModo === "total";

  const setCantidad = (id, qty) => {
    onCantidadesChange({ ...cantidades, [id]: qty });
  };

  const totalBilletes = calcularTotalArqueo(cantidades, billetes.length ? billetes : []);
  const totalMonedasDetalle = calcularTotalArqueo(cantidades, monedas.length ? monedas : []);
  const totalMonedasValor = usaMonedasTotal ? parseMontoMonedas(totalMonedas) || 0 : totalMonedasDetalle;
  const total = totalBilletes + (Number.isFinite(totalMonedasValor) ? totalMonedasValor : 0);

  if (!denominaciones.length && !usaMonedasTotal) {
    return (
      <p className="text-sm text-(--color-gris-letra) py-6 text-center">
        No hay denominaciones activas configuradas en el sistema.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 min-h-0", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {billetes.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <p className="text-(--color-pagina) font-bold text-xs tracking-wide">BILLETES</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {billetes.map((d) => (
                <FilaDenominacion
                  key={d.idDenominacion}
                  denominacion={d}
                  cantidad={cantidades[d.idDenominacion] ?? 0}
                  onChange={(qty) => setCantidad(d.idDenominacion, qty)}
                />
              ))}
            </div>
          </div>
        )}
        {(usaMonedasTotal || monedas.length > 0) && (
          <div className="flex flex-col gap-1.5 lg:w-56 xl:w-64 shrink-0">
            <p className="text-(--color-pagina) font-bold text-xs tracking-wide">MONEDAS</p>
            {usaMonedasTotal ? (
              <div className="flex flex-col gap-2 rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-3)/50 p-3">
                <div className="flex items-center gap-2">
                  <Coins className="size-5 shrink-0 text-(--color-pagina-2)" />
                  <p className="text-sm font-semibold text-(--color-negro)">Monto total en monedas</p>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={totalMonedas}
                  onChange={(e) => onTotalMonedasChange?.(e.target.value.replace(/[^\d.,]/g, ""))}
                  className="w-full rounded-lg border border-gray-300 bg-(--color-blanco) px-3 py-2 text-right text-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
                />
                <p className="text-xs text-(--color-gris-letra)">
                  Total acumulado de monedas (no por denominación).
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-3)/50 p-2">
                {monedas.map((d) => (
                  <FilaDenominacion
                    key={d.idDenominacion}
                    denominacion={d}
                    cantidad={cantidades[d.idDenominacion] ?? 0}
                    onChange={(qty) => setCantidad(d.idDenominacion, qty)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {showObservacion && (
          <div className="lg:col-span-7">
            <label className="text-sm font-bold text-(--color-negro)">
              Observaciones
              {observacionRequired && <span className="text-(--color-rojo)"> *</span>}
            </label>
            {observacionHint && (
              <p className="text-xs text-(--color-gris-letra) mt-0.5">{observacionHint}</p>
            )}
            <textarea
              value={observacion}
              onChange={(e) => onObservacionChange?.(e.target.value)}
              placeholder="Nota opcional…"
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) p-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
            />
          </div>
        )}
        <div
          className={cn(
            "rounded-xl bg-(--color-pagina) p-4 text-(--color-blanco) shadow-md flex flex-col",
            showObservacion ? "lg:col-span-5" : "lg:col-span-12"
          )}
        >
          <p className="text-sm font-semibold">Total contado</p>
          <p className="text-2xl font-bold tabular-nums">{fmtQ(total)}</p>
          <div className="mt-1 space-y-0.5 text-xs opacity-95">
            {billetes.length > 0 && <p>Billetes: {fmtQ(totalBilletes)}</p>}
            {(usaMonedasTotal || monedas.length > 0) && (
              <p>Monedas: {fmtQ(Number.isFinite(totalMonedasValor) ? totalMonedasValor : 0)}</p>
            )}
          </div>
          {resumenExtra}
        </div>
      </div>
    </div>
  );
}
