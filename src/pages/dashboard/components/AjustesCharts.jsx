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

const COLOR_ENTRADA = "#059669";
const COLOR_SALIDA = "#dc2626";
const COLORES_TIPO = [
  "#c45c7a",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#64748b",
];

function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

function truncLabel(text, max = 18) {
  const s = String(text || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Gráficas de ajustes/mermas: tendencia diaria y distribución por tipo.
 */
export default function AjustesCharts({
  flujoDiario = [],
  porTipo = [],
  className,
}) {
  const dataDia = flujoDiario.map((d) => ({
    ...d,
    label: fmtFechaCorta(d.fecha),
  }));

  const dataTipo = porTipo.map((t, i) => ({
    name: truncLabel(t.tipoAjusteNombre),
    fullName: t.tipoAjusteNombre,
    value: t.unidades,
    costo: t.costo,
    cantidad: t.cantidad,
    naturaleza: t.naturaleza,
    fill: COLORES_TIPO[i % COLORES_TIPO.length],
  }));

  const hayDias = dataDia.length > 0;
  const hayTipo = dataTipo.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Tendencia diaria
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Unidades de entrada vs salida / merma
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayDias ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay flujo diario para graficar.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataDia} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{item?.fecha}</p>
                        <p className="tabular-nums text-emerald-700">
                          Entrada: {item?.unidadesEntrada}
                        </p>
                        <p className="tabular-nums text-red-600">
                          Salida: {item?.unidadesSalida}
                        </p>
                        <p className="text-(--color-gris-letra)">
                          {item?.cantidadAjustes} ajuste
                          {item?.cantidadAjustes === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="unidadesEntrada"
                  name="Entrada"
                  stroke={COLOR_ENTRADA}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="unidadesSalida"
                  name="Salida"
                  stroke={COLOR_SALIDA}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Por tipo de ajuste
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Unidades según motivo (merma, corrección, etc.)
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayTipo ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay datos por tipo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataTipo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dataTipo.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[220px]">
                        <p className="font-semibold">{item?.fullName}</p>
                        <p className="text-(--color-gris-letra)">{item?.naturaleza}</p>
                        <p className="tabular-nums">Unidades: {item?.value}</p>
                        <p className="tabular-nums">Costo: {fmtQ(item?.costo)}</p>
                        <p>{item?.cantidad} ajustes</p>
                      </div>
                    );
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export function AjustesProductosChart({ porProducto = [], className }) {
  const data = porProducto.slice(0, 8).map((p) => ({
    name: truncLabel(p.etiqueta || p.productoNombre),
    fullName: p.etiqueta || p.productoNombre,
    unidades: p.unidadesAjustadas,
    costo: p.costoCargado,
    transacciones: p.cantidadTransacciones,
  }));

  if (!data.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
        <h3 className="text-sm font-bold text-(--color-texto-principal)">
          Top productos ajustados
        </h3>
        <p className="text-xs text-(--color-gris-letra) mt-0.5">
          Por unidades modificadas en el período
        </p>
      </div>
      <div className="p-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload;
                return (
                  <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[240px]">
                    <p className="font-semibold">{item?.fullName}</p>
                    <p className="tabular-nums">Unidades: {item?.unidades}</p>
                    <p className="tabular-nums">Costo: {fmtQ(item?.costo)}</p>
                    <p>{item?.transacciones} líneas</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="unidades" name="Unidades" fill="#c45c7a" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
