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

const COLOR_MONTO = "#c45c7a";
const COLORES_ESTADO = {
  CERRADA: "#059669",
  EN_PROCESO: "#d97706",
  ANULADA: "#94a3b8",
};
const COLORES_FALLBACK = ["#c45c7a", "#2563eb", "#7c3aed", "#0891b2", "#dc2626"];

function fmtFechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short" });
}

function colorEstado(estado) {
  const key = String(estado || "").toUpperCase();
  return COLORES_ESTADO[key] ?? COLORES_FALLBACK[0];
}

/**
 * Gráficas del reporte de compras: tendencia diaria y distribución por estado.
 */
export default function ComprasCharts({
  flujoDiario = [],
  porEstado = [],
  className,
}) {
  const dataDia = flujoDiario.map((d) => ({
    ...d,
    label: fmtFechaCorta(d.fecha),
  }));

  const dataEstado = porEstado.map((e) => ({
    name: e.estadoLabel || e.estadoCompra,
    value: e.montoTotal,
    cantidad: e.cantidadCompras,
    fill: colorEstado(e.estadoCompra),
  }));

  const hayDias = dataDia.length > 0;
  const hayEstado = dataEstado.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Tendencia de compras
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Monto diario del período
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
                        <p className="tabular-nums">Monto: {fmtQ(item?.monto)}</p>
                        <p className="text-(--color-gris-letra)">
                          {item?.cantidad} compra{item?.cantidad === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="monto"
                  name="Monto"
                  stroke={COLOR_MONTO}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLOR_MONTO }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Distribución por estado
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Monto acumulado según estado de compra
          </p>
        </div>
        <div className="p-4 h-[280px] w-full">
          {!hayEstado ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              No hay datos por estado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEstado}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {dataEstado.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{item?.name}</p>
                        <p className="tabular-nums">{fmtQ(item?.value)}</p>
                        <p>{item?.cantidad} compras</p>
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

/** Barras horizontales top proveedores (opcional, usado en panel). */
export function ComprasProveedorChart({ porProveedor = [], className }) {
  const data = porProveedor.slice(0, 8).map((p) => ({
    name:
      p.proveedorNombre.length > 18
        ? `${p.proveedorNombre.slice(0, 16)}…`
        : p.proveedorNombre,
    fullName: p.proveedorNombre,
    monto: p.montoTotal,
    cantidad: p.cantidadCompras,
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
          Top proveedores
        </h3>
        <p className="text-xs text-(--color-gris-letra) mt-0.5">
          Por monto comprado en el período
        </p>
      </div>
      <div className="p-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload;
                return (
                  <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold">{item?.fullName}</p>
                    <p className="tabular-nums">{fmtQ(item?.monto)}</p>
                    <p>{item?.cantidad} compras</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="monto" name="Monto" fill={COLOR_MONTO} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
