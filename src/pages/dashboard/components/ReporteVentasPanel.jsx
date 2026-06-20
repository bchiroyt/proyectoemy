import { useMemo, useState } from "react";
import { CreditCard, Receipt, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Paginacion from "@/components/shared/Paginacion";
import DateRangeFilter from "./DateRangeFilter";
import SummaryCard from "./SummaryCard";
import { useReporteVentasQuery } from "@/hooks/queries/useReportesQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import {
  etiquetaTipoVenta,
  filtrarVentasPorTipo,
  rangoFechasMesActual,
} from "@/lib/reportesMappers";
import { etiquetaEstadoVenta } from "@/lib/ventaMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const s = String(iso).slice(0, 19);
  const d = new Date(s.includes("T") ? s : `${s.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TIPOS = [
  { value: "TODAS", label: "Todas" },
  { value: "MENUDEO", label: "Menudeo" },
  { value: "MAYOREO", label: "Mayoreo" },
];

const ReporteVentasPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [page, setPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState("TODAS");

  const ventasQ = useReporteVentasQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
  });

  const itemsRaw = ventasQ.data?.items ?? [];
  const items = useMemo(
    () => filtrarVentasPorTipo(itemsRaw, filtroTipo),
    [itemsRaw, filtroTipo]
  );

  const totalPagina = useMemo(
    () => items.reduce((acc, v) => acc + (Number(v.total) || 0), 0),
    [items]
  );

  const totalRegistros = ventasQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, ventasQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeFilter
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChange={handleFechas}
        />

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-(--color-gris-letra)">Tipo</span>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ventasQ.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : ventasQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(ventasQ.error, "No se pudo cargar el reporte de ventas.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Ventas en el período"
            value={totalRegistros}
            icon={<Receipt className="size-4 text-(--color-pagina)" />}
          />
          <SummaryCard
            title="Total en esta página"
            value={fmtQ(totalPagina)}
            accent="pagina2"
            icon={<CreditCard className="size-4 text-emerald-700" />}
          />
          <SummaryCard
            title="Mostrando (filtro local)"
            value={items.length}
            icon={<ShoppingBag className="size-4 text-(--color-pagina)" />}
          />
        </div>
      )}

      {filtroTipo !== "TODAS" ? (
        <p className="text-xs text-(--color-gris-letra)">
          El filtro Menudeo/Mayoreo se aplica sobre los registros de la página actual.
        </p>
      ) : null}

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Ticket</TableHead>
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>Cliente</TableHead>
                <TableHead className={thClass}>Tipo</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={thClass}>Cajero</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventasQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-(--color-gris-letra)">
                    No hay ventas en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.idVenta} className="hover:bg-(--color-pagina-4)/40">
                    <TableCell className="font-mono font-semibold">
                      {row.numeroTicket || `#${row.idVenta}`}
                    </TableCell>
                    <TableCell className="text-sm">{fmtFecha(row.fechaHora)}</TableCell>
                    <TableCell>{row.clienteNombre || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          etiquetaTipoVenta(row.tipoVenta) === "Mayoreo"
                            ? "bg-(--color-pagina-4) text-(--color-pagina) border-(--color-pagina)/20"
                            : "bg-emerald-50 text-emerald-800 border-emerald-100"
                        }
                      >
                        {etiquetaTipoVenta(row.tipoVenta)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{etiquetaEstadoVenta(row.estadoVenta)}</TableCell>
                    <TableCell className="text-sm text-(--color-gris-letra)">
                      {row.usuarioNombre || "—"}
                    </TableCell>
                    <TableCell className="text-right font-black tabular-nums text-(--color-pagina)">
                      {fmtQ(row.total)}
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
            isLoading={ventasQ.isFetching}
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteVentasPanel;
