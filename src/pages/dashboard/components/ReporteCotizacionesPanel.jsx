import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Percent,
  Wallet,
} from "lucide-react";
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
import CotizacionesCharts, {
  CotizacionesClientesChart,
  CotizacionesProductosChart,
} from "./CotizacionesCharts";
import { useReporteCotizacionesResumenPeriodoQuery } from "@/hooks/queries/useReportesQueries";
import { useCotizacionesHistorialQuery } from "@/hooks/queries/useCotizacionQueries";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { etiquetaEstadoCotizacion } from "@/lib/cotizacionMappers";
import { rangoFechasMesActual } from "@/lib/reportesMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE", label: "Cotización" },
  { value: "CONVERTIDA", label: "Finalizada" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "ANULADA", label: "Anulada" },
];

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const estadoBadgeClass = (estado) => {
  const e = String(estado ?? "").trim().toUpperCase();
  if (e === "VENCIDA" || e === "EXPIRADA") return "bg-red-50 text-red-700 border-red-100";
  if (e === "PENDIENTE") return "bg-amber-50 text-amber-800 border-amber-100";
  if (e === "CONVERTIDA" || e === "CERRADA") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (e === "ANULADA") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

function labelUsuario(u) {
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return nombre || u.username || u.email || `Usuario #${u.idUsuario}`;
}

function fmtTasa(valor) {
  const n = Number(valor) || 0;
  // Backend puede devolver 0–1 o 0–100
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${pct.toLocaleString("es-GT", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
}

const ReporteCotizacionesPanel = () => {
  const mes = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(mes.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(mes.fechaHasta);
  const [estado, setEstado] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [criterio, setCriterio] = useState("");
  const [criterioDebounced, setCriterioDebounced] = useState("");
  const [page, setPage] = useState(1);

  const usuariosQ = useUsuariosQuery({ page: 1, pageSize: 100 });
  const usuarios = usuariosQ.data?.items ?? [];

  const resumenQ = useReporteCotizacionesResumenPeriodoQuery({
    fechaDesde,
    fechaHasta,
    estado: estado || undefined,
    idUsuario: idUsuario || undefined,
  });

  const listQ = useCotizacionesHistorialQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    estado: estado || undefined,
    criterio: criterioDebounced || undefined,
  });

  const resumen = resumenQ.data?.resumen;
  const flujoDiario = resumenQ.data?.flujoDiario ?? [];
  const porEstado = resumenQ.data?.porEstado ?? [];
  const porCliente = resumenQ.data?.porCliente ?? [];
  const porProducto = resumenQ.data?.porProducto ?? [];

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
          <label className="text-sm font-semibold text-(--color-gris-letra)">Estado</label>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[160px]"
          >
            {ESTADOS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Vendedor</label>
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
              placeholder="Cliente o vendedor…"
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
            "No se pudo cargar el resumen de cotizaciones del período."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Cotizaciones del período"
              value={(resumen?.totalCotizaciones ?? 0).toLocaleString("es-GT")}
              icon={<ClipboardList className="size-4" />}
            />
            <SummaryCard
              title="Monto total cotizado"
              value={fmtQ(resumen?.montoTotal ?? 0)}
              icon={<Wallet className="size-4" />}
            />
            <SummaryCard
              title="Tasa de conversión"
              value={fmtTasa(resumen?.tasaConversion)}
              accent="pagina2"
              icon={<Percent className="size-4" />}
            />
            <SummaryCard
              title="Convertidas"
              value={(resumen?.convertidas ?? 0).toLocaleString("es-GT")}
              accent="pagina2"
              icon={<CheckCircle2 className="size-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Monto convertido"
              value={fmtQ(resumen?.montoConvertido ?? 0)}
              accent="pagina2"
              icon={<CheckCircle2 className="size-4" />}
            />
            <SummaryCard
              title="Monto pendiente"
              value={fmtQ(resumen?.montoPendiente ?? 0)}
              accent="advertencia"
              icon={<Hourglass className="size-4" />}
            />
            <SummaryCard
              title="Pendientes"
              value={(resumen?.pendientes ?? 0).toLocaleString("es-GT")}
              accent="advertencia"
              icon={<Hourglass className="size-4" />}
            />
            <SummaryCard
              title="Vencidas / Anuladas"
              value={`${(resumen?.vencidas ?? 0).toLocaleString("es-GT")} / ${(resumen?.anuladas ?? 0).toLocaleString("es-GT")}`}
              accent="rojo"
              icon={<ClipboardList className="size-4" />}
            />
          </div>

          <CotizacionesCharts flujoDiario={flujoDiario} porEstado={porEstado} />

          <div className="grid gap-4 lg:grid-cols-2">
            <CotizacionesProductosChart porProducto={porProducto} />
            <CotizacionesClientesChart porCliente={porCliente} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Ranking por producto
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Top 10 variantes más cotizadas
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
                            {row.unidadesCotizadas.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {fmtQ(row.montoTotal)}
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
                  Ranking por cliente
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Top 10 clientes por monto cotizado
                </p>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>#</TableHead>
                      <TableHead className={thClass}>Cliente</TableHead>
                      <TableHead className={`${thClass} text-right`}>Cant.</TableHead>
                      <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porCliente.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-(--color-gris-letra)"
                        >
                          Sin datos de clientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porCliente.map((row, idx) => (
                        <TableRow
                          key={row.idCliente ?? idx}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-bold tabular-nums text-(--color-gris-letra)">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {row.clienteNombre}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidad.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {fmtQ(row.montoTotal)}
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
            Historial de cotizaciones
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Paginado en servidor · fechas, estado y búsqueda
          </p>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>No.</TableHead>
                <TableHead className={thClass}>Cliente</TableHead>
                <TableHead className={thClass}>Vendedor</TableHead>
                <TableHead className={thClass}>Vence</TableHead>
                <TableHead className={`${thClass} text-right`}>Total</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : listQ.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-red-700">
                    {getApiErrorMessage(listQ.error, "No se pudo cargar el historial.")}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-(--color-gris-letra)">
                    No hay cotizaciones en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.idCotizacion} className="hover:bg-(--color-pagina-4)/40">
                    <TableCell className="font-medium">{fmtFecha(row.fechaEmision)}</TableCell>
                    <TableCell className="font-mono">#{row.idCotizacion}</TableCell>
                    <TableCell>{row.nombreCliente || "Consumidor final"}</TableCell>
                    <TableCell>{row.nombreUsuario || "—"}</TableCell>
                    <TableCell>{fmtFecha(row.fechaVencimiento)}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {fmtQ(row.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-semibold border",
                          estadoBadgeClass(row.estado)
                        )}
                      >
                        {etiquetaEstadoCotizacion(row.estado)}
                      </span>
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

export default ReporteCotizacionesPanel;
