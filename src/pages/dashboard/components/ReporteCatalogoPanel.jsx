import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Layers,
  Package,
  PackageCheck,
  Tag,
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
import SummaryCard from "./SummaryCard";
import CatalogoCharts from "./CatalogoCharts";
import {
  useReporteCatalogoResumenQuery,
  useReporteCatalogoVariantesQuery,
} from "@/hooks/queries/useReportesQueries";
import { obtenerCategorias } from "@/services/categorias";
import { obtenerMarcas } from "@/services/marcas";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fmtQ } from "@/lib/cajaMappers";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const thClass =
  "text-[11px] uppercase font-bold text-(--color-gris-letra) bg-(--color-pagina-4) sticky top-0";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
  { value: "BORRADOR", label: "Borrador" },
];

const estadoBadgeClass = (estado) => {
  const e = String(estado ?? "").trim().toUpperCase();
  if (e === "ACTIVO") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (e === "INACTIVO") return "bg-slate-100 text-slate-600 border-slate-200";
  if (e === "BORRADOR") return "bg-amber-50 text-amber-800 border-amber-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

function fmtPct(valor) {
  const n = Number(valor) || 0;
  const pct = n > 0 && n <= 1 ? n * 100 : n;
  return `${pct.toLocaleString("es-GT", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
}

const ReporteCatalogoPanel = () => {
  const [page, setPage] = useState(1);
  const [criterio, setCriterio] = useState("");
  const [criterioDebounced, setCriterioDebounced] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idMarca, setIdMarca] = useState("");
  const [estado, setEstado] = useState("");
  const [soloSinPrecio, setSoloSinPrecio] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);

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
  }, [criterioDebounced, idCategoria, idMarca, estado, soloSinPrecio]);

  const resumenQ = useReporteCatalogoResumenQuery();
  const listQ = useReporteCatalogoVariantesQuery({
    page,
    pageSize: PAGE_SIZE,
    criterio: criterioDebounced || undefined,
    idCategoria: idCategoria || undefined,
    idMarca: idMarca || undefined,
    estado: estado || undefined,
    soloSinPrecio: soloSinPrecio ? true : undefined,
  });

  const resumen = resumenQ.data?.resumen;
  const porCategoria = resumenQ.data?.porCategoria ?? [];
  const porMarca = resumenQ.data?.porMarca ?? [];
  const rangosPrecio = resumenQ.data?.rangosPrecio ?? [];

  const items = listQ.data?.items ?? [];
  const totalRegistros = listQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, listQ.data?.totalPages ?? 1);
  const from = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRegistros);

  const handleBuscar = (e) => {
    e.preventDefault();
    setCriterioDebounced(String(criterio ?? "").trim());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {resumenQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : resumenQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(
            resumenQ.error,
            "No se pudo cargar el resumen del catálogo."
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              title="Productos"
              value={(resumen?.totalProductos ?? 0).toLocaleString("es-GT")}
              icon={<Package className="size-4" />}
            />
            <SummaryCard
              title="Variantes"
              value={(resumen?.totalVariantes ?? 0).toLocaleString("es-GT")}
              icon={<Layers className="size-4" />}
            />
            <SummaryCard
              title="Activas"
              value={(resumen?.activos ?? 0).toLocaleString("es-GT")}
              accent="pagina2"
              icon={<PackageCheck className="size-4" />}
            />
            <SummaryCard
              title="Inactivas"
              value={(resumen?.inactivos ?? 0).toLocaleString("es-GT")}
              accent="rojo"
              icon={<Ban className="size-4" />}
            />
            <SummaryCard
              title="Sin precio menudeo"
              value={(resumen?.sinPrecioMenudeo ?? 0).toLocaleString("es-GT")}
              accent="advertencia"
              icon={<AlertTriangle className="size-4" />}
            />
            <SummaryCard
              title="Sin precio mayoreo"
              value={(resumen?.sinPrecioMayoreo ?? 0).toLocaleString("es-GT")}
              accent="advertencia"
              icon={<Tag className="size-4" />}
            />
          </div>

          <CatalogoCharts
            porCategoria={porCategoria}
            porMarca={porMarca}
            rangosPrecio={rangosPrecio}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
              <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
                <h3 className="text-sm font-bold text-(--color-texto-principal)">
                  Por categoría
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[240px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>Categoría</TableHead>
                      <TableHead className={`${thClass} text-right`}>Cant.</TableHead>
                      <TableHead className={`${thClass} text-right`}>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porCategoria.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-(--color-gris-letra)"
                        >
                          Sin datos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porCategoria.map((row, idx) => (
                        <TableRow
                          key={row.categoriaId ?? idx}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-medium text-sm">
                            {row.categoriaNombre}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidad.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-(--color-gris-letra)">
                            {fmtPct(row.porcentaje)}
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
                  Por marca
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[240px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className={thClass}>Marca</TableHead>
                      <TableHead className={`${thClass} text-right`}>Cant.</TableHead>
                      <TableHead className={`${thClass} text-right`}>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porMarca.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-(--color-gris-letra)"
                        >
                          Sin datos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      porMarca.map((row, idx) => (
                        <TableRow
                          key={row.marcaId ?? idx}
                          className="hover:bg-(--color-pagina-4)/40"
                        >
                          <TableCell className="font-medium text-sm">
                            {row.marcaNombre}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.cantidad.toLocaleString("es-GT")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-(--color-gris-letra)">
                            {fmtPct(row.porcentaje)}
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

      <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm">
        <form onSubmit={handleBuscar} className="flex flex-col gap-1.5 min-w-[220px] flex-1">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Buscar</label>
          <div className="flex gap-2">
            <Input
              value={criterio}
              onChange={(e) => setCriterio(e.target.value)}
              placeholder="SKU, producto, variante o código…"
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-(--color-gris-letra)">Categoría</label>
          <select
            value={idCategoria}
            onChange={(e) => setIdCategoria(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[160px]"
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
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[160px]"
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
          <label className="text-sm font-semibold text-(--color-gris-letra)">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="h-9 rounded-lg border border-(--color-gris-claro-2) px-3 text-sm min-w-[140px]"
          >
            {ESTADOS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 h-9 text-sm font-semibold text-(--color-gris-letra) cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloSinPrecio}
            onChange={(e) => setSoloSinPrecio(e.target.checked)}
            className="size-4 rounded border-(--color-gris-claro-2)"
          />
          Solo sin precio
        </label>
      </div>

      <div className="rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm overflow-hidden">
        <div className="border-b border-(--color-gris-claro-2) bg-(--color-gris-fondo)/30 px-4 py-3">
          <h3 className="text-sm font-bold text-(--color-texto-principal)">
            Catálogo por variante
          </h3>
          <p className="text-xs text-(--color-gris-letra) mt-0.5">
            Precios menudeo / mayoreo · paginado en servidor
          </p>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={thClass}>Producto / Variante</TableHead>
                <TableHead className={thClass}>SKU</TableHead>
                <TableHead className={thClass}>Categoría</TableHead>
                <TableHead className={thClass}>Marca</TableHead>
                <TableHead className={`${thClass} text-right`}>Menudeo</TableHead>
                <TableHead className={`${thClass} text-right`}>Mayoreo</TableHead>
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
                    {getApiErrorMessage(listQ.error, "No se pudo cargar el catálogo.")}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-(--color-gris-letra)">
                    No hay variantes con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => {
                  const sinMenudeo =
                    row.precioMenudeo == null || Number(row.precioMenudeo) === 0;
                  const sinMayoreo =
                    row.precioMayoreo == null || Number(row.precioMayoreo) === 0;
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
                      <TableCell className="font-mono text-xs">
                        {row.sku || "—"}
                      </TableCell>
                      <TableCell>{row.categoriaNombre || "—"}</TableCell>
                      <TableCell>{row.marcaNombre || "—"}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-bold tabular-nums",
                          sinMenudeo && "text-amber-700"
                        )}
                      >
                        {sinMenudeo ? "Sin precio" : fmtQ(row.precioMenudeo)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          sinMayoreo && "text-amber-700"
                        )}
                      >
                        {sinMayoreo ? "Sin precio" : fmtQ(row.precioMayoreo)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-semibold border",
                            estadoBadgeClass(row.estadoCatalogo)
                          )}
                        >
                          {row.estadoCatalogo || "—"}
                        </span>
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
};

export default ReporteCatalogoPanel;
