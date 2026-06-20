import { Button } from "@/components/ui/button";

const ModalConfirmacion = ({
  open,
  onClose,
  onConfirm,
  titulo = "Confirmar acción",
  mensaje = "¿Estás seguro?",
  confirmLabel = "Eliminar",
  loadingLabel = "Eliminando...",
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacion-titulo"
        aria-describedby="modal-confirmacion-mensaje"
        className="w-full max-w-sm rounded-2xl border-t-4 border-(--color-pagina) bg-white p-6 shadow-2xl"
      >
        <h4
          id="modal-confirmacion-titulo"
          className="text-center text-md font-semibold text-gray-800"
        >
          {titulo}
        </h4>
        <p id="modal-confirmacion-mensaje" className="mt-2 text-center text-sm text-gray-500">
          {mensaje}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600"
          >
            {loading ? loadingLabel : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-xl border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            No, cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
