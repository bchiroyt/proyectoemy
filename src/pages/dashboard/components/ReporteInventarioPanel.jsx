import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Download,
  Layers,
  Package,
  Percent,
  ShieldCheck,
  Tag,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import InventarioStockChart from "./InventarioStockChart";
import InventarioValorizacionCharts from "./InventarioValorizacionCharts";
import {
  useInventarioValorizacionQuery,
  useInventarioValorizacionVariantesQuery,
  useReporteInventarioQuery,
  useResumenInventarioQuery,
} from "@/hooks/queries/useReportesQueries";
import { obtenerCategorias } from "@/services/categorias";
import { obtenerMarcas } from "@/services/marcas";
import { getApiErrorMessage, API_BASE_URL } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";
import { normalizarEstadoStock } from "@/lib/nivelesStockMappers";
import {
  generarInformeNivelStockPdf,
  generarInformeValorizacionInventarioPdf,
  generarInformeDetalleValorizadoVariantesPdf,
} from "@/lib/pdfExport";
import { fetchNivelesStockExportar } from "@/services/nivelesStockService";
import { fetchInventarioValorizacionVariantes } from "@/services/reportesInventarioService";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const ORDENES = [
  { value: "valorCostoDesc", label: "Mayor capital" },
  { value: "stockDesc", label: "Mayor stock" },
  { value: "valorVenta", label: "Mayor venta potencial" },
];

const estadoBadgeClass = (estado) => {
  const e = String(estado ?? "").toUpperCase();
  if (e === "CRITICO" || e === "CRÍTICO")
    return "bg-red-50 text-red-700 border-red-100";
  if (e === "ADVERTENCIA") return "bg-amber-50 text-amber-800 border-amber-100";
  if (e === "NORMAL") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

function SeccionCapital() {
  const [page, setPage] = useState(1);
  const [criterio, setCriterio] = useState("");
  const [criterioDebounced, setCriterioDebounced] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idMarca, setIdMarca] = useState("");
  const [soloSinCosto, setSoloSinCosto] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState("valorCostoDesc");
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [isExportingResumen, setIsExportingResumen] = useState(false);
  const [isExportingDetalle, setIsExportingDetalle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, mars] = await Promise.all([
          obtenerCategorias({ Activo: true, Page: 1, PageSize: 500 }),
          obtenerMarcas({ Page: 1, PageSize: 500 }),
        ]);
        if (cancelled) return;
        setCategorias(cats?.items ?? []);
        setMarcas(mars?.items ?? []);
      } catch {
        if (!cancelled) {
          setCategorias([]);
          setMarcas([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setCriterioDebounced(String(criterio ?? "").trim());
    }, 350);
    return () => clearTimeout(t);
  }, [criterio]);

  useEffect(() => {
    setPage(1);
  }, [criterioDebounced, idCategoria, idMarca, soloSinCosto, ordenarPor]);

  const valQ = useInventarioValorizacionQuery();
  const listQ = useInventarioValorizacionVariantesQuery({
    page,
    pageSize: PAGE_SIZE,
    criterio: criterioDebounced || undefined,
    idCategoria: idCategoria || undefined,
    idMarca: idMarca || undefined,
    soloSinCosto: soloSinCosto ? true : undefined,
    soloConStock: true,
    ordenarPor,
  });

  const resumen = valQ.data?.resumen;
  const porCategoria = valQ.data?.porCategoria ?? [];
  const porMarca = valQ.data?.porMarca ?? [];
  const rangosCosto = valQ.data?.rangosCosto ?? [];
  const top = valQ.data?.topVariantesPorValor ?? [];

  const items = listQ.data?.items ?? [];
  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleExportResumenPdf = async () => {
    if (!resumen) {
      window.alert("Espera a que cargue la valorización antes de exportar.");
      return;
    }
    setIsExportingResumen(true);
    try {
      await generarInformeValorizacionInventarioPdf({
        fecha: new Date(),
        resumen,
        topVariantes: top,
      });
    } catch (e) {
      window.alert(
        getApiErrorMessage(e, "No se pudo generar el informe de capital.")
      );
    } finally {
      setIsExportingResumen(false);
    }
  };

  const handleExportDetallePdf = async () => {
    setIsExportingDetalle(true);
    try {
      const detalle = await fetchInventarioValorizacionVariantes({
        page: 1,
        pageSize: 2000,
        soloConStock: true,
        ordenarPor: "valorCostoDesc",
      });
      await generarInformeDetalleValorizadoVariantesPdf({
        fecha: new Date(),
        variantes: detalle.items ?? [],
      });
    } catch (e) {
      window.alert(
        getApiErrorMessage(e, "No se pudo generar el detalle de capital.")
      );
    } finally {
      setIsExportingDetalle(false);
    }
  };

  return (
    <div className="space-y-5">
      {valQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : valQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            valQ.error,
            "No se pudo cargar la valorización de inventario."
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {resumen?.metodoValuacion ? (
              <p className="text-xs text-(--color-gris-letra)">
                Método: {resumen.metodoValuacion}
              </p>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleExportResumenPdf}
                disabled={isExportingResumen || isExportingDetalle || !resumen}
                className="bg-(--color-pagina) hover:opacity-90 text-(--color-blanco) font-semibold gap-2"
              >
                <Download className="size-4" />
                {isExportingResumen ? "Generando…" : "PDF resumen de capital"}
              </Button>
              <Button
                type="button"
                onClick={handleExportDetallePdf}
                disabled={isExportingResumen || isExportingDetalle}
                className="bg-(--color-pagina-2) hover:opacity-90 text-(--color-blanco) font-semibold gap-2"
              >
                <Download className="size-4" />
                {isExportingDetalle ? "Generando…" : "PDF detalle por producto"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Capital a costo"
              value={fmtQ(resumen?.valorCostoTotal ?? 0)}
              icon={<Wallet className="size-4" />}
            />
            <SummaryCard
              title="Potencial menudeo"
              value={fmtQ(resumen?.valorVentaMenudeoTotal ?? 0)}
              accent="pagina2"
              icon={<Banknote className="size-4" />}
            />
            <SummaryCard
              title="Potencial mayoreo"
              value={fmtQ(resumen?.valorVentaMayoreoTotal ?? 0)}
              accent="pagina2"
              icon={<Tag className="size-4" />}
            />
            <SummaryCard
              title="Margen potencial"
              value={fmtQ(resumen?.margenPotencial ?? 0)}
              accent="advertencia"
              icon={<TrendingUp className="size-4" />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Unidades en stock"
              value={(resumen?.unidadesTotales ?? 0).toLocaleString("es-GT")}
              icon={<Layers className="size-4" />}
            />
            <SummaryCard
              title="Variantes con stock"
              value={(resumen?.variantesConStock ?? 0).toLocaleString("es-GT")}
              icon={<Package className="size-4" />}
            />
            <SummaryCard
              title="Sin costo (con stock)"
              value={(resumen?.variantesSinCosto ?? 0).toLocaleString("es-GT")}
              accent="rojo"
              icon={<AlertTriangle className="size-4" />}
            />
            <SummaryCard
              title="Sin precio (con stock)"
              value={(resumen?.variantesSinPrecio ?? 0).toLocaleString("es-GT")}
              accent="advertencia"
              icon={<Percent className="size-4" />}
            />
          </div>

          <InventarioValorizacionCharts
            porCategoria={porCategoria}
            porMarca={porMarca}
            rangosCosto={rangosCosto}
          />

          <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
            <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
              <h3 className="text-sm font-bold text-(--color-texto-principal)">
                Top 15 por capital
              </h3>
              <p className="text-xs text-(--color-gris-letra) mt-0.5">
                Variantes que concentran más valor a costo
              </p>
            </div>
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={thClass}>#</TableHead>
                    <TableHead className={thClass}>Producto</TableHead>
                    <TableHead className={`${thClass} text-right`}>Stock</TableHead>
                    <TableHead className={`${thClass} text-right`}>Costo u.</TableHead>
                    <TableHead className={`${thClass} text-right`}>Capital</TableHead>
                    <TableHead className={`${thClass} text-right`}>Venta pot.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-(--color-gris-letra)"
                      >
                        Sin datos de capital.
                      </TableCell>
                    </TableRow>
                  ) : (
                    top.map((row, idx) => (
                      <TableRow
                        key={row.idVariante}
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
                          {row.stockTotal.toLocaleString("es-GT")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtQ(row.costoUnitarioValuado)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {fmtQ(row.valorCostoTotal)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtQ(row.valorVentaTotal)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCriterioDebounced(String(criterio ?? "").trim());
            setPage(1);
          }}
          className="flex flex-col gap-1.5 min-w-[220px] flex-1"
        >
          <label className="text-sm font-semibold text-(--color-gris-letra)">Buscar</label>
          <Input
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            placeholder="SKU, producto o variante…"
            className="h-9"
          />
        </form>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Categoría</label>
          <select
            value={idCategoria}
            onChange={(e) => setIdCategoria(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[150px]"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option
                key={c.idCategoria ?? c.IdCategoria}
                value={c.idCategoria ?? c.IdCategoria}
              >
                {c.nombre ?? c.Nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Marca</label>
          <select
            value={idMarca}
            onChange={(e) => setIdMarca(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[150px]"
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m.idMarca} value={m.idMarca}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Orden</label>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[160px]"
          >
            {ORDENES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 h-9 text-sm font-semibold text-(--color-gris-letra) cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloSinCosto}
            onChange={(e) => setSoloSinCosto(e.target.checked)}
            className="size-4 rounded border-(--color-gris-claro-2)"
          />
          Solo sin costo
        </label>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Detalle valorizado por variante
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Auditoría de capital · paginado en servidor
          </p>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Producto</TableHead>
                <TableHead className={thClass}>SKU</TableHead>
                <TableHead className={thClass}>Categoría</TableHead>
                <TableHead className={`${thClass} text-right`}>Stock</TableHead>
                <TableHead className={`${thClass} text-right`}>Costo u.</TableHead>
                <TableHead className={`${thClass} text-right`}>Capital</TableHead>
                <TableHead className={`${thClass} text-right`}>Venta pot.</TableHead>
                <TableHead className={`${thClass} text-right`}>Margen</TableHead>
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
              ) : listQ.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-red-700">
                    {getApiErrorMessage(listQ.error, "No se pudo cargar el listado.")}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-(--color-gris-letra)">
                    No hay variantes con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => {
                  const sinCosto = row.valorCostoTotal <= 0 && row.stockTotal > 0;
                  return (
                    <TableRow
                      key={row.idVariante}
                      className="hover:bg-(--color-pagina-4)/40"
                    >
                      <TableCell>
                        <div className="font-medium text-sm leading-snug">
                          {row.productoNombre}
                        </div>
                        {row.varianteNombre ? (
                          <div className="text-xs text-(--color-gris-letra)">
                            {row.varianteNombre}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.sku || "—"}</TableCell>
                      <TableCell>{row.categoriaNombre || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {row.stockTotal.toLocaleString("es-GT")}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          sinCosto && "text-amber-700"
                        )}
                      >
                        {sinCosto ? "Sin costo" : fmtQ(row.costoUnitarioValuado)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          sinCosto && "text-amber-700"
                        )}
                      >
                        {fmtQ(row.valorCostoTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtQ(row.valorVentaTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700">
                        {fmtQ(row.margenPotencial)}
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
    </div>
  );
}

function SeccionNivelesStock() {
  const [page, setPage] = useState(1);
  const [estadoStock, setEstadoStock] = useState("TODOS");
  const [tipoGrafica, setTipoGrafica] = useState("barras");
  const [isExporting, setIsExporting] = useState(false);

  const filtros = { estadoStock };
  const listQ = useReporteInventarioQuery({ page, pageSize: 20, ...filtros });
  const resumenQ = useResumenInventarioQuery(filtros);

  const items = listQ.data?.items ?? [];
  const resumen = resumenQ.data?.resumen ?? listQ.data?.resumen;
  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * 20 + 1;
  const to = Math.min(page * 20, totalRegistros);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const reporte = await fetchNivelesStockExportar();
      const itemsFiltrados = reporte.items.filter((item) => {
        if (filtros.estadoStock !== "TODOS") {
          const estadoLocal = normalizarEstadoStock(item.nivelStock);
          return normalizarEstadoStock(filtros.estadoStock) === estadoLocal;
        }
        return true;
      });

      await generarInformeNivelStockPdf({
        fecha: reporte.fecha,
        items: itemsFiltrados,
      });
    } catch (e) {
      window.alert(getApiErrorMessage(e, "No se pudo generar el PDF del reporte."));
    } finally {
      setIsExporting(false);
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
          disabled={isExporting}
          className="bg-(--color-pagina-2) hover:opacity-90 text-(--color-blanco) font-semibold gap-2"
        >
          <Download className="size-4" />
          {isExporting ? "Exportando…" : "Exportar reporte"}
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

      {!isLoading && !error ? (
        <InventarioStockChart
          resumen={resumen}
          tipo={tipoGrafica}
          onTipoChange={setTipoGrafica}
        />
      ) : null}

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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {row.urlImagen ? (
                          <img
                            src={`${API_BASE_URL}${row.urlImagen}`}
                            alt={row.producto}
                            className="w-8 h-8 rounded object-cover border border-slate-200 bg-white shrink-0"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-(--color-pagina-3) flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-(--color-pagina)/40" />
                          </div>
                        )}
                        <span>{row.producto || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.sku || "—"}</TableCell>
                    <TableCell className="text-sm text-(--color-gris-letra)">
                      {[row.color, row.talla].filter(Boolean).join(" / ") || "—"}
                    </TableCell>
                    <TableCell>{row.categoria || "—"}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {row.stockActual}
                    </TableCell>
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
}

const ReporteInventarioPanel = () => {
  const [vista, setVista] = useState("capital");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 p-1 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm w-fit">
        <button
          type="button"
          onClick={() => setVista("capital")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            vista === "capital"
              ? "bg-(--color-pagina) text-white"
              : "text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
          )}
        >
          Capital / valorización
        </button>
        <button
          type="button"
          onClick={() => setVista("niveles")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            vista === "niveles"
              ? "bg-(--color-pagina) text-white"
              : "text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
          )}
        >
          Niveles de stock
        </button>
      </div>

      {vista === "capital" ? <SeccionCapital /> : <SeccionNivelesStock />}
    </div>
  );
};

export default ReporteInventarioPanel;
