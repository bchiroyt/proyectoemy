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

const COLORES = [
  "#c45c7a",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#64748b",
  "#ea580c",
];

function truncLabel(text, max = 16) {
  const s = String(text || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Etiquetas de rango del API suelen venir con "$"; mostrar quetzales. */
function etiquetaRangoQ(rango) {
  return String(rango || "").replace(/\$/g, "Q");
}

function fmtPct(valor) {
  const n = Number(valor) || 0;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${pct.toLocaleString("es-GT", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
}

/**
 * Gráficas de catálogo: por categoría, por marca e histograma de precios.
 */
export default function CatalogoCharts({
  porCategoria = [],
  porMarca = [],
  rangosPrecio = [],
  className,
}) {
  const dataCat = porCategoria.slice(0, 8).map((c, i) => ({
    name: truncLabel(c.categoriaNombre),
    fullName: c.categoriaNombre,
    value: c.cantidad,
    porcentaje: c.porcentaje,
    fill: COLORES[i % COLORES.length],
  }));

  const dataMarca = porMarca.slice(0, 8).map((m, i) => ({
    name: truncLabel(m.marcaNombre),
    fullName: m.marcaNombre,
    value: m.cantidad,
    porcentaje: m.porcentaje,
    fill: COLORES[i % COLORES.length],
  }));

  const dataRango = rangosPrecio.map((r) => {
    const rango = etiquetaRangoQ(r.rango);
    return {
      name: truncLabel(rango, 14),
      fullName: rango,
      cantidad: r.cantidad,
      porcentaje: r.porcentaje,
    };
  });

  const hayCat = dataCat.length > 0;
  const hayMarca = dataMarca.length > 0;
  const hayRango = dataRango.length > 0;

  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Por categoría
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Variantes según categoría
          </p>
        </div>
        <div className="p-4 h-[260px] w-full">
          {!hayCat ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              Sin datos por categoría.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCat}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {dataCat.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[200px]">
                        <p className="font-semibold">{item?.fullName}</p>
                        <p className="tabular-nums">{item?.value} variantes</p>
                        <p>{fmtPct(item?.porcentaje)}</p>
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

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Por marca
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Variantes según marca
          </p>
        </div>
        <div className="p-4 h-[260px] w-full">
          {!hayMarca ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              Sin datos por marca.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataMarca}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {dataMarca.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[200px]">
                        <p className="font-semibold">{item?.fullName}</p>
                        <p className="tabular-nums">{item?.value} variantes</p>
                        <p>{fmtPct(item?.porcentaje)}</p>
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

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Rangos de precio
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Histograma de precios menudeo
          </p>
        </div>
        <div className="p-4 h-[260px] w-full">
          {!hayRango ? (
            <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
              Sin datos de rangos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRango} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{item?.fullName}</p>
                        <p className="tabular-nums">{item?.cantidad} variantes</p>
                        <p>{fmtPct(item?.porcentaje)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="cantidad" name="Variantes" fill="#c45c7a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
