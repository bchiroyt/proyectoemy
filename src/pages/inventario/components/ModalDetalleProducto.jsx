import { X } from "lucide-react";

const ModalDetalleProducto = ({ open, onClose, producto }) => {
  if (!open || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {producto.nombre}
            </h2>
            <p className="text-gray-500 mt-1">
              {producto.descripcion || "Sin descripción"}
            </p>
          </div>

          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-400">Categoría</p>
            <p className="font-semibold text-lg">
              {producto.categoriaNombre}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-400">Marca</p>
            <p className="font-semibold text-lg">
              {producto.marcaNombre}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-400">Estado catálogo</p>
            <p className="font-semibold text-lg">
              {producto.estadoCatalogo}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-400">Variantes</p>
            <p className="font-semibold text-lg">
              {producto.variantes?.length || 0}
            </p>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-(--color-pagina-2) text-white px-6 py-2 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleProducto;