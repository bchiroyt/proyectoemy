import { useMemo, useState } from "react";
import { Award, Receipt, ShoppingBag, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRendimientoVentasQuery } from "@/hooks/queries/useReportesQueries";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";
import { fmtQ } from "@/lib/cajaMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  construirMetricasRendimiento,
  rangoFechasMesActual,
} from "@/lib/reportesMappers";
import SummaryCard from "./SummaryCard";
import RendimientoCharts from "./RendimientoCharts";

const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

function labelUsuario(u) {
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return nombre || u.username || u.email || `Usuario #${u.idUsuario}`;
}

const ReporteRendimientoPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [idUsuario, setIdUsuario] = useState("");
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [tipoCajero, setTipoCajero] = useState("barras");

  const usuariosQ = useUsuariosQuery({ page: 1, pageSize: 100 });
  const usuarios = usuariosQ.data?.items ?? [];

  const rendimientoQ = useRendimientoVentasQuery({
    idUsuario: idUsuario || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  });

  const metricas = useMemo(
    () => construirMetricasRendimiento(rendimientoQ.data?.items ?? []),
    [rendimientoQ.data?.items]
  );

  const totalApi = rendimientoQ.data?.totalCount ?? metricas.totalTickets;
  const truncated = Boolean(rendimientoQ.data?.truncated);
  const muestraParcial =
    truncated || (totalApi > 0 && metricas.totalTickets < totalApi);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-sm font-semibold text-(--color-gris-letra)">
            Cajero / Usuario
          </label>
          <select
            value={idUsuario}
            onChange={(e) => setIdUsuario(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[200px]"
          >
            <option value="">Todos los cajeros</option>
            {usuarios.map((u) => (
              <option key={u.idUsuario} value={u.idUsuario}>
                {labelUsuario(u)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm"
          />
        </div>
      </div>

      {muestraParcial && !rendimientoQ.isLoading && !rendimientoQ.isError ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Métricas calculadas con {metricas.totalTickets.toLocaleString("es-GT")} de{" "}
          {totalApi.toLocaleString("es-GT")} ventas del período (tope de muestra).
        </p>
      ) : null}

      {rendimientoQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : rendimientoQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            rendimientoQ.error,
            "No se pudo cargar el reporte de rendimiento."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Tickets vendidos"
              value={metricas.totalTickets.toLocaleString("es-GT")}
              icon={<Receipt className="size-4" />}
            />
            <SummaryCard
              title="Monto total"
              value={fmtQ(metricas.totalMonto)}
              accent="pagina2"
              icon={<ShoppingBag className="size-4" />}
            />
            <SummaryCard
              title="Ticket promedio"
              value={fmtQ(metricas.ticketPromedio)}
              icon={<Award className="size-4" />}
            />
            <SummaryCard
              title="Cajeros activos"
              value={metricas.cajerosActivos}
              accent="advertencia"
              icon={<Users className="size-4" />}
            />
          </div>

          {metricas.topCajero ? (
            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4)/40 px-4 py-3 text-sm">
              <span className="font-semibold text-(--color-texto-principal)">
                Mejor cajero del período:{" "}
              </span>
              <span className="text-(--color-gris-letra)">
                {metricas.topCajero.cajero} — {fmtQ(metricas.topCajero.monto)} (
                {metricas.topCajero.tickets} ticket
                {metricas.topCajero.tickets === 1 ? "" : "s"})
              </span>
            </div>
          ) : null}

          <RendimientoCharts
            porCajero={metricas.porCajero}
            porDia={metricas.porDia}
            tipoCajero={tipoCajero}
            onTipoCajeroChange={setTipoCajero}
          />

          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
              <h3 className="text-sm font-bold text-(--color-texto-principal)">
                Ranking por cajero
              </h3>
              <p className="text-xs text-(--color-gris-letra) mt-0.5">
                Ordenado por monto vendido
              </p>
            </div>
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={thClass}>#</TableHead>
                    <TableHead className={thClass}>Cajero</TableHead>
                    <TableHead className={`${thClass} text-right`}>Tickets</TableHead>
                    <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    <TableHead className={`${thClass} text-right`}>Ticket prom.</TableHead>
                    <TableHead className={`${thClass} text-right`}>% del total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas.porCajero.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-(--color-gris-letra)"
                      >
                        No hay ventas para este filtro y rango de fechas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    metricas.porCajero.map((row, idx) => {
                      const pct =
                        metricas.totalMonto > 0
                          ? Math.round((row.monto / metricas.totalMonto) * 1000) / 10
                          : 0;
                      return (
                        <TableRow
                          key={`${row.cajero}-${row.idUsuario ?? idx}`}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-bold tabular-nums text-(--color-gris-letra)">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{row.cajero}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.tickets}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {fmtQ(row.monto)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtQ(row.ticketPromedio)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-(--color-gris-letra)">
                            {pct}%
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReporteRendimientoPanel;
