import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Landmark, Wallet } from "lucide-react";
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
import SummaryCard from "./SummaryCard";
import {
  useReporteCajaMovimientosQuery,
  useReporteCajaResumenQuery,
} from "@/hooks/queries/useReportesQueries";
import { useCajasAbiertasQuery } from "@/hooks/queries/useCajaQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";

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

const ReporteCajaPanel = () => {
  const cajasQ = useCajasAbiertasQuery();
  const cajas = cajasQ.data?.data ?? [];
  const [idCaja, setIdCaja] = useState(null);

  useEffect(() => {
    if (idCaja != null) return;
    if (cajas.length > 0) setIdCaja(cajas[0].idCaja);
  }, [cajas, idCaja]);

  const resumenQ = useReporteCajaResumenQuery(idCaja);
  const movQ = useReporteCajaMovimientosQuery(idCaja);

  const resumen = resumenQ.data?.resumen;
  const movimientos = movQ.data?.items ?? [];
  const saldoActual = resumen?.montoEsperado ?? 0;

  const isLoading = cajasQ.isLoading || resumenQ.isLoading || movQ.isLoading;
  const error = cajasQ.error || resumenQ.error || movQ.error;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-(--color-gris-letra)">Caja</span>
        {cajasQ.isLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : cajas.length === 0 ? (
          <span className="text-sm text-(--color-gris-letra)">No hay cajas abiertas.</span>
        ) : (
          <select
            value={idCaja ?? ""}
            onChange={(e) => setIdCaja(Number(e.target.value))}
            className="h-9 min-w-[220px] rounded-lg border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm font-medium"
          >
            {cajas.map((c) => (
              <option key={c.idCaja} value={c.idCaja}>
                Caja #{c.idCaja} — {c.usuarioResponsableNombre || "Sin responsable"}
              </option>
            ))}
          </select>
        )}
        {resumen?.estado ? (
          <Badge variant="outline" className="bg-(--color-pagina-4) text-(--color-pagina)">
            {resumen.estado}
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(error, "No se pudo cargar el reporte de caja.")}
        </div>
      ) : idCaja ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Saldo inicial"
              value={fmtQ(resumen?.montoApertura ?? 0)}
              icon={<Wallet className="size-4 text-(--color-pagina)" />}
            />
            <SummaryCard
              title="Entradas manuales"
              value={fmtQ(resumen?.totalEntradasManual ?? 0)}
              accent="pagina2"
              icon={<ArrowUpCircle className="size-4 text-emerald-700" />}
            />
            <SummaryCard
              title="Salidas manuales"
              value={fmtQ(resumen?.totalSalidasManual ?? 0)}
              accent="rojo"
              icon={<ArrowDownCircle className="size-4 text-(--color-rojo)" />}
            />
            <SummaryCard
              title="Saldo esperado"
              value={fmtQ(saldoActual)}
              icon={<Landmark className="size-4 text-(--color-pagina)" />}
            />
          </div>

          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
              <h3 className="text-sm font-bold text-(--color-texto-principal)">
                Movimientos de caja #{idCaja}
              </h3>
              <p className="text-xs text-(--color-gris-letra) mt-0.5">
                Apertura: {fmtFecha(resumen?.fechaApertura)}
                {resumen?.fechaCierre ? ` · Cierre: ${fmtFecha(resumen.fechaCierre)}` : ""}
              </p>
            </div>

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={thClass}>Fecha</TableHead>
                    <TableHead className={thClass}>Tipo</TableHead>
                    <TableHead className={thClass}>Naturaleza</TableHead>
                    <TableHead className={thClass}>Motivo</TableHead>
                    <TableHead className={thClass}>Referencia</TableHead>
                    <TableHead className={cn(thClass, "text-right")}>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movQ.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-(--color-gris-letra)">
                        Sin movimientos registrados para esta caja.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((m) => (
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
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {m.motivo || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {m.referenciaExterna || "—"}
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
        </>
      ) : null}
    </div>
  );
};

export default ReporteCajaPanel;
