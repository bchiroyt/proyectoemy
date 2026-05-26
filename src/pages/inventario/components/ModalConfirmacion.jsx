import { X } from "lucide-react";

const ModalConfirmacion = ({
  open,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Estás seguro?",
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 border-t-4 border-red-500">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">{titulo}</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* MENSAJE */}
        <p className="text-gray-600 mb-6">{mensaje}</p>

        {/* BOTONES */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalConfirmacion;