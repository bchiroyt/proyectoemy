import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Briefcase, Loader2, Ban, BadgeCheck, Pencil, Search, Download } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import {
  useAnularCotizacionMutation,
  useCotizacionesHistorialQuery,
} from "@/hooks/queries/useCotizacionQueries";
import { etiquetaEstadoCotizacion } from "@/lib/cotizacionMappers";
import { fmtQ } from "@/lib/cajaMappers";
import { getApiErrorMessage } from "@/lib/apiClient";
import { generarDetalleCotizacionPdf } from "@/lib/pdfExport";
import { fetchCotizacionPorId } from "@/services/cotizacionService";
import Toast from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import ModalConfirmacion from "@/pages/inventario/components/ModalConfirmacion";
import Paginacion from "@/components/shared/Paginacion";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";

/** Tabs de Mayoreo → estado del API (o sin filtro). */
function estadoApiDesdeFiltro(filtroEstado) {
  if (filtroEstado === "ANULADOS") return "ANULADA";
  if (filtroEstado === "COTIZACIONES") return "PENDIENTE";
  return undefined;
}

function formatearFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-GT", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function getBadgeClasses(estado) {
  const valor = String(estado ?? "").trim().toUpperCase();
  if (valor === "PENDIENTE") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (valor === "CONVERTIDA") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (valor === "ANULADA") return "bg-rose-100 text-rose-800 border border-rose-200";
  if (valor === "VENCIDA") return "bg-slate-100 text-slate-700 border border-slate-200";
  return "bg-gray-100 text-gray-800 border border-gray-200";
}

export default function Mayoreo() {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [cotizacionAAnular, setCotizacionAAnular] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [criterioDebounced, setCriterioDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [exportandoId, setExportandoId] = useState(null);
  const PAGE_SIZE = 10;

  const cotizacionesQ = useCotizacionesHistorialQuery({
    page,
    pageSize: PAGE_SIZE,
    estado: estadoApiDesdeFiltro(filtroEstado),
    criterio: criterioDebounced || undefined,
  });
  const anularM = useAnularCotizacionMutation();

  useEffect(() => {
    setTitulo("Mayoreo y Cotizaciones");
  }, [setTitulo]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCriterioDebounced(String(busqueda ?? "").trim());
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    setPage(1);
  }, [criterioDebounced]);

  const handleAnularClick = (cotizacion) => {
    setCotizacionAAnular(cotizacion);
  };

  const handleAnularConfirmado = async () => {
    if (!cotizacionAAnular) return;
    try {
      await anularM.mutateAsync(cotizacionAAnular.idCotizacion);
      setCotizacionAAnular(null);
      setToast({ open: true, message: "Cotización anulada", type: "success" });
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Error al anular la cotización."),
        type: "error",
      });
    }
  };

  const handleFiltroEstadoChange = (estado) => {
    setFiltroEstado(estado);
    setPage(1);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleExportPdfCotizacion = async (idCotizacion) => {
    setExportandoId(idCotizacion);
    try {
      const res = await fetchCotizacionPorId(idCotizacion);
      const cotizacion = res?.data;
      if (!cotizacion) {
        throw new Error("No se encontró la cotización.");
      }
      await generarDetalleCotizacionPdf(cotizacion);
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "No se pudo generar el PDF de la cotización."),
        type: "error",
      });
    } finally {
      setExportandoId(null);
    }
  };

  const items = cotizacionesQ.data?.items ?? [];
  const totalRecords = cotizacionesQ.data?.totalCount ?? 0;
  const totalPages = Math.max(1, cotizacionesQ.data?.totalPages ?? 1);
  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRecords);

  return (
    <div className="flex flex-col h-full bg-(--color-pos-fondo) p-4 md:p-6 gap-6">

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-(--color-blanco) p-4 rounded-xl border border-(--color-pos-borde-suave) shadow-sm">
        <div className="flex gap-2 flex-wrap">
          <Button asChild className="bg-(--color-pagina) hover:bg-(--color-pagina-hover) text-(--color-blanco)">
            <Link to="/mayoreo/nueva">
              <Plus className="size-4 mr-2" />
              Nueva cotización
            </Link>
          </Button>
        </div>


        {/* Filtro de estado */}
        <div className="flex p-1 bg-(--color-pos-fondo) rounded-lg gap-1 border border-(--color-pos-borde-suave) w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => handleFiltroEstadoChange("TODOS")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filtroEstado === "TODOS"
              ? "bg-(--color-pagina) text-(--color-blanco) shadow-sm"
              : "text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleFiltroEstadoChange("COTIZACIONES")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filtroEstado === "COTIZACIONES"
              ? "bg-(--color-pagina) text-(--color-blanco) shadow-sm"
              : "text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
              }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => handleFiltroEstadoChange("ANULADOS")}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filtroEstado === "ANULADOS"
              ? "bg-(--color-pagina) text-(--color-blanco) shadow-sm"
              : "text-(--color-gris-letra) hover:bg-(--color-pagina-4)"
              }`}
          >
            Anulados
          </button>
        </div>

        {/* Buscador de Cliente / vendedor */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-(--color-gris-letra)" />
          <input
            type="text"
            placeholder="Buscar por cliente o vendedor..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full h-9 pl-9 pr-3 text-xs bg-(--color-pos-fondo) border border-(--color-pos-borde-suave) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-pagina) text-(--color-negro)"
          />
        </div>
      </div>

      <div className="flex-1 bg-(--color-blanco) rounded-xl shadow-sm border border-(--color-pos-borde-suave) overflow-hidden flex flex-col">
        {cotizacionesQ.isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-(--color-gris-letra)">
            <Loader2 className="size-8 animate-spin mb-3" />
            <p className="text-sm">Cargando historial de cotizaciones…</p>
          </div>
        ) : cotizacionesQ.isError ? (
          <div className="flex flex-1 items-center justify-center px-6 py-10">
            <EstadoErrorCarga
              error={cotizacionesQ.error}
              nombreModulo="Mayoreo / Cotizaciones"
              fallbackGenerico="No se pudo cargar el historial de cotizaciones."
              onReintentar={() => cotizacionesQ.refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 text-(--color-gris-letra)">
            <Briefcase className="size-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">
              {totalRecords === 0 && !criterioDebounced && filtroEstado === "TODOS"
                ? "No hay cotizaciones registradas"
                : "No se encontraron cotizaciones con los filtros actuales"}
            </p>
            {totalRecords === 0 && !criterioDebounced && filtroEstado === "TODOS" && (
              <Button asChild className="mt-4 bg-(--color-pagina) text-(--color-blanco)">
                <Link to="/mayoreo/nueva">Crear primera cotización</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-auto flex-1 flex flex-col justify-between">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-(--color-pagina-4) text-(--color-gris-letra) text-xs uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-3">NO.</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Emisión</th>
                    <th className="px-4 py-3">Vence</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-pos-borde-suave)">
                  {items.map((c, index) => {
                    const esPendiente = String(c.estado ?? "").toUpperCase() === "PENDIENTE";
                    const exportandoEsta = exportandoId === c.idCotizacion;
                    const numeroFila = from + index;

                    return (
                      <tr key={c.idCotizacion} className="hover:bg-(--color-pagina-4)/50">
                        <td className="px-4 py-3 font-semibold tabular-nums">{numeroFila}</td>
                        <td className="px-4 py-3">{c.nombreCliente || "—"}</td>
                        <td className="px-4 py-3 text-(--color-gris-letra)">{formatearFecha(c.fechaEmision)}</td>
                        <td className="px-4 py-3 text-(--color-gris-letra)">{formatearFecha(c.fechaVencimiento)}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">{fmtQ(c.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeClasses(c.estado)}`}>
                            {etiquetaEstadoCotizacion(c.estado)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2 flex-wrap min-h-8">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleExportPdfCotizacion(c.idCotizacion)}
                              disabled={exportandoId != null}
                              className="h-8 border-(--color-pagina) text-(--color-pagina)"
                            >
                              {exportandoEsta ? (
                                <Loader2 className="size-3.5 mr-1 animate-spin" />
                              ) : (
                                <Download className="size-3.5 mr-1" />
                              )}
                              PDF
                            </Button>
                            {esPendiente ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/mayoreo/${c.idCotizacion}/editar`)}
                                  className="h-8 border-(--color-pagina) text-(--color-pagina)"
                                >
                                  <Pencil className="size-3.5 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/mayoreo/${c.idCotizacion}/finalizar`)}
                                  className="bg-(--color-pagina-2) hover:bg-(--color-esmeralda-hover) text-(--color-blanco) h-8"
                                >
                                  <BadgeCheck className="size-3.5 mr-1" />
                                  Finalizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAnularClick(c)}
                                  disabled={anularM.isPending}
                                  className="h-8 text-(--color-rojo) border-(--color-rojo)/30 hover:bg-(--color-rojo-fondo)"
                                >
                                  <Ban className="size-3.5 mr-1" />
                                  Anular
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-(--color-pos-borde-suave) p-3 bg-(--color-blanco)">
              <Paginacion
                from={from}
                to={to}
                total={totalRecords}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                disablePrev={page <= 1}
                disableNext={page >= totalPages}
                isLoading={cotizacionesQ.isFetching}
              />
            </div>
          </div>
        )}
      </div>

      <ModalConfirmacion
        open={!!cotizacionAAnular}
        onClose={() => !anularM.isPending && setCotizacionAAnular(null)}
        onConfirm={handleAnularConfirmado}
        loading={anularM.isPending}
        titulo="¿Anular cotización?"
        mensaje={
          cotizacionAAnular
            ? `La cotización de ${cotizacionAAnular.nombreCliente || "cliente sin nombre"} (${fmtQ(cotizacionAAnular.total)}) quedará anulada. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Sí, anular"
        loadingLabel="Anulando..."
      />

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
