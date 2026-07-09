import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { fmtQ } from "@/lib/cajaMappers";

const COLORES_CAJERO = [
  "#c45c7a",
  "#059669",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#64748b",
];

function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

function TooltipMonto({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-(--color-texto-principal)">{label ?? item?.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tabular-nums text-(--color-gris-letra)">
          {p.name}: {p.dataKey === "tickets" ? p.value : fmtQ(p.value)}
        </p>
      ))}
    </div>
  );
}

function TooltipPie({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-(--color-texto-principal)">{item.name}</p>
      <p className="tabular-nums text-(--color-gris-letra)">{fmtQ(item.value)}</p>
      <p className="text-(--color-gris-letra)">{item.tickets} ticket{item.tickets === 1 ? "" : "s"}</p>
    </div>
  );
}

/**
 * Gráficas de rendimiento: ventas por cajero y tendencia diaria.
 */
export default function RendimientoCharts({
  porCajero = [],
  porDia = [],
  tipoCajero = "barras",
  onTipoCajeroChange,
  className,
}) {
  const dataCajero = porCajero.map((c) => ({
    name: c.cajero.length > 18 ? `${c.cajero.slice(0, 16)}…` : c.cajero,
    fullName: c.cajero,
    value: c.monto,
    tickets: c.tickets,
  }));

  const dataDia = porDia.map((d) => ({
    fecha: d.fecha,
    label: fmtFechaCorta(d.fecha),
    monto: d.monto,
    tickets: d.tickets,
  }));

  const hayCajeros = dataCajero.length > 0;
  const hayDias = dataDia.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-(--color-texto-principal)">
              Ventas por cajero
            </h3>
            <p className="text-xs text-(--color-gris-letra) mt-0.5">
              Monto total vendido en el período
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-(--color-gris-letra)">Tipo</label>
            <select
              value={tipoCajero}
              onChange={(e) => onTipoCajeroChange?.(e.target.value)}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium"
            >
              <option value="barras">Barras</option>
              <option value="circulo">Círculo</option>
            </select>
          </div>
        </div>

        <div className="p-4 h-[300px] w-full">
          {!hayCajeros ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay ventas para graficar.
            </div>
          ) : tipoCajero === "circulo" ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCajero}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {dataCajero.map((_, i) => (
                    <Cell key={i} fill={COLORES_CAJERO[i % COLORES_CAJERO.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPie />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCajero} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip content={<TooltipMonto />} />
                <Bar dataKey="value" name="Monto" radius={[6, 6, 0, 0]}>
                  {dataCajero.map((_, i) => (
                    <Cell key={i} fill={COLORES_CAJERO[i % COLORES_CAJERO.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Tendencia diaria
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Monto vendido por día en el rango seleccionado
          </p>
        </div>

        <div className="p-4 h-[300px] w-full">
          {!hayDias ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay datos diarios para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataDia} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
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
                        <p className="font-semibold text-(--color-texto-principal)">
                          {item?.fecha}
                        </p>
                        <p className="tabular-nums text-(--color-gris-letra)">
                          Monto: {fmtQ(item?.monto)}
                        </p>
                        <p className="text-(--color-gris-letra)">
                          {item?.tickets} ticket{item?.tickets === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="monto"
                  name="Monto"
                  stroke="#c45c7a"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#c45c7a" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
