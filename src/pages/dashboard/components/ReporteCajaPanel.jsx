import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Download,
  Landmark,
  RefreshCw,
  Scale,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import CajaFlujoCharts from "./CajaFlujoCharts";
import {
  useReporteCajaMovimientosQuery,
  useReporteCajaResumenPeriodoQuery,
  useReporteCajaResumenQuery,
  useReporteCajaSesionesQuery,
} from "@/hooks/queries/useReportesQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { generarInformeCajaPeriodoPdf } from "@/lib/pdfExport";
import { rangoFechasMesActual } from "@/lib/reportesMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const ESTADOS = [
  { value: "TODAS", label: "Todas" },
  { value: "ABIERTA", label: "Abiertas" },
  { value: "CERRADA", label: "Cerradas" },
];

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

function badgeEstado(estado) {
  const e = String(estado || "").toUpperCase();
  if (e.includes("ABIERT")) {
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }
  if (e.includes("CERRAD")) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  return "bg-(--color-pagina-4) text-(--color-pagina) border-(--color-pagina)/20";
}

function colorDiferencia(diff) {
  if (diff == null || Number.isNaN(Number(diff))) return "text-(--color-gris-letra)";
  const n = Number(diff);
  if (n > 0) return "text-emerald-700";
  if (n < 0) return "text-(--color-rojo)";
  return "text-(--color-texto-principal)";
}

const ReporteCajaPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [estado, setEstado] = useState("TODAS");
  const [page, setPage] = useState(1);
  const [idSesionDetalle, setIdSesionDetalle] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const resumenPeriodoQ = useReporteCajaResumenPeriodoQuery({
    fechaDesde,
    fechaHasta,
  });

  const sesionesQ = useReporteCajaSesionesQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    estado,
  });

  const detalleResumenQ = useReporteCajaResumenQuery(idSesionDetalle, {
    enabled: Number(idSesionDetalle) > 0,
  });
  const detalleMovQ = useReporteCajaMovimientosQuery(idSesionDetalle, {
    enabled: Number(idSesionDetalle) > 0,
  });

  const resumen = resumenPeriodoQ.data;
  const sesiones = sesionesQ.data?.items ?? [];
  const totalRegistros = sesionesQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, sesionesQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const movimientosDetalle = detalleMovQ.data?.items ?? [];
  const resumenDetalle = detalleResumenQ.data?.resumen;

  const handleFechas = ({ fechaDesde: d, fechaHasta: h }) => {
    setFechaDesde(d);
    setFechaHasta(h);
    setPage(1);
    setIdSesionDetalle(null);
  };

  const handleExportPdf = async () => {
    if (!resumen) {
      window.alert("Espera a que cargue el resumen de caja antes de exportar.");
      return;
    }
    setIsExportingPdf(true);
    try {
      await generarInformeCajaPeriodoPdf({
        fechaDesde,
        fechaHasta,
        resumen,
      });
    } catch (e) {
      window.alert(
        getApiErrorMessage(e, "No se pudo generar el informe de caja.")
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const periodoError = resumenPeriodoQ.error || sesionesQ.error;

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
              setIdSesionDetalle(null);
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

        <div className="flex flex-col gap-1.5 ml-auto">
          <label className="text-sm font-semibold text-transparent select-none">PDF</label>
          <Button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf || resumenPeriodoQ.isLoading || !resumen}
            className="h-9 bg-(--color-pagina) hover:opacity-90 text-(--color-blanco) font-semibold gap-2"
          >
            <Download className="size-4" />
            {isExportingPdf ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>
      </div>

      {resumenPeriodoQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : resumenPeriodoQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            resumenPeriodoQ.error,
            "No se pudo cargar el resumen de caja del período."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Ventas en efectivo"
              value={fmtQ(resumen?.ventasEfectivo ?? 0)}
              accent="pagina2"
              icon={<Banknote className="size-4" />}
            />
            <SummaryCard
              title="Reembolsos en efectivo"
              value={fmtQ(resumen?.reembolsosEfectivo ?? 0)}
              accent="rojo"
              icon={<RefreshCw className="size-4" />}
            />
            <SummaryCard
              title="Ingresos manuales"
              value={fmtQ(resumen?.ingresosManuales ?? 0)}
              icon={<ArrowUpCircle className="size-4" />}
            />
            <SummaryCard
              title="Egresos manuales"
              value={fmtQ(resumen?.egresosManuales ?? 0)}
              accent="advertencia"
              icon={<ArrowDownCircle className="size-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Sesiones del período"
              value={(resumen?.totalSesiones ?? 0).toLocaleString("es-GT")}
              icon={<Landmark className="size-4" />}
            />
            <SummaryCard
              title="Total aperturas"
              value={fmtQ(resumen?.totalAperturas ?? 0)}
              accent="pagina2"
              icon={<Wallet className="size-4" />}
            />
            <SummaryCard
              title="Total cierres reales"
              value={fmtQ(resumen?.totalCierresReales ?? 0)}
              icon={<Landmark className="size-4" />}
            />
            <SummaryCard
              title="Diferencia neta"
              value={fmtQ(resumen?.totalDiferencia ?? 0)}
              accent={
                Number(resumen?.totalDiferencia) < 0
                  ? "rojo"
                  : Number(resumen?.totalDiferencia) > 0
                    ? "pagina2"
                    : "pagina"
              }
              icon={<Scale className="size-4" />}
            />
          </div>

          <CajaFlujoCharts flujoDiario={resumen?.flujoDiario ?? []} />
        </>
      )}

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Historial de sesiones / turnos
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Selecciona un turno para ver sus movimientos
          </p>
        </div>

        {sesionesQ.isError && !resumenPeriodoQ.isError ? (
          <div className="p-4 text-sm text-red-700">
            {getApiErrorMessage(periodoError, "No se pudo cargar el historial de sesiones.")}
          </div>
        ) : null}

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Caja</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={thClass}>Apertura</TableHead>
                <TableHead className={thClass}>Cierre</TableHead>
                <TableHead className={thClass}>Abrió</TableHead>
                <TableHead className={thClass}>Cerró</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Apertura Q</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Esperado</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Real</TableHead>
                <TableHead className={cn(thClass, "text-right")}>Dif.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sesionesQ.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={10}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sesiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-(--color-gris-letra)">
                    No hay sesiones de caja en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                sesiones.map((row) => {
                  const selected = idSesionDetalle === row.idCaja;
                  return (
                    <TableRow
                      key={row.idCaja}
                      className={cn(
                        "cursor-pointer hover:bg-(--color-pagina-4)/40",
                        selected && "bg-(--color-pagina-4)/60"
                      )}
                      onClick={() =>
                        setIdSesionDetalle((prev) =>
                          prev === row.idCaja ? null : row.idCaja
                        )
                      }
                    >
                      <TableCell className="font-mono font-semibold">#{row.idCaja}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badgeEstado(row.estado)}>
                          {row.estado || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{fmtFecha(row.fechaApertura)}</TableCell>
                      <TableCell className="text-sm">{fmtFecha(row.fechaCierre)}</TableCell>
                      <TableCell className="text-sm">
                        {row.usuarioAperturaNombre || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.usuarioCierreNombre || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtQ(row.montoApertura)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.montoEsperado == null ? "—" : fmtQ(row.montoEsperado)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.montoReal == null ? "—" : fmtQ(row.montoReal)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          colorDiferencia(row.diferencia)
                        )}
                      >
                        {row.diferencia == null ? "—" : fmtQ(row.diferencia)}
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
            isLoading={sesionesQ.isFetching}
          />
        </div>
      </div>

      {idSesionDetalle ? (
        <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-(--color-texto-principal)">
                Movimientos · Caja #{idSesionDetalle}
              </h3>
              <p className="text-xs text-(--color-gris-letra) mt-0.5">
                Apertura: {fmtFecha(resumenDetalle?.fechaApertura)}
                {resumenDetalle?.fechaCierre
                  ? ` · Cierre: ${fmtFecha(resumenDetalle.fechaCierre)}`
                  : ""}
                {resumenDetalle?.montoEsperado != null
                  ? ` · Esperado: ${fmtQ(resumenDetalle.montoEsperado)}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIdSesionDetalle(null)}
              className="h-8 rounded-lg border border-(--color-gris-claro-2) px-3 text-xs font-semibold text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
            >
              Cerrar detalle
            </button>
          </div>

          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={thClass}>Fecha</TableHead>
                  <TableHead className={thClass}>Tipo</TableHead>
                  <TableHead className={thClass}>Naturaleza</TableHead>
                  <TableHead className={thClass}>Usuario</TableHead>
                  <TableHead className={thClass}>Motivo</TableHead>
                  <TableHead className={cn(thClass, "text-right")}>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalleMovQ.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : detalleMovQ.isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-red-700">
                      {getApiErrorMessage(
                        detalleMovQ.error,
                        "No se pudieron cargar los movimientos."
                      )}
                    </TableCell>
                  </TableRow>
                ) : movimientosDetalle.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center text-(--color-gris-letra)"
                    >
                      Sin movimientos registrados para esta sesión.
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientosDetalle.map((m) => (
                    <TableRow key={m.idMovimientoCaja} className="hover:bg-(--color-pagina-4)/40">
                      <TableCell className="text-sm">{fmtFecha(m.fechaMovimiento)}</TableCell>
                      <TableCell>{m.tipoMovimientoNombre || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            String(m.naturaleza).toUpperCase() === "ENTRADA"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }
                        >
                          {m.naturaleza || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-(--color-gris-letra)">
                        {m.usuarioNombre || "—"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[220px] truncate">
                        {m.motivo || "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          String(m.naturaleza).toUpperCase() === "ENTRADA"
                            ? "text-emerald-700"
                            : "text-(--color-rojo)"
                        )}
                      >
                        {fmtQ(m.monto)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReporteCajaPanel;
