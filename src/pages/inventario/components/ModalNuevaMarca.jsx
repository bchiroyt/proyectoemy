import { X } from "lucide-react";
import { useState } from "react";

const ModalNuevaMarca = ({ open, onClose, onSave }) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  if (!open) return null;

  const handleGuardar = () => {
    if (!nombre.trim()) return;

    onSave(nombre);
    setNombre("");
    setDescripcion("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-6 relative border-t-4 border-(--color-pagina)">

        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h2 className="font-semibold text-lg">
            Crear Nueva Marca
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-5 space-y-4">

          <div>
            <label className="text-sm text-gray-600">
              Nombre de la Marca
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Zapatillas Nike"
              className="w-full mt-1 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-(--color-pagina)"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la marca..."
              className="w-full mt-1 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-(--color-pagina)"
              rows={3}
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 space-y-3 bg-gray-50">

          <button
            onClick={handleGuardar}
            className="w-full bg-(--color-pagina-2) text-white py-3 rounded-xl font-semibold hover:opacity-90"
          >
            Registrar
          </button>

          <button
            onClick={onClose}
            className="w-full bg-(--color-rosa-hover) text-(--color-pagina) py-3 rounded-xl font-semibold"
          >
            Cancelar
          </button>

        </div>

      </div>
    </div>
  );
};

export default ModalNuevaMarca;