import { useState } from "react";
import { Banknote, Package, Receipt, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Paginacion from "@/components/shared/Paginacion";
import DateRangeFilter from "./DateRangeFilter";
import SummaryCard from "./SummaryCard";
import ReembolsosCharts, {
  ReembolsosCajerosChart,
  ReembolsosProductosChart,
} from "./ReembolsosCharts";
import { useReporteReembolsosResumenPeriodoQuery } from "@/hooks/queries/useReportesQueries";
import { useReembolsosHistorialQuery } from "@/hooks/queries/useReembolsoQueries";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { rangoFechasMesActual } from "@/lib/reportesMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function labelUsuario(u) {
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return nombre || u.username || u.email || `Usuario #${u.idUsuario}`;
}

const ReporteReembolsosPanel = () => {
  const mes = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(mes.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(mes.fechaHasta);
  const [idUsuario, setIdUsuario] = useState("");
  const [criterio, setCriterio] = useState("");
  const [criterioDebounced, setCriterioDebounced] = useState("");
  const [page, setPage] = useState(1);

  const usuariosQ = useUsuariosQuery({ page: 1, pageSize: 100 });
  const usuarios = usuariosQ.data?.items ?? [];

  const resumenQ = useReporteReembolsosResumenPeriodoQuery({
    fechaDesde,
    fechaHasta,
    idUsuario: idUsuario || undefined,
  });

  const listQ = useReembolsosHistorialQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    idUsuario: idUsuario || undefined,
    criterio: criterioDebounced || undefined,
  });

  const resumen = resumenQ.data?.resumen;
  const flujoDiario = resumenQ.data?.flujoDiario ?? [];
  const porMotivo = resumenQ.data?.porMotivo ?? [];
  const porProducto = resumenQ.data?.porProducto ?? [];
  const porCajero = resumenQ.data?.porCajero ?? [];

  const items = listQ.data?.items ?? [];
  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setCriterioDebounced(String(criterio ?? "").trim());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
        <DateRangeFilter
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChange={handleFechas}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Cajero</label>
          <select
            value={idUsuario}
            onChange={(e) => {
              setIdUsuario(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[180px]"
          >
            <option value="">Todos</option>
            {(Array.isArray(usuarios) ? usuarios : []).map((u) => (
              <option key={u.idUsuario} value={u.idUsuario}>
                {labelUsuario(u)}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleBuscar} className="flex flex-col gap-1.5 min-w-[220px] flex-1">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Buscar</label>
          <div className="flex gap-2">
            <Input
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
              placeholder="Ticket, cajero o motivo…"
              className="h-9"
            />
            <button
              type="submit"
              className="h-9 shrink-0 rounded-lg bg-(--color-pagina) px-3 text-xs font-semibold text-white hover:opacity-90"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {resumenQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : resumenQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            resumenQ.error,
            "No se pudo cargar el resumen de reembolsos del período."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Reembolsos del período"
              value={(resumen?.totalReembolsos ?? 0).toLocaleString("es-GT")}
              icon={<RefreshCw className="size-4" />}
            />
            <SummaryCard
              title="Monto total devuelto"
              value={fmtQ(resumen?.montoTotal ?? 0)}
              accent="rojo"
              icon={<Banknote className="size-4" />}
            />
            <SummaryCard
              title="Unidades devueltas"
              value={(resumen?.unidadesDevueltas ?? 0).toLocaleString("es-GT")}
              icon={<Package className="size-4" />}
            />
            <SummaryCard
              title="Ticket promedio"
              value={fmtQ(resumen?.ticketPromedioReembolso ?? 0)}
              accent="advertencia"
              icon={<Receipt className="size-4" />}
            />
          </div>

          <ReembolsosCharts flujoDiario={flujoDiario} porMotivo={porMotivo} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ReembolsosProductosChart porProducto={porProducto} />
            <ReembolsosCajerosChart porCajero={porCajero} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Ranking por producto
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Top 10 variantes más reembolsadas
                </p>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>#</TableHead>
                      <TableHead className={thClass}>Producto</TableHead>
                      <TableHead className={`${thClass} text-right`}>Unid.</TableHead>
                      <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porProducto.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-(--color-gris-letra)"
                        >
                          Sin datos de productos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porProducto.map((row, idx) => (
                        <TableRow
                          key={row.idVariante ?? idx}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-bold tabular-nums text-(--color-gris-letra)">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm leading-snug">
                              {row.productoNombre}
                            </div>
                            <div className="text-xs text-(--color-gris-letra)">
                              {[row.varianteNombre, row.sku].filter(Boolean).join(" · ")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.unidadesDevueltas.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-(--color-rojo-obscuro)">
                            {fmtQ(row.montoReembolsado)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Por motivo
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Cantidad y monto acumulado por razón
                </p>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>Motivo</TableHead>
                      <TableHead className={`${thClass} text-right`}>Cant.</TableHead>
                      <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porMotivo.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-10 text-center text-(--color-gris-letra)"
                        >
                          Sin datos de motivos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porMotivo.map((row, idx) => (
                        <TableRow key={`${row.motivo}-${idx}`} className="hover:bg-(--color-pagina-4)/40">
                          <TableCell className="font-medium text-sm">{row.motivo}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidad.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums text-(--color-rojo-obscuro)">
                            {fmtQ(row.monto)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Historial de reembolsos
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Filtrado por fechas, cajero y criterio de búsqueda
          </p>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>Ticket origen</TableHead>
                <TableHead className={thClass}>No. Reembolso</TableHead>
                <TableHead className={thClass}>Cajero</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={`${thClass} text-right`}>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : listQ.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-red-700">
                    {getApiErrorMessage(listQ.error, "No se pudo cargar el historial.")}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-(--color-gris-letra)">
                    No hay reembolsos en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.idReembolso} className="hover:bg-(--color-pagina-4)/40">
                    <TableCell className="font-medium">{fmtFecha(row.fechaHora)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.numeroTicketOrigen || (row.idVenta ? `#${row.idVenta}` : "—")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.numeroTicket || `#R-${row.idReembolso}`}
                    </TableCell>
                    <TableCell>{row.usuarioNombre || "—"}</TableCell>
                    <TableCell>
                      {row.estado ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                          {row.estado}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-bold tabular-nums text-(--color-rojo-obscuro)"
                      )}
                    >
                      {fmtQ(Math.abs(Number(row.total) || 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end border-t border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <Paginacion
            from={from}
            to={to}
            total={totalRegistros}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            disablePrev={page <= 1}
            disableNext={page >= totalPages}
            isLoading={listQ.isFetching}
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteReembolsosPanel;
