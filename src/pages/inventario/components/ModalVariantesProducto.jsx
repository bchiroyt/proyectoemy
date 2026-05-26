import { X } from "lucide-react";

const obtenerEstado = (stock) => {
  if (stock <= 0) {
    return {
      texto: "Agotado",
      clases: "bg-red-100 text-red-600",
    };
  }

  if (stock <= 15) {
    return {
      texto: "Bajo Stock",
      clases: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    texto: "Disponible",
    clases: "bg-green-100 text-green-700",
  };
};

const ModalVariantesProducto = ({ open, onClose, producto }) => {
  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Variantes: {producto.nombre}
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
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Color</th>
                <th className="p-4 text-left">Talla</th>
                <th className="p-4 text-left">Precio</th>
                <th className="p-4 text-left">Estado</th>
              </tr>
            </thead>

            <tbody>
              {producto.variantes?.map((v, index) => {
                const estado = obtenerEstado(25);

                return (
                  <tr key={v.idVariante} className="border-b">
                    <td className="p-4">{index + 1}</td>

                    <td className="p-4">
                      {v.codigoPrincipal || "Sin código"}
                    </td>

                    <td className="p-4">{v.color || "-"}</td>

                    <td className="p-4 font-semibold">
                      {v.tallaNombre || "-"}
                    </td>

                    <td className="p-4 font-semibold text-(--color-pagina)">
                      {v.precioVentaActual
                        ? `Q${v.precioVentaActual}`
                        : "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${estado.clases}`}
                      >
                        {estado.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}
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

export default ModalVariantesProducto;