import { useState, useEffect, useMemo } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import {
  useDenominacionesActivasQuery,
  useAbrirCajaMutation,
} from "@/hooks/queries/useCajaQueries";
import { ConteoDenominaciones } from "@/components/caja/ConteoDenominaciones";
import { NipDialog } from "@/components/caja/NipDialog";
import { buildDetallesArqueo } from "@/lib/cajaMappers";
import { initCantidades } from "@/lib/cajaUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";

const AperturaCaja = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const denomQ = useDenominacionesActivasQuery();
  const abrirM = useAbrirCajaMutation();

  const denominaciones = denomQ.data?.data ?? [];

  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  useEffect(() => {
    setTitulo("POS · Apertura de caja");
  }, [setTitulo]);

  useEffect(() => {
    if (denominaciones.length) {
      setCantidades(initCantidades(denominaciones));
    }
  }, [denominaciones.length]);

  const detallesValidos = useMemo(
    () => buildDetallesArqueo(cantidades, denominaciones),
    [cantidades, denominaciones]
  );

  const handleConfirmarClick = () => {
    if (!detallesValidos.length) {
      setToast({
        open: true,
        message: "Ingrese al menos una denominación con cantidad mayor a cero.",
        type: "warning",
      });
      return;
    }
    setNipOpen(true);
  };

  const handleNipConfirm = async (nip) => {
    try {
      await abrirM.mutateAsync({
        nip,
        observacion: observaciones.trim() || null,
        detalles: detallesValidos,
      });
      setNipOpen(false);
      setToast({ open: true, message: "Caja abierta correctamente.", type: "success" });
      setTimeout(() => navigate("/pos/ventas"), 600);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo abrir la caja."),
        type: "error",
      });
    }
  };

  const fechaFormateada = new Date().toLocaleString("es-GT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-(--color-pagina-4) p-2 sm:p-3">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div
        data-barcode-listener="off"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg max-w-7xl mx-auto w-full"
      >
        <header className="shrink-0 flex flex-wrap items-start justify-between gap-2 border-b border-(--color-gris-claro-2) px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-(--color-negro)">Conteo inicial</h2>
            <p className="text-sm text-(--color-gris-letra) mt-0.5">
              Registre el efectivo en caja para iniciar su turno.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/pos")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1.5 text-sm font-semibold text-(--color-negro) hover:border-(--color-pagina) hover:text-(--color-pagina)"
          >
            <ArrowLeft className="size-4" />
            Regresar
          </button>
        </header>

        <div className="shrink-0 px-3 py-1.5 sm:px-4 bg-(--color-pagina-3)/60 border-b border-(--color-gris-claro-2) text-sm">
          <span className="font-semibold text-(--color-gris-letra)">Fecha y hora: </span>
          <span className="font-bold text-(--color-negro) tabular-nums">{fechaFormateada}</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
          {denomQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : denomQ.isError ? (
            <p className="text-(--color-rojo) text-sm">
              {getApiErrorMessage(denomQ.error, "No se pudieron cargar las denominaciones.")}
            </p>
          ) : (
            <>
              <ConteoDenominaciones
                denominaciones={denominaciones}
                cantidades={cantidades}
                onCantidadesChange={setCantidades}
                observacion={observaciones}
                onObservacionChange={setObservaciones}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmarClick}
                  disabled={abrirM.isPending || !denominaciones.length}
                  className="inline-flex items-center gap-2 rounded-xl bg-(--color-pagina) px-6 py-3 text-sm font-bold text-(--color-blanco) hover:bg-(--color-borde-button) disabled:opacity-50"
                >
                  <Lock className="size-4" />
                  Confirmar apertura
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <NipDialog
        open={nipOpen}
        onOpenChange={setNipOpen}
        title="Abrir caja"
        description="Ingrese su NIP de caja para confirmar la apertura."
        confirmLabel="Abrir caja"
        isLoading={abrirM.isPending}
        onConfirm={handleNipConfirm}
      />
    </div>
  );
};

export default AperturaCaja;
