import { useState, useEffect } from "react";
import { Minus, Plus, Lock, ArrowLeft, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
const denominaciones = [
  { valor: 200, label: "Q200" },
  { valor: 100, label: "Q100" },
  { valor: 50, label: "Q50" },
  { valor: 20, label: "Q20" },
  { valor: 10, label: "Q10" },
  { valor: 5, label: "Q5" },
];

function clampCantidad(n) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99999, Math.floor(n));
}

const AperturaCaja = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();

  useEffect(() => {
    setTitulo("POS · Control de apertura");
  }, [setTitulo]);

  const [cantidades, setCantidades] = useState(
    denominaciones.reduce((acc, d) => ({ ...acc, [d.valor]: 0 }), {})
  );

  const [monedas, setMonedas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fechaApertura, setFechaApertura] = useState(() => new Date());

  const monedasNum = monedas === "" ? 0 : Number(monedas);
  const monedasValid = Number.isFinite(monedasNum) ? Math.max(0, monedasNum) : 0;

  const setCantidad = (valor, raw) => {
    const digits = String(raw).replace(/\D/g, "");
    const n = digits === "" ? 0 : parseInt(digits, 10);
    setCantidades((prev) => ({
      ...prev,
      [valor]: clampCantidad(n),
    }));
  };

  const cambiarCantidad = (valor, delta) => {
    setCantidades((prev) => ({
      ...prev,
      [valor]: clampCantidad(prev[valor] + delta),
    }));
  };

  const totalBilletes = denominaciones.reduce(
    (acc, d) => acc + d.valor * cantidades[d.valor],
    0
  );

  const total = totalBilletes + monedasValid;

  const handleConfirmar = () => {
    // TODO: enviar apertura al backend (incl. fechaApertura)
    navigate("/pos/ventas");
  };

  const fechaFormateada = fechaApertura.toLocaleString("es-GT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-(--color-pagina-4) p-2 sm:p-3">
      <div
        data-barcode-listener="off"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg max-w-7xl mx-auto w-full"
      >
        {/* Cabecera + regresar (dentro del contenedor) */}
        <header className="shrink-0 flex flex-wrap items-start justify-between gap-2 border-b border-(--color-gris-claro-2) px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="min-w-0">
            <h2 className="text-[clamp(0.95rem,1.5vw,1.25rem)] font-bold text-(--color-negro) leading-tight">
              Conteo inicial
            </h2>
            <p className="text-[clamp(0.65rem,1.1vw,0.8rem)] text-(--color-gris-letra) mt-0.5 leading-snug">
              Ingresa el efectivo en caja para iniciar el turno.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/pos")}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1.5 text-[clamp(0.65rem,1vw,0.8rem)] font-semibold text-(--color-negro) hover:border-(--color-pagina) hover:text-(--color-pagina) transition-colors"
          >
            <ArrowLeft className="size-3.5 sm:size-4" />
            Regresar
          </button>
        </header>

        {/* Fecha / hora de apertura + Ahora */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4 bg-(--color-pagina-3)/60 border-b border-(--color-gris-claro-2)">
          <div className="min-w-0 text-[clamp(0.65rem,1.05vw,0.8rem)]">
            <span className="font-semibold text-(--color-gris-letra)">Fecha y hora de apertura: </span>
            <span className="font-bold text-(--color-negro) tabular-nums">{fechaFormateada}</span>
          </div>
          <button
            type="button"
            onClick={() => setFechaApertura(new Date())}
            className="shrink-0 rounded-lg bg-(--color-pagina) px-3 py-1 text-[clamp(0.65rem,1vw,0.75rem)] font-bold text-(--color-blanco) hover:opacity-90"
          >
            Ahora
          </button>
        </div>

        {/* Cuerpo: billetes y monedas a la par; abajo observaciones + resumen */}
        <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 sm:p-3 lg:p-4">
          <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-3">
            {/* Billetes */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
              <p className="shrink-0 text-(--color-pagina) font-bold text-[clamp(0.6rem,1vw,0.7rem)] tracking-wide">
                BILLETES (QUETZALES)
              </p>
              <div className="min-h-0 grid grid-cols-2 xl:grid-cols-3 gap-1.5 sm:gap-2">
                {denominaciones.map((d) => (
                  <div
                    key={d.valor}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-pink-100 bg-pink-50/90 px-1.5 py-1.5 sm:px-2 sm:py-2"
                  >
                    <Banknote
                      className="size-[clamp(1.1rem,2.2vw,1.5rem)] shrink-0 text-(--color-pagina-2)"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-(--color-negro) text-[clamp(0.75rem,1.4vw,0.95rem)] leading-none">
                        {d.label}
                      </p>
                      <p className="text-[clamp(0.6rem,1vw,0.7rem)] text-(--color-gris-letra) tabular-nums mt-0.5">
                        Total: Q{(d.valor * cantidades[d.valor]).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(d.valor, -1)}
                        className="rounded-md bg-(--color-gris-claro-2) p-1 sm:p-1.5 text-(--color-negro) hover:bg-gray-300"
                        aria-label={`Menos billetes de ${d.label}`}
                      >
                        <Minus className="size-3 sm:size-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-label={`Cantidad de billetes ${d.label}`}
                        value={cantidades[d.valor] === 0 ? "" : String(cantidades[d.valor])}
                        placeholder="0"
                        onChange={(e) => setCantidad(d.valor, e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value.replace(/\D/g, "") === "") {
                            setCantidad(d.valor, "0");
                          }
                        }}
                        className="w-[clamp(2rem,5vw,2.75rem)] rounded-md border border-gray-300 bg-(--color-blanco) py-0.5 text-center text-[clamp(0.75rem,1.3vw,0.9rem)] font-bold tabular-nums text-(--color-negro) focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
                      />
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(d.valor, 1)}
                        className="rounded-md bg-(--color-pagina) p-1 sm:p-1.5 text-(--color-blanco) hover:opacity-90"
                        aria-label={`Más billetes de ${d.label}`}
                      >
                        <Plus className="size-3 sm:size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monedas al lado (debajo en móvil) */}
            <div className="flex shrink-0 flex-col justify-start rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-3)/50 p-2 sm:p-3 lg:w-44 xl:w-52">
              <p className="text-center text-[clamp(0.7rem,1.1vw,0.8rem)] font-bold text-(--color-negro)">
                Monedas
              </p>
              <p className="mt-0.5 text-center text-[clamp(0.6rem,0.95vw,0.7rem)] text-(--color-gris-letra)">
                Monto en quetzales
              </p>
              <div className="mt-2 flex flex-1 items-center justify-center lg:mt-3">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={monedas}
                  onChange={(e) => setMonedas(e.target.value)}
                  className="w-full max-w-40 rounded-lg border border-gray-300 bg-(--color-blanco) px-2 py-2 text-center text-[clamp(0.85rem,1.5vw,1.05rem)] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40 lg:max-w-none"
                />
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 min-h-0 lg:grid-cols-12 lg:gap-3">
            <div className="flex min-h-0 flex-col lg:col-span-7">
              <h3 className="shrink-0 text-[clamp(0.7rem,1.1vw,0.8rem)] font-bold text-(--color-negro) mb-1">
                Observaciones
              </h3>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Nota opcional…"
                rows={2}
                className="min-h-13 flex-1 resize-none rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) p-2 text-[clamp(0.7rem,1.1vw,0.8rem)] text-(--color-negro) placeholder:text-(--color-gris-claro) focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40 lg:min-h-0"
              />
            </div>

            <div className="flex min-h-0 flex-col rounded-xl bg-(--color-pagina) p-2 sm:p-3 text-(--color-blanco) shadow-md lg:col-span-5">
              <p className="text-[clamp(0.75rem,1.2vw,0.9rem)] font-semibold">Balance total apertura</p>
              <p className="text-[clamp(1.25rem,3vw,1.75rem)] font-bold tabular-nums leading-tight">
                Q {total.toFixed(2)}
              </p>
              <div className="mt-1 space-y-0.5 text-[clamp(0.65rem,1vw,0.75rem)] opacity-95">
                <p>Billetes: Q{totalBilletes.toFixed(2)}</p>
                <p>Monedas: Q{monedasValid.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={handleConfirmar}
                className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-(--color-blanco) py-2 text-[clamp(0.75rem,1.1vw,0.85rem)] font-bold text-(--color-pagina) hover:bg-gray-100"
              >
                <Lock className="size-4 shrink-0" />
                Confirmar apertura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AperturaCaja;
