import { useMemo, useState } from "react";
import { ClipboardList, Truck } from "lucide-react";
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
import { useReporteComprasQuery } from "@/hooks/queries/useReportesQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { rangoFechasMesActual } from "@/lib/reportesMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const estadoClass = (estado) => {
  if (estado === "Recibido") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (estado === "En Proceso") return "bg-pink-50 text-pink-700 border-pink-100";
  if (estado === "Anulada") return "bg-slate-100 text-slate-500 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const ReporteComprasPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [page, setPage] = useState(1);

  const comprasQ = useReporteComprasQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
  });

  const items = comprasQ.data?.items ?? [];
  const totalPagina = useMemo(
    () => items.reduce((acc, c) => acc + (Number(c.total) || 0), 0),
    [items]
  );

  const totalRegistros = comprasQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, comprasQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <DateRangeFilter
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onChange={handleFechas}
      />

      {comprasQ.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : comprasQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(comprasQ.error, "No se pudo cargar el reporte de compras.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            title="Compras en el período"
            value={totalRegistros}
            icon={<ClipboardList className="size-4 text-(--color-pagina)" />}
          />
          <SummaryCard
            title="Monto en esta página"
            value={fmtQ(totalPagina)}
            accent="pagina2"
            icon={<Truck className="size-4 text-emerald-700" />}
          />
        </div>
      )}

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Folio</TableHead>
                <TableHead className={thClass}>Proveedor</TableHead>
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comprasQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-(--color-gris-letra)">
                    No hay compras en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => {
                  const folio =
                    row.numeroReferencia ||
                    (row.idCompra ? `#${row.idCompra}` : "—");
                  const proveedorNombre =
                    typeof row.proveedor === "object"
                      ? row.proveedor?.nombre
                      : row.proveedorNombre || row.proveedor;
                  return (
                    <TableRow key={row.idCompra ?? row.id} className="hover:bg-(--color-pagina-4)/40">
                      <TableCell className="font-mono font-semibold">{folio}</TableCell>
                      <TableCell>{proveedorNombre || "—"}</TableCell>
                      <TableCell>{fmtFecha(row.fechaPedido || row.fechaCompra)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estadoClass(row.estado)}>
                          {row.estado || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black tabular-nums text-(--color-pagina)">
                        {fmtQ(row.total)}
                      </TableCell>
                    </TableRow>
                  );
                })
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
            isLoading={comprasQ.isFetching}
          />
        </div>
      </div>
    </div>
  );
};

export default ReporteComprasPanel;
