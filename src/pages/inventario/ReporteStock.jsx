import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AlertTriangle, ArrowLeft, FileDown } from "lucide-react";
import logoImg from "@/assets/tran1.png";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useNivelesStockQuery } from "@/hooks/queries/useNivelesStockQueries";
import { fetchNivelesStockExportar } from "@/services/nivelesStockService";
import { getApiErrorMessage } from "@/lib/apiClient";
import {
  buildVarianteStockDetalle,
  normalizarEstadoStock,
} from "@/lib/nivelesStockMappers";
import { Skeleton } from "@/components/ui/skeleton";

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const SIDEBAR_COLOR = [232, 48, 126];
const SIDEBAR_COLOR_HEX = "#E8307E";
const GRAY_LIGHT = [156, 163, 175];
const GRAY_TEXT = [107, 114, 128];

const cargarImagenComoDataUrl = async (src) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error("No se pudo cargar el logo del reporte.");
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const formatearFechaReporte = (valor) => {
  if (!valor) return "Fecha no disponible";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildVarianteReporte = (item) => {
  const talla = String(item?.talla ?? "").trim();
  const color = String(item?.color ?? "").trim();
  const presentacion = String(item?.presentacion ?? "").trim();
  return [talla || presentacion, color].filter(Boolean).join(" / ") || "Sin variante";
};

const generarInformeNivelStockPdf = async ({ fecha, items }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const fechaTexto = formatearFechaReporte(fecha);

  try {
    const logoDataUrl = await cargarImagenComoDataUrl(logoImg);
    doc.addImage(logoDataUrl, "PNG", marginX, 10, 28, 20);
  } catch (error) {
    console.warn("[ReporteStock] No se pudo insertar el logo en el PDF:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("MODA Y VARIEDADES EMY", 47, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Sistema de Gestion de inventario", 47, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("INFORME DE NIVEL DE STOCK", pageWidth - marginX, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text(fechaTexto, pageWidth - marginX, 24, { align: "right" });

  doc.setDrawColor(...SIDEBAR_COLOR);
  doc.setLineWidth(1);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  autoTable(doc, {
    startY: 43,
    margin: { left: marginX, right: marginX },
    head: [[
      "PRODUCTO",
      "VARIANTE",
      "SKU",
      "CANTIDAD EXISTENTE",
      "STOCK ACTUAL",
      "STOCK MIN",
    ]],
    body: items.map((item) => [
      item.producto || "Producto",
      buildVarianteReporte(item),
      item.sku || "Sin registrar",
      item.cantidadExistente ?? item.stockActual ?? 0,
      item.stockActual ?? 0,
      item.stockMin ?? "-",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.4,
      overflow: "linebreak",
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 45 },
      2: { cellWidth: 38 },
      3: { cellWidth: 34, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_LIGHT);
      doc.text(
        `Pagina ${doc.internal.getNumberOfPages()}`,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  doc.save("informe_nivel_stock.pdf");
};

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
      const itemsFiltrados = reporte.items.filter((item) =>
        ["critico", "advertencia"].includes(normalizarEstadoStock(item.nivelStock))
      );

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
