import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Layers,
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
import Paginacion from "@/components/shared/Paginacion";
import DateRangeFilter from "./DateRangeFilter";
import SummaryCard from "./SummaryCard";
import AjustesCharts, { AjustesProductosChart } from "./AjustesCharts";
import { useReporteAjustesResumenPeriodoQuery } from "@/hooks/queries/useReportesQueries";
import {
  useAjusteDetalleQuery,
  useAjustesCatalogosQuery,
  useAjustesListQuery,
} from "@/hooks/queries/useAjustesQueries";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";
import { cantidadAjusteDisplay, esEntradaAjusteDetalle } from "@/lib/ajustesMappers";
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

function resumenTipoAjuste(ajuste) {
  const detalles = ajuste?.detalles ?? [];
  if (!detalles.length) return "—";
  const nombres = [...new Set(detalles.map((d) => d.tipoAjusteNombre).filter(Boolean))];
  if (nombres.length === 1) return nombres[0];
  return `${detalles.length} tipos`;
}

function esEntradaAjuste(ajuste) {
  const det = ajuste?.detalles?.[0];
  return det ? esEntradaAjusteDetalle(det) : false;
}

function unidadesAjuste(ajuste) {
  return (ajuste?.detalles ?? []).reduce(
    (acc, d) => acc + cantidadAjusteDisplay(d),
    0
  );
}

function labelUsuario(u) {
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(" ").trim();
  return nombre || u.username || u.email || `Usuario #${u.idUsuario}`;
}

function DetalleAjustePanel({ idAjuste, onClose }) {
  const detalleQ = useAjusteDetalleQuery(idAjuste);
  const ajuste = detalleQ.data;

  return (
    <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Detalle de ajuste #{idAjuste}
          </h3>
          {ajuste ? (
            <p className="text-xs text-(--color-gris-letra) mt-0.5">
              {fmtFecha(ajuste.fechaAjuste)} · {ajuste.usuarioNombre || "—"}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 rounded-lg border border-(--color-gris-claro-2) px-3 text-xs font-semibold text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
        >
          Cerrar
        </button>
      </div>

      {detalleQ.isLoading ? (
        <div className="p-4 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : detalleQ.isError ? (
        <div className="p-4 text-sm text-red-700">
          {getApiErrorMessage(detalleQ.error, "No se pudo cargar el detalle.")}
        </div>
      ) : !ajuste ? (
        <div className="p-8 text-center text-(--color-gris-letra)">Sin datos.</div>
      ) : (
        <>
          <div className="px-4 py-3 text-sm border-b border-(--color-gris-claro-2)">
            <span className="font-semibold">Observación: </span>
            <span className="text-(--color-gris-letra)">
              {ajuste.observacion || "Sin observación"}
            </span>
          </div>
          <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={thClass}>Producto</TableHead>
                  <TableHead className={thClass}>Tipo</TableHead>
                  <TableHead className={`${thClass} text-right`}>Cant.</TableHead>
                  <TableHead className={`${thClass} text-right`}>Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ajuste.detalles ?? []).map((det) => {
                  const entrada = esEntradaAjusteDetalle(det);
                  return (
                    <TableRow key={det.idAjusteDetalle}>
                      <TableCell>
                        <div className="font-medium text-sm">{det.productoNombre || "—"}</div>
                        <div className="text-xs text-(--color-gris-letra)">
                          {det.varianteSku || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            entrada
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {det.tipoAjusteNombre || "—"}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          entrada ? "text-emerald-700" : "text-(--color-rojo)"
                        )}
                      >
                        {entrada ? "+" : "−"}
                        {cantidadAjusteDisplay(det)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {det.costoUnitario == null ? "—" : fmtQ(det.costoUnitario)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

const ReporteAjustesPanel = () => {
  const rangoInicial = rangoFechasMesActual();
  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [page, setPage] = useState(1);
  const [idUsuario, setIdUsuario] = useState("");
  const [idTipoAjuste, setIdTipoAjuste] = useState("");
  const [idDetalle, setIdDetalle] = useState(null);

  const catalogosQ = useAjustesCatalogosQuery();
  const tiposAjuste = catalogosQ.data?.tiposAjuste ?? [];

  const usuariosQ = useUsuariosQuery({ page: 1, pageSize: 100 });
  const usuarios = usuariosQ.data?.items ?? [];

  const resumenQ = useReporteAjustesResumenPeriodoQuery({
    fechaDesde,
    fechaHasta,
    idUsuario: idUsuario || undefined,
    idTipoAjuste: idTipoAjuste || undefined,
  });

  const listQ = useAjustesListQuery({
    page,
    pageSize: PAGE_SIZE,
    fechaDesde,
    fechaHasta,
    idUsuario: idUsuario || undefined,
  });

  const resumen = resumenQ.data?.resumen;
  const flujoDiario = resumenQ.data?.flujoDiario ?? [];
  const porTipo = resumenQ.data?.porTipo ?? [];
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
    setIdDetalle(null);
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
          <label className="text-sm font-semibold text-(--color-gris-letra)">Usuario</label>
          <select
            value={idUsuario}
            onChange={(e) => {
              setIdUsuario(e.target.value);
              setPage(1);
              setIdDetalle(null);
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
          <label className="text-sm font-semibold text-(--color-gris-letra)">Tipo ajuste</label>
          <select
            value={idTipoAjuste}
            onChange={(e) => {
              setIdTipoAjuste(e.target.value);
              setPage(1);
              setIdDetalle(null);
            }}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[180px]"
          >
            <option value="">Todos</option>
            {tiposAjuste.map((t) => (
              <option key={t.idTipoAjuste} value={t.idTipoAjuste}>
                {t.nombre}
              </option>
            ))}
          </select>
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
            "No se pudo cargar el resumen de ajustes del período."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Ajustes del período"
              value={(resumen?.totalAjustes ?? 0).toLocaleString("es-GT")}
              icon={<ClipboardList className="size-4" />}
            />
            <SummaryCard
              title="Líneas modificadas"
              value={(resumen?.totalLineas ?? 0).toLocaleString("es-GT")}
              icon={<Layers className="size-4" />}
            />
            <SummaryCard
              title="Unidades entrada"
              value={(resumen?.unidadesEntrada ?? 0).toLocaleString("es-GT")}
              accent="pagina2"
              icon={<ArrowUpFromLine className="size-4" />}
            />
            <SummaryCard
              title="Unidades salida / merma"
              value={(resumen?.unidadesSalida ?? 0).toLocaleString("es-GT")}
              accent="rojo"
              icon={<ArrowDownToLine className="size-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard
              title="Costo entradas"
              value={fmtQ(resumen?.costoEntrada ?? 0)}
              accent="pagina2"
              icon={<ArrowUpFromLine className="size-4" />}
            />
            <SummaryCard
              title="Costo salidas / mermas"
              value={fmtQ(resumen?.costoSalida ?? 0)}
              accent="rojo"
              icon={<ArrowDownToLine className="size-4" />}
            />
          </div>

          <AjustesCharts flujoDiario={flujoDiario} porTipo={porTipo} />

          <div className="grid gap-4 lg:grid-cols-2">
            <AjustesProductosChart porProducto={porProducto} />

            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Ranking por producto
                </h3>
                <p className="text-xs text-(--color-gris-letra) mt-0.5">
                  Top 10 variantes más ajustadas
                </p>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>#</TableHead>
                      <TableHead className={thClass}>Producto</TableHead>
                      <TableHead className={`${thClass} text-right`}>Unid.</TableHead>
                      <TableHead className={`${thClass} text-right`}>Costo</TableHead>
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
                            {row.unidadesAjustadas.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right font-bold tabular-nums">
                            {fmtQ(row.costoCargado)}
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
            Historial de ajustes
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Selecciona un registro para ver sus líneas
          </p>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>#</TableHead>
                <TableHead className={thClass}>Fecha</TableHead>
                <TableHead className={thClass}>Empleado</TableHead>
                <TableHead className={thClass}>Tipo</TableHead>
                <TableHead className={`${thClass} text-right`}>Líneas</TableHead>
                <TableHead className={`${thClass} text-right`}>Unid.</TableHead>
                <TableHead className={thClass}>Observación</TableHead>
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
                    No hay ajustes en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => {
                  const selected = idDetalle === row.idAjuste;
                  const entrada = esEntradaAjuste(row);
                  return (
                    <TableRow
                      key={row.idAjuste}
                      className={cn(
                        "cursor-pointer hover:bg-(--color-pagina-4)/40",
                        selected && "bg-(--color-pagina-4)/60"
                      )}
                      onClick={() =>
                        setIdDetalle((prev) =>
                          prev === row.idAjuste ? null : row.idAjuste
                        )
                      }
                    >
                      <TableCell className="font-mono font-semibold">
                        #{row.idAjuste}
                      </TableCell>
                      <TableCell className="font-medium">{fmtFecha(row.fechaAjuste)}</TableCell>
                      <TableCell>{row.usuarioNombre || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold",
                            entrada
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {resumenTipoAjuste(row)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(row.detalles ?? []).length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {unidadesAjuste(row).toLocaleString("es-GT")}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate" title={row.observacion}>
                        {row.observacion || "—"}
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
            isLoading={listQ.isFetching}
          />
        </div>
      </div>

      {idDetalle ? (
        <DetalleAjustePanel idAjuste={idDetalle} onClose={() => setIdDetalle(null)} />
      ) : null}
    </div>
  );
};

export default ReporteAjustesPanel;
