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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
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

  const fechaFormat = compra.fechaPedido ? new Date(compra.fechaPedido + "T12:00:00").toLocaleDateString("es-GT") : "N/A";
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

  autoTable(doc, {
    startY: 60,
    margin: { left: marginX, right: marginX },
    head: [[
      "DESCRIPCIÓN",
      "VARIANTE",
      "SKU",
      "CANTIDAD",
      "PRECIO U.",
      "TOTAL"
    ]],
    body: compra.items.map((item) => [
      item.descripcion || "—",
      [item.color, item.talla].filter(Boolean).join(" / ") || "—",
      item.sku || "—",
      item.cantidad?.toString() || "0",
      fmtQ(item.precioUnitario),
      fmtQ(item.totalLinea ?? (item.cantidad * item.precioUnitario))
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
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
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable.finalY || 60;
  
  const subtotal = compra.items.reduce((acc, it) => acc + (it.totalLinea ?? (it.cantidad * it.precioUnitario)), 0);
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

const fmtQPdf = (n) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);

const fechaArchivoDesde = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return "sin-fecha";
  return d.toISOString().slice(0, 10);
};

const dibujarEncabezadoInformeInventario = async (doc, { titulo, fechaTexto }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

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
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(titulo, pageWidth - marginX, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text(fechaTexto, pageWidth - marginX, 24, { align: "right" });

  doc.setDrawColor(...SIDEBAR_COLOR);
  doc.setLineWidth(1);
  doc.line(marginX, 32, pageWidth - marginX, 32);
};

/**
 * Resumen de capital en inventario (KPIs + top variantes).
 * Sin el detalle completo por variante.
 */
export const generarInformeValorizacionInventarioPdf = async ({
  fecha = new Date(),
  resumen = {},
  topVariantes = [],
} = {}) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const fechaTexto = formatearFechaReporte(fecha);
  const fechaArchivo = fechaArchivoDesde(fecha);

  await dibujarEncabezadoInformeInventario(doc, {
    titulo: "INFORME DE CAPITAL EN INVENTARIO",
    fechaTexto,
  });

  if (resumen.metodoValuacion) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`Metodo de calculo: ${resumen.metodoValuacion}`, marginX, 38);
  }

  autoTable(doc, {
    startY: 42,
    margin: { left: marginX, right: marginX },
    head: [["INDICADOR", "VALOR"]],
    body: [
      ["Capital a costo (mercancia)", fmtQPdf(resumen.valorCostoTotal)],
      ["Valor potencial menudeo", fmtQPdf(resumen.valorVentaMenudeoTotal)],
      ["Valor potencial mayoreo", fmtQPdf(resumen.valorVentaMayoreoTotal)],
      ["Margen potencial", fmtQPdf(resumen.margenPotencial)],
      [
        "Unidades en stock",
        Number(resumen.unidadesTotales ?? 0).toLocaleString("es-GT"),
      ],
      [
        "Variantes con stock",
        Number(resumen.variantesConStock ?? 0).toLocaleString("es-GT"),
      ],
      [
        "Sin costo (con stock)",
        Number(resumen.variantesSinCosto ?? 0).toLocaleString("es-GT"),
      ],
      [
        "Sin precio (con stock)",
        Number(resumen.variantesSinPrecio ?? 0).toLocaleString("es-GT"),
      ],
    ],
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 50, halign: "right" },
    },
    tableWidth: 120,
  });

  const afterKpisY = (doc.lastAutoTable?.finalY ?? 42) + 8;
  const top = Array.isArray(topVariantes) ? topVariantes.slice(0, 15) : [];

  if (top.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text("Productos con mayor capital (Top 15)", marginX, afterKpisY);

    autoTable(doc, {
      startY: afterKpisY + 3,
      margin: { left: marginX, right: marginX },
      head: [
        [
          "#",
          "PRODUCTO",
          "VARIANTE",
          "SKU",
          "STOCK",
          "COSTO U.",
          "CAPITAL",
          "VENTA POT.",
        ],
      ],
      body: top.map((row, idx) => [
        String(idx + 1),
        row.productoNombre || "—",
        row.varianteNombre || "—",
        row.sku || "—",
        Number(row.stockTotal ?? 0).toLocaleString("es-GT"),
        fmtQPdf(row.costoUnitarioValuado),
        fmtQPdf(row.valorCostoTotal),
        fmtQPdf(row.valorVentaTotal),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 1.8,
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
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 48 },
        2: { cellWidth: 36 },
        3: { cellWidth: 28 },
        4: { cellWidth: 18, halign: "right" },
        5: { cellWidth: 28, halign: "right" },
        6: { cellWidth: 30, halign: "right" },
        7: { cellWidth: 30, halign: "right" },
      },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.setTextColor(...GRAY_LIGHT);
        doc.text(
          `Pagina ${doc.internal.getNumberOfPages()} · Informe de capital ${fechaArchivo}`,
          pageWidth - marginX,
          doc.internal.pageSize.getHeight() - 8,
          { align: "right" }
        );
      },
    });
  } else {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_LIGHT);
    doc.text(
      `Pagina ${doc.internal.getNumberOfPages()} · Informe de capital ${fechaArchivo}`,
      pageWidth - marginX,
      doc.internal.pageSize.getHeight() - 8,
      { align: "right" }
    );
  }

  doc.save(`informe_capital_inventario_${fechaArchivo}.pdf`);
};

/**
 * Detalle completo del capital por variante (PDF aparte).
 */
export const generarInformeDetalleValorizadoVariantesPdf = async ({
  fecha = new Date(),
  variantes = [],
} = {}) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const fechaTexto = formatearFechaReporte(fecha);
  const fechaArchivo = fechaArchivoDesde(fecha);
  const detalle = Array.isArray(variantes) ? variantes : [];

  await dibujarEncabezadoInformeInventario(doc, {
    titulo: "DETALLE DE CAPITAL POR PRODUCTO",
    fechaTexto,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `Listado de variantes con existencia · ${detalle.length.toLocaleString("es-GT")} registro(s)`,
    marginX,
    38
  );

  if (detalle.length === 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("No hay variantes con stock para mostrar.", marginX, 50);
    doc.save(`detalle_capital_por_producto_${fechaArchivo}.pdf`);
    return;
  }

  autoTable(doc, {
    startY: 42,
    margin: { left: marginX, right: marginX },
    head: [
      [
        "PRODUCTO",
        "VARIANTE",
        "SKU",
        "CATEGORIA",
        "STOCK",
        "COSTO U.",
        "CAPITAL",
        "VENTA POT.",
        "MARGEN",
      ],
    ],
    body: detalle.map((row) => [
      row.productoNombre || "—",
      row.varianteNombre || "—",
      row.sku || "—",
      row.categoriaNombre || "—",
      Number(row.stockTotal ?? 0).toLocaleString("es-GT"),
      fmtQPdf(row.costoUnitarioValuado),
      fmtQPdf(row.valorCostoTotal),
      fmtQPdf(row.valorVentaTotal),
      fmtQPdf(row.margenPotencial),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 1.6,
      overflow: "linebreak",
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 24 },
      3: { cellWidth: 28 },
      4: { cellWidth: 16, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 24, halign: "right" },
    },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_LIGHT);
      doc.text(
        `Pagina ${doc.internal.getNumberOfPages()} · Detalle de capital ${fechaArchivo}`,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  doc.save(`detalle_capital_por_producto_${fechaArchivo}.pdf`);
};

const formatearFechaSolo = (valor) => {
  if (!valor) return "—";
  const s = String(valor).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Informe de operaciones de caja del período (sumas/restas).
 * Sin listado de sesiones/cajas.
 */
export const generarInformeCajaPeriodoPdf = async ({
  fechaDesde,
  fechaHasta,
  resumen = {},
} = {}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const generadoTexto = formatearFechaReporte(new Date());
  const desdeTxt = formatearFechaSolo(fechaDesde ?? resumen.fechaDesde);
  const hastaTxt = formatearFechaSolo(fechaHasta ?? resumen.fechaHasta);
  const rangoArchivo = `${String(fechaDesde ?? resumen.fechaDesde ?? "sin").slice(0, 10)}_${String(fechaHasta ?? resumen.fechaHasta ?? "sin").slice(0, 10)}`;

  const ventas = Number(resumen.ventasEfectivo ?? 0);
  const ingresos = Number(resumen.ingresosManuales ?? 0);
  const reembolsos = Number(resumen.reembolsosEfectivo ?? 0);
  const egresos = Number(resumen.egresosManuales ?? 0);
  const totalEntradas = ventas + ingresos;
  const totalSalidas = reembolsos + egresos;
  const balanceNeto = totalEntradas - totalSalidas;
  const aperturas = Number(resumen.totalAperturas ?? 0);
  const cierres = Number(resumen.totalCierresReales ?? 0);
  const diferencia = Number(resumen.totalDiferencia ?? 0);
  const sesiones = Number(resumen.totalSesiones ?? 0);

  await dibujarEncabezadoInformeInventario(doc, {
    titulo: "INFORME DE CAJA",
    fechaTexto: generadoTexto,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(`Periodo: ${desdeTxt} - ${hastaTxt}`, marginX, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("Desglose de operaciones", marginX, 46);

  autoTable(doc, {
    startY: 49,
    margin: { left: marginX, right: marginX },
    head: [["OPERACION", "SIGNO", "MONTO"]],
    body: [
      ["Ventas en efectivo", "+", fmtQPdf(ventas)],
      ["Ingresos manuales", "+", fmtQPdf(ingresos)],
      ["Total entradas", "=", fmtQPdf(totalEntradas)],
      ["Reembolsos en efectivo", "-", fmtQPdf(reembolsos)],
      ["Egresos manuales", "-", fmtQPdf(egresos)],
      ["Total salidas", "=", fmtQPdf(totalSalidas)],
      ["Balance neto (entradas - salidas)", "=", fmtQPdf(balanceNeto)],
    ],
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.4,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 40, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const label = String(data.row.raw?.[0] ?? "");
      if (
        label.startsWith("Total ") ||
        label.startsWith("Balance neto")
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [249, 250, 251];
      }
      if (data.column.index === 1) {
        const signo = String(data.cell.raw ?? "");
        if (signo === "+") data.cell.styles.textColor = [5, 150, 105];
        if (signo === "-") data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  const afterOpsY = (doc.lastAutoTable?.finalY ?? 49) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("Conciliacion de aperturas y cierres", marginX, afterOpsY);

  autoTable(doc, {
    startY: afterOpsY + 3,
    margin: { left: marginX, right: marginX },
    head: [["CONCEPTO", "VALOR"]],
    body: [
      ["Sesiones del periodo", sesiones.toLocaleString("es-GT")],
      ["Total aperturas", fmtQPdf(aperturas)],
      ["Total cierres reales", fmtQPdf(cierres)],
      ["Diferencia neta (cierres)", fmtQPdf(diferencia)],
    ],
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.4,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: SIDEBAR_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: "bold" },
      1: { cellWidth: 58, halign: "right" },
    },
    tableWidth: 168,
  });

  const afterConcY = (doc.lastAutoTable?.finalY ?? afterOpsY) + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  const nota = doc.splitTextToSize(
    "Balance neto = (ventas en efectivo + ingresos manuales) - (reembolsos en efectivo + egresos manuales). Este informe no incluye el listado de sesiones de caja.",
    pageWidth - marginX * 2
  );
  doc.text(nota, marginX, afterConcY);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY_LIGHT);
  doc.text(
    `Pagina ${doc.internal.getNumberOfPages()} - Informe de caja ${rangoArchivo}`,
    pageWidth - marginX,
    doc.internal.pageSize.getHeight() - 8,
    { align: "right" }
  );

  doc.save(`informe_caja_${rangoArchivo}.pdf`);
};

/**
 * Detalle de una cotización (mayoreo) — productos / líneas.
 */
export const generarDetalleCotizacionPdf = async (cotizacion) => {
  if (!cotizacion?.idCotizacion) {
    throw new Error("Cotización inválida para generar PDF.");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  const formatearFechaCorta = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
  };

  const etiquetaEstado = (estado) => {
    const valor = String(estado ?? "").trim().toUpperCase();
    if (valor === "PENDIENTE") return "Cotizacion";
    if (valor === "CONVERTIDA") return "Finalizada";
    if (valor === "VENCIDA") return "Vencida";
    if (valor === "ANULADA") return "Anulada";
    return estado || "—";
  };

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
  doc.text("Mayoreo y Cotizaciones", 47, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("COTIZACION", pageWidth - marginX, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(
    `#${cotizacion.idCotizacion} · ${etiquetaEstado(cotizacion.estado)}`,
    pageWidth - marginX,
    23,
    { align: "right" }
  );
  doc.text(
    `Emision: ${formatearFechaCorta(cotizacion.fechaEmision)}`,
    pageWidth - marginX,
    28,
    { align: "right" }
  );

  doc.setDrawColor(...SIDEBAR_COLOR);
  doc.setLineWidth(1);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  let y = 42;
  const filaInfo = (label, valor) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(valor || "—"), marginX + 28, y);
    y += 6;
  };

  filaInfo("Cliente:", cotizacion.nombreCliente || "—");
  filaInfo("Vendedor:", cotizacion.nombreUsuario || "—");
  filaInfo("Vence:", formatearFechaCorta(cotizacion.fechaVencimiento));

  const detalles = Array.isArray(cotizacion.detalles) ? cotizacion.detalles : [];

  autoTable(doc, {
    startY: y + 2,
    margin: { left: marginX, right: marginX },
    head: [["PRODUCTO", "PRESENTACION", "CANT.", "PRECIO U.", "SUBTOTAL"]],
    body:
      detalles.length > 0
        ? detalles.map((d) => [
            d.nombreVariante || d.nombreProducto || "—",
            d.presentacion || "—",
            String(d.cantidad ?? 0),
            fmtQPdf(d.precioUnitarioNegociado),
            fmtQPdf(d.subtotal),
          ])
        : [["Sin productos en esta cotizacion", "—", "0", fmtQPdf(0), fmtQPdf(0)]],
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2.2,
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
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 28, halign: "right" },
    },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_LIGHT);
      doc.text(
        `Pagina ${doc.internal.getNumberOfPages()} · Cotizacion #${cotizacion.idCotizacion}`,
        pageWidth - marginX,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  const finalY = doc.lastAutoTable?.finalY ?? y + 10;
  const totalCalculado = detalles.reduce(
    (acc, d) => acc + (Number(d.subtotal) || 0),
    0
  );
  const total =
    Number(cotizacion.total) > 0 ? Number(cotizacion.total) : totalCalculado;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Total:", pageWidth - marginX - 40, finalY + 12);
  doc.text(fmtQPdf(total), pageWidth - marginX, finalY + 12, { align: "right" });

  doc.save(`cotizacion_${cotizacion.idCotizacion}.pdf`);
};
