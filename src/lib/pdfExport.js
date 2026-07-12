import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "@/assets/tran1.png";
import { buildVarianteDetalleTexto } from "@/lib/varianteUtils";

const GRAY_LIGHT = [156, 163, 175];
const GRAY_TEXT = [107, 114, 128];
const SIDEBAR_COLOR = [232, 48, 126];

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

const buildVarianteReporte = (item) => buildVarianteDetalleTexto(item, "Sin variante");

export const generarInformeNivelStockPdf = async ({ fecha, items }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const fechaTexto = formatearFechaReporte(fecha);

  try {
    const logoDataUrl = await cargarImagenComoDataUrl(logoImg);
    doc.addImage(logoDataUrl, "PNG", marginX, 10, 28, 20);
  } catch (error) {
    console.warn("[pdfExport] No se pudo insertar el logo en el PDF:", error);
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

export const generarDetalleCompraPdf = async (compra) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  const fmtQ = (n) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }).format(n);

  try {
    const logoDataUrl = await cargarImagenComoDataUrl(logoImg);
    doc.addImage(logoDataUrl, "PNG", marginX, 10, 28, 20);
  } catch (error) {
    console.warn("[pdfExport] No se pudo insertar el logo en el PDF:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text("MODA Y VARIEDADES EMY", 47, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Sistema de Gestión de Compras", 47, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("DETALLE DE COMPRA", pageWidth - marginX, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`Compra #${compra.id} - ${compra.estado}`, pageWidth - marginX, 23, { align: "right" });

  const fechaFormat = compra.fechaPedido
    ? new Date(String(compra.fechaPedido).slice(0, 10) + "T12:00:00").toLocaleDateString("es-GT")
    : "N/A";
  doc.text(`Fecha: ${fechaFormat}`, pageWidth - marginX, 28, { align: "right" });

  doc.setDrawColor(...SIDEBAR_COLOR);
  doc.setLineWidth(1);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  // Información del proveedor y referencias
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("Proveedor:", marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.text(compra.proveedor?.nombre || "N/A", marginX + 22, 42);

  doc.setFont("helvetica", "bold");
  doc.text("Referencia:", marginX, 48);
  doc.setFont("helvetica", "normal");
  doc.text(compra.numeroReferencia || "N/A", marginX + 22, 48);

  doc.setFont("helvetica", "bold");
  doc.text("Comprobante:", marginX, 54);
  doc.setFont("helvetica", "normal");
  doc.text(compra.tipoComprobante || "N/A", marginX + 26, 54);

  const esRecibida = compra.estado === "Recibido";

  const filasDetalle = compra.items.map((item) => {
    const producto = [item.productoVariante, item.detalleColorTalla]
      .filter(Boolean)
      .join("\n") || "\u2014";
    const atributos = [
      item.presentacion ? "Presentaci\u00f3n: " + item.presentacion : null,
      item.atributosAdicionales ? "Atributos: " + item.atributosAdicionales : null,
    ]
      .filter(Boolean)
      .join("\n") || "\u2014";

    return [
      producto,
      atributos,
      item.codigo || "\u2014",
      String(item.cantidad ?? 0),
      fmtQ(item.precioUnitario),
      item.precioFinal == null ? "\u2014" : fmtQ(item.precioFinal),
      fmtQ(item.total ?? (item.cantidad * (item.precioFinal ?? item.precioUnitario))),
    ];
  });

  autoTable(doc, {
    startY: 60,
    margin: { left: marginX, right: marginX },
    head: [[
      "PRODUCTO / VARIANTE",
      "ATRIBUTOS",
      "CÓDIGO",
      "CANTIDAD",
      "P. UNIT.",
      "FINAL",
      "TOTAL"
    ]],
    body: filasDetalle,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 62 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 28, halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable.finalY || 60;
  
  const subtotal = compra.items.reduce((acc, it) => acc + (it.total ?? (it.cantidad * (it.precioFinal ?? it.precioUnitario))), 0);
  const total = esRecibida && Number(compra.total) > 0 ? Number(compra.total) : subtotal;

  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", pageWidth - marginX - 40, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(fmtQ(subtotal), pageWidth - marginX, finalY + 10, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total:", pageWidth - marginX - 40, finalY + 18);
  doc.text(fmtQ(total), pageWidth - marginX, finalY + 18, { align: "right" });

  if (compra.notasProveedor) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Notas del proveedor:", marginX, finalY + 10);
    doc.setFont("helvetica", "normal");
    const splitNotas = doc.splitTextToSize(compra.notasProveedor, 100);
    doc.text(splitNotas, marginX, finalY + 15);
  }

  doc.save(`detalle_compra_${compra.id}.pdf`);
};
