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

const COLOR_MENUDEO = "#059669";
const COLOR_MAYOREO = "#c45c7a";
const COLOR_TOTAL = "#2563eb";

function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

function TooltipPie({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-(--color-texto-principal)">{item.name}</p>
      <p className="tabular-nums text-(--color-gris-letra)">{fmtQ(item.value)}</p>
      <p className="text-(--color-gris-letra)">
        {item.tickets} ticket{item.tickets === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/**
 * Gráficas del reporte de ventas: tipo (menudeo/mayoreo) y tendencia diaria.
 */
export default function VentasCharts({
  porTipo = [],
  porDia = [],
  tipoDistribucion = "circulo",
  onTipoDistribucionChange,
  className,
}) {
  const dataTipo = porTipo.map((t) => ({
    ...t,
    fill: t.key === "MAYOREO" ? COLOR_MAYOREO : COLOR_MENUDEO,
  }));

  const dataDia = porDia.map((d) => ({
    fecha: d.fecha,
    label: fmtFechaCorta(d.fecha),
    monto: d.monto,
    menudeo: d.menudeo,
    mayoreo: d.mayoreo,
    tickets: d.tickets,
  }));

  const hayTipo = dataTipo.length > 0;
  const hayDias = dataDia.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-(--color-texto-principal)">
              Menudeo vs mayoreo
            </h3>
            <p className="text-xs text-(--color-gris-letra) mt-0.5">
              Distribución del monto vendido por tipo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-(--color-gris-letra)">Tipo</label>
            <select
              value={tipoDistribucion}
              onChange={(e) => onTipoDistribucionChange?.(e.target.value)}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium"
            >
              <option value="circulo">Círculo</option>
              <option value="barras">Barras</option>
            </select>
          </div>
        </div>

        <div className="p-4 h-[300px] w-full">
          {!hayTipo ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay ventas para graficar.
            </div>
          ) : tipoDistribucion === "barras" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTipo} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
                        <p className="font-semibold">{item?.name}</p>
                        <p className="tabular-nums">{fmtQ(item?.value)}</p>
                        <p>{item?.tickets} tickets</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" name="Monto" radius={[6, 6, 0, 0]}>
                  {dataTipo.map((d) => (
                    <Cell key={d.key} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataTipo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {dataTipo.map((d) => (
                    <Cell key={d.key} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPie />} />
                <Legend />
              </PieChart>
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
            Monto total y desglose menudeo / mayoreo
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
                        <p className="tabular-nums">Total: {fmtQ(item?.monto)}</p>
                        <p className="tabular-nums text-emerald-700">
                          Menudeo: {fmtQ(item?.menudeo)}
                        </p>
                        <p className="tabular-nums text-(--color-pagina)">
                          Mayoreo: {fmtQ(item?.mayoreo)}
                        </p>
                        <p className="text-(--color-gris-letra)">
                          {item?.tickets} ticket{item?.tickets === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="monto"
                  name="Total"
                  stroke={COLOR_TOTAL}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="menudeo"
                  name="Menudeo"
                  stroke={COLOR_MENUDEO}
                  strokeWidth={1.75}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mayoreo"
                  name="Mayoreo"
                  stroke={COLOR_MAYOREO}
                  strokeWidth={1.75}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
