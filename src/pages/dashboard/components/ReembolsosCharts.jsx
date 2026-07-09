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

const COLOR_MONTO = "#dc2626";
const COLORES_MOTIVO = [
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
 * Gráficas de reembolsos: tendencia diaria y distribución por motivo.
 */
export default function ReembolsosCharts({
  flujoDiario = [],
  porMotivo = [],
  className,
}) {
  const dataDia = flujoDiario.map((d) => ({
    ...d,
    label: fmtFechaCorta(d.fecha),
  }));

  const dataMotivo = porMotivo.map((t, i) => ({
    name: truncLabel(t.motivo),
    fullName: t.motivo,
    value: t.monto,
    cantidad: t.cantidad,
    fill: COLORES_MOTIVO[i % COLORES_MOTIVO.length],
  }));

  const hayDias = dataDia.length > 0;
  const hayMotivo = dataMotivo.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Tendencia diaria
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Monto y cantidad de reembolsos por día
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
                        <p className="tabular-nums text-red-600">
                          Monto: {fmtQ(item?.monto)}
                        </p>
                        <p className="text-(--color-gris-letra)">
                          {item?.cantidad} reembolso
                          {item?.cantidad === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="monto"
                  name="Monto"
                  stroke={COLOR_MONTO}
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
            Por motivo
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Distribución del monto según razón de devolución
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayMotivo ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay datos por motivo.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataMotivo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dataMotivo.map((d, i) => (
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
                        <p className="tabular-nums">Monto: {fmtQ(item?.value)}</p>
                        <p>
                          {item?.cantidad} reembolso
                          {item?.cantidad === 1 ? "" : "s"}
                        </p>
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

export function ReembolsosProductosChart({ porProducto = [], className }) {
  const data = porProducto.slice(0, 8).map((p) => ({
    name: truncLabel(p.etiqueta || p.productoNombre),
    fullName: p.etiqueta || p.productoNombre,
    unidades: p.unidadesDevueltas,
    monto: p.montoReembolsado,
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
          Top productos reembolsados
        </h3>
        <p className="text-xs text-(--color-gris-letra) mt-0.5">
          Por unidades devueltas en el período
        </p>
      </div>
      <div className="p-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
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
                    <p className="tabular-nums">Monto: {fmtQ(item?.monto)}</p>
                    <p>{item?.transacciones} transacciones</p>
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

export function ReembolsosCajerosChart({ porCajero = [], className }) {
  const data = porCajero.slice(0, 8).map((c) => ({
    name: truncLabel(c.cajeroNombre),
    fullName: c.cajeroNombre,
    monto: c.montoTotal,
    cantidad: c.cantidadReembolsos,
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
          Por cajero
        </h3>
        <p className="text-xs text-(--color-gris-letra) mt-0.5">
          Monto total reembolsado por usuario
        </p>
      </div>
      <div className="p-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload;
                return (
                  <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[220px]">
                    <p className="font-semibold">{item?.fullName}</p>
                    <p className="tabular-nums">Monto: {fmtQ(item?.monto)}</p>
                    <p>
                      {item?.cantidad} reembolso
                      {item?.cantidad === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="monto" name="Monto" fill="#dc2626" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
