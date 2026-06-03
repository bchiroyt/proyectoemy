import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useActivarCajaMutation,
  useCajasAbiertasQuery,
} from "@/hooks/queries/useCajaQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { NipDialog } from "@/pages/caja/components/NipDialog";
import Toast from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";

const ULTIMO_CIERRE_MOCK = {
  fecha: "6 de Marzo",
  balanceEfectivo: 2840.5,
};

export function SinCajaActivaCard({
  variant = "pos",
  showUltimoCierre = false,
}) {
  const navigate = useNavigate();
  const { data: cajasRes, isLoading: loadingCajas } = useCajasAbiertasQuery();
  const actM = useActivarCajaMutation();

  const cajasAbiertas = cajasRes?.data ?? [];
  const hayCajasAbiertas = cajasAbiertas.length > 0;
  const cajaUnica = cajasAbiertas.length === 1 ? cajasAbiertas[0] : null;

  const [nipOpen, setNipOpen] = useState(false);
  const [activarId, setActivarId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const handleAccionPrincipal = () => {
    if (hayCajasAbiertas) {
      if (cajaUnica) {
        setActivarId(cajaUnica.idCaja);
        setNipOpen(true);
      }
      return;
    }

    navigate("/pos/apertura");
  };

  const handleNipConfirm = async (nip) => {
    try {
      await actM.mutateAsync({ idCaja: activarId, body: { nip } });
      setNipOpen(false);
      setActivarId(null);
      setToast({
        open: true,
        message: "Caja activada en este equipo.",
        type: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo activar la caja."),
        type: "error",
      });
    }
  };

  if (loadingCajas) {
    return variant === "pos" ? (
      <Skeleton className="h-64 w-full rounded-2xl" />
    ) : (
      <Skeleton className="mx-auto h-40 max-w-md w-full rounded-2xl" />
    );
  }

  const titulo = variant === "pos" ? "Modas y Variedades EMY" : "No tienes una caja activa";

  const descripcion = hayCajasAbiertas
    ? cajasAbiertas.length === 1
      ? "Hay una caja abierta en el sistema. Actívela en este equipo para operar."
      : "Hay cajas abiertas en el sistema. Seleccione una en la lista inferior para activarla."
    : variant === "pos"
      ? "No tienes una caja activa en este equipo. Abre tu turno con un arqueo inicial para operar."
      : "Abra su turno con un arqueo inicial para operar en el POS.";

  const mostrarBotonPrincipal = !hayCajasAbiertas || !!cajaUnica;
  const etiquetaBoton = hayCajasAbiertas ? "Activar caja" : "Abrir Caja";

  const contenidoBoton = (
    <>
      {hayCajasAbiertas ? (
        <LayoutDashboard className="mr-2 size-5" />
      ) : (
        <Banknote className="mr-2 size-5" />
      )}
      {etiquetaBoton}
    </>
  );

  return (
    <>
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {variant === "pos" ? (
        <div className="rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
          <h3 className="mb-2 text-2xl font-bold text-gray-900">{titulo}</h3>
          <p className="mb-8 text-sm text-(--color-gris-letra)">{descripcion}</p>

          {mostrarBotonPrincipal && (
            <button
              type="button"
              onClick={handleAccionPrincipal}
              disabled={actM.isPending}
              className="rounded-xl bg-pink-200 px-10 py-3 font-bold text-gray-900 shadow-sm transition hover:bg-pink-300 disabled:opacity-50"
            >
              {etiquetaBoton}
            </button>
          )}

          {showUltimoCierre && !hayCajasAbiertas && (
            <>
              <div className="mx-auto my-8 max-w-md border-t border-gray-200" />
              <div className="mx-auto max-w-md space-y-3 text-left text-base">
                <div className="flex items-center justify-between gap-4 text-gray-900">
                  <span className="font-bold">Fecha de cierre</span>
                  <span className="font-bold">{ULTIMO_CIERRE_MOCK.fecha}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-gray-900">
                  <span className="font-bold">Último balance de cierre de efectivo</span>
                  <span className="font-bold tabular-nums">
                    Q {ULTIMO_CIERRE_MOCK.balanceEfectivo.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-8">
          <Banknote className="mb-4 size-16 text-(--color-gris-claro-2)" />
          <h3 className="text-xl font-bold text-(--color-negro)">{titulo}</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-(--color-gris-letra)">
            {descripcion}
          </p>
          {mostrarBotonPrincipal && (
            <Button
              onClick={handleAccionPrincipal}
              disabled={actM.isPending}
              className="rounded-xl bg-(--color-pagina) px-8 py-6 text-lg font-bold text-(--color-blanco) hover:bg-(--color-borde-button)"
            >
              {contenidoBoton}
            </Button>
          )}
        </div>
      )}

      <NipDialog
        open={nipOpen}
        onOpenChange={(o) => {
          setNipOpen(o);
          if (!o) setActivarId(null);
        }}
        title="Activar caja"
        description={`Ingrese su NIP para operar con la caja #${activarId ?? ""}.`}
        confirmLabel="Activar"
        isLoading={actM.isPending}
        onConfirm={handleNipConfirm}
      />
    </>
  );
}
