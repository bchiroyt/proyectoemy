import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORES = {
  NORMAL: "#059669",
  ADVERTENCIA: "#d97706",
  CRITICO: "#dc2626",
  SIN_POLITICA: "#94a3b8",
};

const ETIQUETAS = {
  NORMAL: "Normal",
  ADVERTENCIA: "Advertencia",
  CRITICO: "Crítico",
  SIN_POLITICA: "Sin política",
};

function buildChartData(resumen) {
  if (!resumen) return [];
  return [
    { key: "NORMAL", name: ETIQUETAS.NORMAL, value: Number(resumen.normal ?? 0) },
    {
      key: "ADVERTENCIA",
      name: ETIQUETAS.ADVERTENCIA,
      value: Number(resumen.advertencia ?? 0),
    },
    { key: "CRITICO", name: ETIQUETAS.CRITICO, value: Number(resumen.critico ?? 0) },
    {
      key: "SIN_POLITICA",
      name: ETIQUETAS.SIN_POLITICA,
      value: Number(resumen.sinPolitica ?? 0),
    },
  ].filter((d) => Number(d.value) > 0);
}

function TooltipContenido({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-(--color-texto-principal)">{item.name}</p>
      <p className="tabular-nums text-(--color-gris-letra)">
        {item.value} variante{item.value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/**
 * Gráfica de niveles de stock (barras o pastel) para el reporte de inventario.
 */
export default function InventarioStockChart({
  resumen,
  tipo = "barras",
  onTipoChange,
  className,
}) {
  const data = useMemo(() => buildChartData(resumen), [resumen]);
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const hayDatos = total > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Distribución por nivel de stock
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Resumen visual de variantes según su estado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-(--color-gris-letra)">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => onTipoChange?.(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium"
          >
            <option value="barras">Barras</option>
            <option value="circulo">Círculo</option>
          </select>
        </div>
      </div>

      <div className="p-4 h-[300px] w-full">
        {!hayDatos ? (
          <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
            No hay datos para graficar con el filtro actual.
          </div>
        ) : tipo === "circulo" ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORES[entry.key] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip content={<TooltipContenido />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipContenido />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORES[entry.key] ?? "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
