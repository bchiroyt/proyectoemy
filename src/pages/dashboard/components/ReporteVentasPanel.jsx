import { useMemo, useState } from "react";
import { CreditCard, Receipt, ShoppingBag, Store } from "lucide-react";
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
import VentasCharts from "./VentasCharts";
import ProductosMasVendidosPanel from "./ProductosMasVendidosPanel";
import {
  useProductosMasVendidosQuery,
  useVentasPeriodoQuery,
} from "@/hooks/queries/useReportesQueries";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import {
  construirMetricasVentas,
  etiquetaTipoVenta,
  filtrarVentasPorTipo,
  rangoFechasMesActual,
} from "@/lib/reportesMappers";
import { etiquetaEstadoVenta } from "@/lib/ventaMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
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

function labelUsuario(u) {
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return nombre || u.username || u.email || `Usuario #${u.idUsuario}`;
}

const ReporteVentasPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [page, setPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState("TODAS");
  const [idUsuario, setIdUsuario] = useState("");
  const [numeroTicket, setNumeroTicket] = useState("");
  const [ticketBusqueda, setTicketBusqueda] = useState("");
  const [tipoDistribucion, setTipoDistribucion] = useState("circulo");
  const [agruparPor, setAgruparPor] = useState("variante");
  const [ordenProductos, setOrdenProductos] = useState("cantidad");
  const [topProductos, setTopProductos] = useState(20);

  const usuariosQ = useUsuariosQuery({ page: 1, pageSize: 100 });
  const usuarios = usuariosQ.data?.items ?? [];

  const ventasQ = useVentasPeriodoQuery({
    fechaDesde,
    fechaHasta,
    idUsuario: idUsuario || undefined,
    numeroTicket: ticketBusqueda || undefined,
  });

  const productosQ = useProductosMasVendidosQuery({
    fechaDesde,
    fechaHasta,
    agruparPor,
    orden: ordenProductos,
    top: topProductos,
    tipoVenta: filtroTipo,
    idUsuario: idUsuario || undefined,
  });

  const itemsRaw = ventasQ.data?.items ?? [];

  const itemsFiltrados = useMemo(
    () => filtrarVentasPorTipo(itemsRaw, filtroTipo),
    [itemsRaw, filtroTipo]
  );

  const metricas = useMemo(
    () => construirMetricasVentas(itemsFiltrados),
    [itemsFiltrados]
  );

  const totalPages = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE) || 1);
  const pageSafe = Math.min(page, totalPages);
  const fromIdx = (pageSafe - 1) * PAGE_SIZE;
  const itemsPagina = itemsFiltrados.slice(fromIdx, fromIdx + PAGE_SIZE);
  const totalRegistros = itemsFiltrados.length;
  const from = totalRegistros === 0 ? 0 : fromIdx + 1;
  const to = Math.min(fromIdx + PAGE_SIZE, totalRegistros);

  const totalApi = ventasQ.data?.totalCount ?? itemsRaw.length;
  const truncated = Boolean(ventasQ.data?.truncated);
  const muestraParcial =
    truncated || (totalApi > 0 && itemsRaw.length < totalApi);

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
  };

  const aplicarBusquedaTicket = () => {
    setTicketBusqueda(numeroTicket.trim());
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
          <label className="text-sm font-semibold text-(--color-gris-letra)">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium min-w-[140px]"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

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
            {usuarios.map((u) => (
              <option key={u.idUsuario} value={u.idUsuario}>
                {labelUsuario(u)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Ticket</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={numeroTicket}
              onChange={(e) => setNumeroTicket(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") aplicarBusquedaTicket();
              }}
              placeholder="Nº ticket"
              className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm w-[140px]"
            />
            <button
              type="button"
              onClick={aplicarBusquedaTicket}
              className="h-9 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-4) px-3 text-sm font-semibold text-(--color-pagina) hover:bg-(--color-pagina)/10"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {muestraParcial && !ventasQ.isLoading && !ventasQ.isError ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Métricas calculadas con {itemsRaw.length.toLocaleString("es-GT")} de{" "}
          {totalApi.toLocaleString("es-GT")} ventas del período (tope de muestra).
        </p>
      ) : null}

      <ProductosMasVendidosPanel
        items={productosQ.data?.items ?? []}
        resumen={productosQ.data?.resumen}
        isLoading={productosQ.isLoading}
        isError={productosQ.isError}
        error={productosQ.error}
        agruparPor={agruparPor}
        onAgruparPorChange={setAgruparPor}
        orden={ordenProductos}
        onOrdenChange={setOrdenProductos}
        top={topProductos}
        onTopChange={setTopProductos}
        metricaGrafica={ordenProductos}
      />

      {ventasQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : ventasQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(ventasQ.error, "No se pudo cargar el reporte de ventas.")}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Tickets del período"
              value={metricas.totalTickets.toLocaleString("es-GT")}
              icon={<Receipt className="size-4" />}
            />
            <SummaryCard
              title="Monto total"
              value={fmtQ(metricas.totalMonto)}
              accent="pagina2"
              icon={<CreditCard className="size-4" />}
            />
            <SummaryCard
              title="Ticket promedio"
              value={fmtQ(metricas.ticketPromedio)}
              icon={<ShoppingBag className="size-4" />}
            />
            <SummaryCard
              title="Mayoreo"
              value={`${fmtQ(metricas.mayoreo.monto)} · ${metricas.mayoreo.tickets}`}
              accent="advertencia"
              icon={<Store className="size-4" />}
            />
          </div>

          {filtroTipo === "TODAS" && metricas.menudeo.tickets + metricas.mayoreo.tickets > 0 ? (
            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-pagina-4)/40 px-4 py-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="font-semibold text-(--color-texto-principal)">Menudeo: </span>
                <span className="text-(--color-gris-letra)">
                  {fmtQ(metricas.menudeo.monto)} ({metricas.menudeo.tickets} tickets)
                </span>
              </span>
              <span>
                <span className="font-semibold text-(--color-texto-principal)">Mayoreo: </span>
                <span className="text-(--color-gris-letra)">
                  {fmtQ(metricas.mayoreo.monto)} ({metricas.mayoreo.tickets} tickets)
                </span>
              </span>
            </div>
          ) : null}

          <VentasCharts
            porTipo={metricas.porTipo}
            porDia={metricas.porDia}
            tipoDistribucion={tipoDistribucion}
            onTipoDistribucionChange={setTipoDistribucion}
          />

          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
              <h3 className="text-sm font-bold text-(--color-texto-principal)">
                Detalle de ventas
              </h3>
              <p className="text-xs text-(--color-gris-letra) mt-0.5">
                {totalRegistros.toLocaleString("es-GT")} registro
                {totalRegistros === 1 ? "" : "s"} con el filtro actual
              </p>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
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
                  {itemsPagina.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-(--color-gris-letra)"
                      >
                        No hay ventas con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    itemsPagina.map((row) => (
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
                        <TableCell className="text-sm">
                          {etiquetaEstadoVenta(row.estadoVenta)}
                        </TableCell>
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
                disablePrev={pageSafe <= 1}
                disableNext={pageSafe >= totalPages}
                isLoading={ventasQ.isFetching}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReporteVentasPanel;
