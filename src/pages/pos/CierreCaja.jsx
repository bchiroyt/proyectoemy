import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import {
  useDenominacionesActivasQuery,
  useCerrarCajaMutation,
  useCajaResumenCierreQuery,
  useMiCajaActivaQuery,
} from "@/hooks/queries/useCajaQueries";
import { ConteoDenominaciones } from "@/components/caja/ConteoDenominaciones";
import { NipDialog } from "@/components/caja/NipDialog";
import { buildDetallesArqueo, calcularTotalArqueo, fmtQ } from "@/lib/cajaMappers";
import { initCantidades } from "@/lib/cajaUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";

const CierreCaja = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const miCajaQ = useMiCajaActivaQuery();
  const idCaja = miCajaQ.data?.data?.idCaja;
  const resumenQ = useCajaResumenCierreQuery(idCaja, { enabled: !!idCaja });
  const denomQ = useDenominacionesActivasQuery();
  const cerrarM = useCerrarCajaMutation();

  const denominaciones = denomQ.data?.data ?? [];
  const resumen = resumenQ.data?.data;

  const [cantidades, setCantidades] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  useEffect(() => {
    setTitulo("POS · Cierre de caja");
  }, [setTitulo]);

  useEffect(() => {
    if (denominaciones.length) {
      setCantidades(initCantidades(denominaciones));
    }
  }, [denominaciones.length]);

  useEffect(() => {
    if (!miCajaQ.isLoading && !miCajaQ.data?.data) {
      navigate("/pos/apertura", { replace: true });
    }
  }, [miCajaQ.isLoading, miCajaQ.data, navigate]);

  const montoReal = useMemo(
    () => calcularTotalArqueo(cantidades, denominaciones),
    [cantidades, denominaciones]
  );
  const montoEsperado = resumen?.montoEsperado ?? 0;
  const diferencia = Math.round((montoReal - montoEsperado) * 100) / 100;
  const requiereObservacion = diferencia !== 0;

  const detallesValidos = useMemo(
    () => buildDetallesArqueo(cantidades, denominaciones),
    [cantidades, denominaciones]
  );

  const handleConfirmar = () => {
    if (!detallesValidos.length) {
      setToast({
        open: true,
        message: "Ingrese al menos una denominación con cantidad mayor a cero.",
        type: "warning",
      });
      return;
    }
    if (requiereObservacion && !observaciones.trim()) {
      setToast({
        open: true,
        message: "Debe ingresar una observación cuando existe diferencia de caja.",
        type: "warning",
      });
      return;
    }
    setNipOpen(true);
  };

  const handleNipConfirm = async (nip) => {
    try {
      await cerrarM.mutateAsync({
        idCaja,
        body: {
          nip,
          observacion: observaciones.trim() || null,
          detalles: detallesValidos,
        },
      });
      setNipOpen(false);
      setToast({ open: true, message: "Caja cerrada correctamente.", type: "success" });
      setTimeout(() => navigate("/pos"), 800);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo cerrar la caja."),
        type: "error",
      });
    }
  };

  const resumenExtra = resumen ? (
    <div className="mt-3 pt-3 border-t border-white/30 space-y-1 text-xs">
      <p>Esperado: {fmtQ(montoEsperado)}</p>
      <p>Entradas: {fmtQ(resumen.totalEntradasManual)}</p>
      <p>Salidas: {fmtQ(resumen.totalSalidasManual)}</p>
      {diferencia !== 0 && (
        <p className="flex items-center gap-1 font-bold text-amber-100">
          <AlertTriangle className="size-3.5" />
          Diferencia: {fmtQ(diferencia)}
        </p>
      )}
    </div>
  ) : null;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-(--color-pagina-4) p-2 sm:p-3">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-lg max-w-7xl mx-auto w-full">
        <header className="shrink-0 flex flex-wrap items-start justify-between gap-2 border-b border-(--color-gris-claro-2) px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-(--color-negro)">Arqueo de cierre</h2>
            <p className="text-sm text-(--color-gris-letra)">
              Caja #{idCaja} · Cuente el efectivo final
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/pos/ventas")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-gris-claro-2) bg-(--color-pagina-3) px-2.5 py-1.5 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" />
            Volver a ventas
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {resumenQ.isLoading || denomQ.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <ConteoDenominaciones
                denominaciones={denominaciones}
                cantidades={cantidades}
                onCantidadesChange={setCantidades}
                observacion={observaciones}
                onObservacionChange={setObservaciones}
                observacionRequired={requiereObservacion}
                observacionHint={
                  requiereObservacion
                    ? "Hay diferencia entre el monto contado y el esperado. La observación es obligatoria."
                    : undefined
                }
                resumenExtra={resumenExtra}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={cerrarM.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-(--color-rojo) px-6 py-3 text-sm font-bold text-(--color-blanco) hover:bg-(--color-rojo-obscuro) disabled:opacity-50"
                >
                  <Lock className="size-4" />
                  Confirmar cierre
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <NipDialog
        open={nipOpen}
        onOpenChange={setNipOpen}
        title="Cerrar caja"
        description="Ingrese su NIP para confirmar el cierre de caja."
        confirmLabel="Cerrar caja"
        isLoading={cerrarM.isPending}
        onConfirm={handleNipConfirm}
      />
    </div>
  );
};

export default CierreCaja;
