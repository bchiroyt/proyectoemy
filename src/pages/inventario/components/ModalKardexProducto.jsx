import { X } from "lucide-react";

const movimientosFake = [
  {
    id: "001",
    fecha: "01/05/2026",
    talla: "M",
    color: "Negro",
    tipo: "ENTRADA",
    cantidad: "+15",
    referencia: "Stock inicial",
    saldo: 15,
  },
  {
    id: "002",
    fecha: "03/05/2026",
    talla: "M",
    color: "Negro",
    tipo: "VENTA",
    cantidad: "-2",
    referencia: "Factura #455",
    saldo: 13,
  },
];

const ModalKardexProducto = ({ open, onClose, producto }) => {
  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Kardex: {producto.nombre}
          </h2>

          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4 text-left">No.</th>
                <th className="p-4 text-left">Fecha</th>
                <th className="p-4 text-left">Talla</th>
                <th className="p-4 text-left">Color</th>
                <th className="p-4 text-left">Tipo</th>
                <th className="p-4 text-left">Cant.</th>
                <th className="p-4 text-left">Referencia</th>
                <th className="p-4 text-left">Saldo</th>
              </tr>
            </thead>

            <tbody>
              {movimientosFake.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-4">{m.id}</td>
                  <td className="p-4">{m.fecha}</td>
                  <td className="p-4 font-semibold">{m.talla}</td>
                  <td className="p-4">{m.color}</td>

                  <td className="p-4">
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          m.tipo === "ENTRADA"
                            ? "bg-green-100 text-green-700"
                            : "bg-pink-100 text-pink-600"
                        }
                      `}
                    >
                      {m.tipo}
                    </span>
                  </td>

                  <td
                    className={`p-4 font-bold ${
                      m.tipo === "ENTRADA"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {m.cantidad}
                  </td>

                  <td className="p-4 text-gray-500">
                    {m.referencia}
                  </td>

                  <td className="p-4 font-bold">{m.saldo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t flex justify-center">
          <button
            onClick={onClose}
            className="bg-(--color-pagina-2) text-white px-10 py-2 rounded-xl"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalKardexProducto;