import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AlertTriangle, ArrowLeft, FileDown } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useNivelesStockQuery } from "@/hooks/queries/useNivelesStockQueries";
import { fetchNivelesStockExportar } from "@/services/nivelesStockService";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  buildVarianteStockDetalle,
  normalizarEstadoStock,
} from "@/lib/nivelesStockMappers";
import { Skeleton } from "@/components/ui/skeleton";
import { generarInformeNivelStockPdf } from "@/lib/pdfExport";

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const SIDEBAR_COLOR_HEX = "#E8307E";



const ReporteStock = () => {
  const navigate = useNavigate();
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [proveedorFiltro, setProveedorFiltro] = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportError, setExportError] = useState("");
  const nivelesStockQ = useNivelesStockQuery();
  const tablaLoading = nivelesStockQ.isLoading || nivelesStockQ.isFetching;

  useEffect(() => {
    setTitulo("Niveles de Stock");
  }, [setTitulo]);

  const nivelesStock = nivelesStockQ.data ?? [];
  const data = useMemo(
    () =>
      nivelesStock.filter((item) => {
        const coincideProveedor =
          proveedorFiltro === "todos" || item.proveedor === proveedorFiltro;
        const coincideEstado =
          estadoFiltro === "todos" ||
          normalizarEstadoStock(item.nivelStock) === estadoFiltro;
        return coincideProveedor && coincideEstado;
      }),
    [nivelesStock, proveedorFiltro, estadoFiltro]
  );

  const generarPDF = async () => {
    setExportandoPdf(true);
    setExportError("");

    try {
      const reporte = await fetchNivelesStockExportar();
      const itemsFiltrados = reporte.items.filter((item) => {
        const coincideProveedor =
          proveedorFiltro === "todos" || item.proveedor === proveedorFiltro;
        const coincideEstado =
          estadoFiltro === "todos" ||
          normalizarEstadoStock(item.nivelStock) === estadoFiltro;
        return coincideProveedor && coincideEstado;
      });

      await generarInformeNivelStockPdf({
        fecha: reporte.fecha,
        items: itemsFiltrados,
      });
    } catch (error) {
      console.error("[ReporteStock] Error al generar informe PDF:", error);
      setExportError(
        getApiErrorMessage(error, "No se pudo generar el informe de nivel de stock.")
      );
    } finally {
      setExportandoPdf(false);
    }
  };

  const totalCritico = nivelesStock.filter(
    (item) => normalizarEstadoStock(item.nivelStock) === "critico"
  ).length;
  const totalAdvertencia = nivelesStock.filter(
    (item) => normalizarEstadoStock(item.nivelStock) === "advertencia"
  ).length;
  const proveedores = [...new Set(nivelesStock.map((item) => item.proveedor).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>

          <button
            onClick={generarPDF}
            disabled={tablaLoading || exportandoPdf}
            className="flex items-center gap-2 bg-(--color-pagina-2) text-white px-5 py-2 rounded-xl hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown className="w-4 h-4" />
            {exportandoPdf ? "Generando..." : "Generar reporte"}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>CRITICO {totalCritico} items</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Advertencia {totalAdvertencia} items</span>
          </div>

          <select
            value={proveedorFiltro}
            onChange={(e) => setProveedorFiltro(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="todos">Por proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor} value={proveedor}>{proveedor}</option>
            ))}
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="p-2 border rounded-lg text-sm"
          >
            <option value="todos">Por estado de stock</option>
            <option value="critico">Critico</option>
            <option value="advertencia">Advertencia</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {exportError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {exportError}
        </div>
      )}

      <div
        className="h-1 w-full rounded-full"
        style={{ backgroundColor: SIDEBAR_COLOR_HEX }}
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3 uppercase">PRODUCTO & VARIANTES</th>
              <th className="p-3 uppercase">NIVEL DE STOCK</th>
              <th className="p-3 uppercase">STOCK MIN</th>
              <th className="p-3 uppercase">STOCK ACTUAL</th>
              <th className="p-3 uppercase">PROVEEDOR</th>
            </tr>
          </thead>

          <tbody>
            {tablaLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`stock-skeleton-${index}`} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="p-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                </tr>
              ))
            ) : nivelesStockQ.isError ? (
              <tr className="border-t">
                <td colSpan={5} className="p-6 text-center text-red-600">
                  {nivelesStockQ.error?.message || "No se pudieron cargar los niveles de stock."}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr className="border-t">
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No hay productos para los filtros seleccionados.
                </td>
              </tr>
            ) : data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imagen || PRODUCT_IMAGE_PLACEHOLDER}
                      alt="Imagen del producto"
                      className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-gray-300 bg-gray-50 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{item.producto}</div>
                      <div className="text-xs text-gray-500">
                        {buildVarianteStockDetalle(item).join(" / ")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3">{item.nivelStock}</td>
                <td className="p-3">{item.stockMin ?? "-"}</td>
                <td className="p-3">{item.stockActual ?? 0}</td>
                <td className="p-3">{item.proveedor || "Sin proveedor"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReporteStock;
