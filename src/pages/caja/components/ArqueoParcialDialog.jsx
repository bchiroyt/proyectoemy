import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConteoDenominaciones } from "./ConteoDenominaciones";
import { NipDialog } from "./NipDialog";
import {
  useDenominacionesActivasQuery,
  useArqueoParcialMutation,
} from "@/hooks/queries/useCajaQueries";
import { buildDetallesArqueo } from "@/lib/cajaMappers";
import { initCantidades } from "@/lib/cajaUtils";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";

export function ArqueoParcialDialog({ open, onOpenChange, idCaja }) {
  const denomQ = useDenominacionesActivasQuery({ enabled: open });
  const arqueoM = useArqueoParcialMutation();
  const denominaciones = denomQ.data?.data ?? [];

  const [cantidades, setCantidades] = useState({});
  const [observacion, setObservacion] = useState("");
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  useEffect(() => {
    if (open && denominaciones.length) {
      setCantidades(initCantidades(denominaciones));
    }
    if (!open) {
      setObservacion("");
    }
  }, [open, denominaciones.length]);

  const detalles = useMemo(
    () => buildDetallesArqueo(cantidades, denominaciones),
    [cantidades, denominaciones]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!detalles.length) return;
    setNipOpen(true);
  };

  const handleNip = async (nip) => {
    try {
      await arqueoM.mutateAsync({
        idCaja,
        body: { nip, observacion: observacion.trim() || null, detalles },
      });
      setNipOpen(false);
      setToast({ open: true, message: "Arqueo parcial registrado.", type: "success" });
      onOpenChange(false);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo registrar el arqueo."),
        type: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Arqueo parcial</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <ConteoDenominaciones
                denominaciones={denominaciones}
                cantidades={cantidades}
                onCantidadesChange={setCantidades}
                observacion={observacion}
                onObservacionChange={setObservacion}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!detalles.length || arqueoM.isPending}
                className="bg-(--color-pagina-2) text-(--color-blanco)"
              >
                Confirmar con NIP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <NipDialog
        open={nipOpen}
        onOpenChange={setNipOpen}
        title="Arqueo parcial"
        isLoading={arqueoM.isPending}
        onConfirm={handleNip}
      />
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}
