import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmtQ } from "@/lib/cajaMappers";

const COLOR_ENTRADAS = "#059669";
const COLOR_SALIDAS = "#dc2626";
const COLOR_BALANCE = "#2563eb";

function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

/**
 * Flujo diario de caja: entradas, salidas y balance neto.
 */
export default function CajaFlujoCharts({ flujoDiario = [], className }) {
  const data = flujoDiario.map((d) => ({
    ...d,
    label: fmtFechaCorta(d.fecha),
  }));
  const hayDatos = data.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Entradas vs salidas
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Flujo diario del período
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayDatos ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay flujo diario para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{item?.fecha}</p>
                        <p className="tabular-nums text-emerald-700">
                          Entradas: {fmtQ(item?.totalEntradas)}
                        </p>
                        <p className="tabular-nums text-red-600">
                          Salidas: {fmtQ(item?.totalSalidas)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalEntradas"
                  name="Entradas"
                  fill={COLOR_ENTRADAS}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="totalSalidas"
                  name="Salidas"
                  fill={COLOR_SALIDAS}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Balance neto diario
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Entradas − salidas por día
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayDatos ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay balance diario para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{item?.fecha}</p>
                        <p className="tabular-nums">Balance: {fmtQ(item?.balanceNeto)}</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balanceNeto"
                  name="Balance"
                  stroke={COLOR_BALANCE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLOR_BALANCE }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
