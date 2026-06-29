export function ModalConfirmarSalida({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-110 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-salida-titulo"
        aria-describedby="confirmar-salida-descripcion"
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col border-t-4 border-(--color-pagina) p-6 space-y-4"
      >
        <h4 id="confirmar-salida-titulo" className="text-md font-semibold text-gray-800 text-center">
          ¿Estás seguro de salir?
        </h4>
        <p id="confirmar-salida-descripcion" className="text-sm text-gray-500 text-center">
          No se guardarán los cambios
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full bg-red-500 text-white py-2.5 rounded-xl font-medium hover:bg-red-600 active:scale-[0.99] transition-all cursor-pointer text-sm"
          >
            Sí, salir
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-sm"
          >
            No, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
