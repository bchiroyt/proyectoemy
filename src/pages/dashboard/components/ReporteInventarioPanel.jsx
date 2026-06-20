import { useState } from "react";
import { AlertTriangle, Download, Package, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import SummaryCard from "./SummaryCard";
import {
  useExportarInventarioMutation,
  useReporteInventarioQuery,
  useResumenInventarioQuery,
} from "@/hooks/queries/useReportesQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const estadoBadgeClass = (estado) => {
  const e = String(estado ?? "").toUpperCase();
  if (e === "CRITICO" || e === "CRÍTICO")
    return "bg-red-50 text-red-700 border-red-100";
  if (e === "ADVERTENCIA") return "bg-amber-50 text-amber-800 border-amber-100";
  if (e === "NORMAL") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const ReporteInventarioPanel = () => {
  const [page, setPage] = useState(1);
  const [estadoStock, setEstadoStock] = useState("TODOS");

  const filtros = { estadoStock };
  const listQ = useReporteInventarioQuery({ page, pageSize: PAGE_SIZE, ...filtros });
  const resumenQ = useResumenInventarioQuery(filtros);
  const exportMut = useExportarInventarioMutation();

  const items = listQ.data?.items ?? [];
  const resumen = resumenQ.data?.resumen ?? listQ.data?.resumen;
  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleExport = async () => {
    try {
      await exportMut.mutateAsync(filtros);
    } catch (e) {
      window.alert(getApiErrorMessage(e, "No se pudo exportar el reporte."));
    }
  };

  const isLoading = listQ.isLoading || resumenQ.isLoading;
  const error = listQ.error || resumenQ.error;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Estado</label>
          <select
            value={estadoStock}
            onChange={(e) => {
              setEstadoStock(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm"
          >
            <option value="TODOS">Todos</option>
            <option value="NORMAL">Normal</option>
            <option value="ADVERTENCIA">Advertencia</option>
            <option value="CRITICO">Crítico</option>
          </select>
        </div>

        <Button
          type="button"
          onClick={handleExport}
          disabled={exportMut.isPending}
          className="bg-(--color-pagina-2) hover:opacity-90 text-(--color-blanco) font-semibold gap-2"
        >
          <Download className="size-4" />
          {exportMut.isPending ? "Exportando…" : "Exportar reporte"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, "No se pudo cargar el reporte de inventario.")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Variantes registradas"
            value={resumen?.totalVariantes ?? 0}
            icon={<Package className="size-4 text-(--color-pagina)" />}
          />
          <SummaryCard
            title="Stock normal"
            value={resumen?.normal ?? 0}
            accent="pagina2"
            icon={<ShieldCheck className="size-4 text-emerald-700" />}
          />
          <SummaryCard
            title="Advertencia"
            value={resumen?.advertencia ?? 0}
            accent="advertencia"
            icon={<AlertTriangle className="size-4 text-amber-600" />}
          />
          <SummaryCard
            title="Crítico"
            value={resumen?.critico ?? 0}
            accent="rojo"
            icon={<XCircle className="size-4 text-(--color-rojo)" />}
          />
        </div>
      )}

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Producto</TableHead>
                <TableHead className={thClass}>SKU</TableHead>
                <TableHead className={thClass}>Variante</TableHead>
                <TableHead className={thClass}>Categoría</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Stock</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Mínimo</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={thClass}>Proveedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-(--color-gris-letra)">
                    No hay registros de inventario con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.idVariante} className="hover:bg-(--color-pagina-4)/40">
                    <TableCell className="font-medium">{row.producto || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sku || "—"}</TableCell>
                    <TableCell className="text-sm text-(--color-gris-letra)">
                      {[row.color, row.talla].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell>{row.categoria || "—"}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">{row.stockActual}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stockMinimo ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoBadgeClass(row.estadoStock)}>
                        {row.estadoStock || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{row.proveedor || "—"}</TableCell>
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

export default ReporteInventarioPanel;
