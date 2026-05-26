import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ArrowLeft, FileDown } from "lucide-react";

const ReporteStock = () => {
  const navigate = useNavigate();

  // 🔥 DATA DE EJEMPLO (luego la conectas a tu backend)
  const [data] = useState([
    {
      id: 1,
      producto: "Blusa Manga Larga",
      sku: "000011",
      variante: "Rojo / M",
      cantidad: 10,
      costo: 35.00,
    },
    {
      id: 2,
      producto: "Vestido Elegante",
      sku: "000012",
      variante: "Negro / S",
      cantidad: 5,
      costo: 50.00,
    },
    {
      id: 3,
      producto: "Jeans Slim Fit",
      sku: "000013",
      variante: "Azul / 32",
      cantidad: 20,
      costo: 45.00,
    },
  ]);

  // 🔥 GENERAR PDF
  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text("Reporte de Stock", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["Producto", "SKU", "Variante", "Cantidad", "Costo"]],
      body: data.map(item => [
        item.producto,
        item.sku,
        item.variante,
        item.cantidad,
        `Q ${item.costo.toFixed(2)}`
      ]),
    });

    doc.save("reporte_stock.pdf");
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Niveles de Stock
      </h1>

      {/* 🔥 BARRA SUPERIOR */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-3 justify-between">

        {/* IZQUIERDA */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* REGRESAR */}
          <button
            onClick={() => navigate("/inventario")}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>

          {/* GENERAR PDF */}
          <button
            onClick={generarPDF}
            className="flex items-center gap-2 bg-(--color-pagina-2) text-white px-5 py-2 rounded-xl hover:opacity-90"
          >
            <FileDown className="w-4 h-4" />
            Generar reporte
          </button>

        </div>

        {/* DERECHA (FILTROS EN MISMA LÍNEA) */}
        <div className="flex items-center gap-3 flex-wrap">

          <select className="p-2 border rounded-lg text-sm">
            <option>Todos los productos</option>
          </select>

          <select className="p-2 border rounded-lg text-sm">
            <option>Todos los estados</option>
            <option>Crítico</option>
            <option>Advertencia</option>
          </select>

        </div>

      </div>

      {/* 🔥 TABLA */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Producto</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Variante</th>
              <th className="p-3">Cantidad</th>
              <th className="p-3">Costo</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t">

                <td className="p-3">{item.producto}</td>
                <td className="p-3">{item.sku}</td>
                <td className="p-3">{item.variante}</td>
                <td className="p-3">{item.cantidad}</td>
                <td className="p-3">Q {item.costo.toFixed(2)}</td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default ReporteStock;