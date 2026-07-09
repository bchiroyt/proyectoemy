import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Truck,
  XCircle,
} from "lucide-react";
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
import ComprasCharts, { ComprasProveedorChart } from "./ComprasCharts";
import {
  useReporteComprasQuery,
  useReporteComprasResumenPeriodoQuery,
} from "@/hooks/queries/useReportesQueries";
import { useProveedoresCompraQuery } from "@/hooks/queries/useComprasQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { rangoFechasMesActual } from "@/lib/reportesMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const ESTADOS = [
  { value: "TODAS", label: "Todas" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "CERRADA", label: "Recibidas" },
  { value: "ANULADA", label: "Anuladas" },
];

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const s = String(iso).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const estadoClass = (estado) => {
  if (estado === "Recibido") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (estado === "En Proceso") return "bg-amber-50 text-amber-800 border-amber-100";
  if (estado === "Anulada") return "bg-slate-100 text-slate-500 border-slate-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

function labelProveedor(p) {
  return p?.nombre || p?.Nombre || `Proveedor #${p?.idProveedor ?? p?.IdProveedor ?? "?"}`;
}

const ReporteComprasPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [page, setPage] = useState(1);
  const [estadoCompra, setEstadoCompra] = useState("TODAS");
  const [idProveedor, setIdProveedor] = useState("");
  const [numeroOrden, setNumeroOrden] = useState("");
  const [ordenBusqueda, setOrdenBusqueda] = useState("");

  const proveedoresQ = useProveedoresCompraQuery();
  const proveedores = proveedoresQ.data ?? [];

  const resumenQ = useReporteComprasResumenPeriodoQuery({
    fechaDesde,
    fechaHasta,
    idProveedor: idProveedor || undefined,
    estadoCompra,
  });

  const comprasQ = useReporteComprasQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    estadoCompra: estadoCompra !== "TODAS" ? estadoCompra : undefined,
    idProveedor: idProveedor || undefined,
    numeroOrden: ordenBusqueda || undefined,
  });

  const resumen = resumenQ.data?.resumen;
  const flujoDiario = resumenQ.data?.flujoDiario ?? [];
  const porProveedor = resumenQ.data?.porProveedor ?? [];
  const porEstado = resumenQ.data?.porEstado ?? [];

  const items = comprasQ.data?.items ?? [];
  const totalRegistros = comprasQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, comprasQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
  };

  const aplicarBusquedaOrden = () => {
    setOrdenBusqueda(numeroOrden.trim());
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
            value={estadoCompra}
            onChange={(e) => {
              setEstadoCompra(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium min-w-[140px]"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Proveedor</label>
          <select
            value={idProveedor}
            onChange={(e) => {
              setIdProveedor(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[180px]"
          >
            <option value="">Todos</option>
            {proveedores.map((p) => {
              const id = p.idProveedor ?? p.IdProveedor;
              return (
                <option key={id} value={id}>
                  {labelProveedor(p)}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Nº orden</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={numeroOrden}
              onChange={(e) => setNumeroOrden(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") aplicarBusquedaOrden();
              }}
              placeholder="Buscar orden"
              className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm w-[140px]"
            />
            <button
              type="button"
              onClick={aplicarBusquedaOrden}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-4) px-3 text-sm font-semibold text-(--color-pagina) hover:bg-(--color-pagina)/10"
            >
              Buscar
            </button>
          </div>
        </div>
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
            "No se pudo cargar el resumen de compras del período."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Compras del período"
              value={(resumen?.totalCompras ?? 0).toLocaleString("es-GT")}
              icon={<ClipboardList className="size-4" />}
            />
            <SummaryCard
              title="Monto total"
              value={fmtQ(resumen?.montoTotal ?? 0)}
              accent="pagina2"
              icon={<Truck className="size-4" />}
            />
            <SummaryCard
              title="Recibidas"
              value={fmtQ(resumen?.montoRecibido ?? 0)}
              accent="pagina2"
              icon={<CheckCircle2 className="size-4" />}
            />
            <SummaryCard
              title="En proceso"
              value={fmtQ(resumen?.montoEnProceso ?? 0)}
              accent="advertencia"
              icon={<Clock3 className="size-4" />}
            />
          </div>

          {(resumen?.montoAnulado ?? 0) > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex items-center gap-2">
              <XCircle className="size-4 text-slate-500" />
              <span className="font-semibold text-(--color-texto-principal)">Anuladas: </span>
              <span className="text-(--color-gris-letra)">{fmtQ(resumen.montoAnulado)}</span>
            </div>
          ) : null}

          <ComprasCharts flujoDiario={flujoDiario} porEstado={porEstado} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ComprasProveedorChart porProveedor={porProveedor} />

            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Ranking por proveedor
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Top 10 del período
                </p>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>#</TableHead>
                      <TableHead className={thClass}>Proveedor</TableHead>
                      <TableHead className={`${thClass} text-right`}>Compras</TableHead>
                      <TableHead className={`${thClass} text-right`}>Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porProveedor.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-(--color-gris-letra)"
                        >
                          Sin datos de proveedores.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porProveedor.map((row, idx) => (
                        <TableRow
                          key={row.idProveedor ?? idx}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-bold tabular-nums text-(--color-gris-letra)">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{row.proveedorNombre}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidadCompras}
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
            Detalle de compras
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Listado paginado con los filtros actuales
          </p>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Folio</TableHead>
                <TableHead className={thClass}>Proveedor</TableHead>
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>Tipo</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comprasQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : comprasQ.isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-red-700">
                    {getApiErrorMessage(
                      comprasQ.error,
                      "No se pudo cargar el detalle de compras."
                    )}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-(--color-gris-letra)">
                    No hay compras con los filtros seleccionados.
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
                    <TableRow
                      key={row.idCompra ?? row.id}
                      className="hover:bg-(--color-pagina-4)/40"
                    >
                      <TableCell className="font-mono font-semibold">{folio}</TableCell>
                      <TableCell>{proveedorNombre || "—"}</TableCell>
                      <TableCell>{fmtFecha(row.fechaPedido || row.fechaCompra)}</TableCell>
                      <TableCell className="text-sm text-(--color-gris-letra)">
                        {row.tipoComprobante || "—"}
                      </TableCell>
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
