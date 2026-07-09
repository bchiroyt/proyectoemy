import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";

const COLORES = [
  "#c45c7a",
  "#059669",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#64748b",
  "#0d9488",
  "#ea580c",
];

const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

function truncLabel(text, max = 22) {
  const s = String(text || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Ranking + gráfica de productos más vendidos (datos del backend).
 */
export default function ProductosMasVendidosPanel({
  items = [],
  resumen,
  isLoading,
  isError,
  error,
  agruparPor = "variante",
  onAgruparPorChange,
  orden = "cantidad",
  onOrdenChange,
  top = 20,
  onTopChange,
  metricaGrafica = "cantidad",
  className,
}) {
  const chartData = items.slice(0, 10).map((row) => ({
    name: truncLabel(row.etiqueta),
    fullName: row.etiqueta,
    cantidad: row.cantidadVendida,
    monto: row.montoVendido,
    value: metricaGrafica === "monto" ? row.montoVendido : row.cantidadVendida,
  }));

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Productos más vendidos
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Ranking agregado por el servidor
            {resumen?.productosDistintos != null
              ? ` · ${Number(resumen.productosDistintos).toLocaleString("es-GT")} distintos en el período`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-(--color-gris-letra)">Agrupar</label>
            <select
              value={agruparPor}
              onChange={(e) => onAgruparPorChange?.(e.target.value)}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm"
            >
              <option value="variante">Por variante</option>
              <option value="producto">Por producto</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-(--color-gris-letra)">Orden</label>
            <select
              value={orden}
              onChange={(e) => onOrdenChange?.(e.target.value)}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm"
            >
              <option value="cantidad">Más unidades</option>
              <option value="monto">Más monto</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-(--color-gris-letra)">Top</label>
            <select
              value={String(top)}
              onChange={(e) => onTopChange?.(Number(e.target.value))}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, "No se pudo cargar el ranking de productos.")}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
              <p className="text-sm font-bold text-(--color-texto-principal)">
                Top 10 ({orden === "monto" ? "monto" : "unidades"})
              </p>
            </div>
            <div className="p-4 h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-(--color-gris-letra)">
                  No hay productos vendidos en el período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) =>
                        orden === "monto" && v >= 1000
                          ? `${(v / 1000).toFixed(0)}k`
                          : String(v)
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0]?.payload;
                        return (
                          <div className="rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 py-2 text-xs shadow-md max-w-[240px]">
                            <p className="font-semibold text-(--color-texto-principal)">
                              {item?.fullName}
                            </p>
                            <p className="tabular-nums text-(--color-gris-letra)">
                              Unidades: {item?.cantidad}
                            </p>
                            <p className="tabular-nums text-(--color-gris-letra)">
                              Monto: {fmtQ(item?.monto)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" name="Valor" radius={[0, 6, 6, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORES[i % COLORES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={thClass}>#</TableHead>
                    <TableHead className={thClass}>Producto</TableHead>
                    <TableHead className={`${thClass} text-right`}>Unid.</TableHead>
                    <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    <TableHead className={`${thClass} text-right`}>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-(--color-gris-letra)"
                      >
                        Sin datos para el ranking.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => {
                      const pct =
                        orden === "monto"
                          ? row.porcentajeMonto
                          : row.porcentajeCantidad;
                      return (
                        <TableRow
                          key={`${row.idVariante ?? "p"}-${row.idProducto ?? "x"}-${row.posicion}`}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-bold tabular-nums text-(--color-gris-letra)">
                            {row.posicion}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm leading-snug">
                              {row.nombreProducto || row.etiqueta}
                            </div>
                            {agruparPor === "variante" && row.nombreVariante ? (
                              <div className="text-xs text-(--color-gris-letra)">
                                {row.nombreVariante}
                                {row.sku ? ` · ${row.sku}` : ""}
                              </div>
                            ) : row.sku ? (
                              <div className="text-xs text-(--color-gris-letra)">{row.sku}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidadVendida.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {fmtQ(row.montoVendido)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-(--color-gris-letra)">
                            {Number(pct || 0).toLocaleString("es-GT", {
                              maximumFractionDigits: 1,
                            })}
                            %
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
