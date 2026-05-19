import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { NipDialog } from "./NipDialog";
import { useRegistrarMovimientoCajaMutation, useCajaMovimientosQuery } from "@/hooks/queries/useCajaQueries";
import { getTiposMovimientoCajaConfig, mergeTiposMovimiento } from "@/constants/cajaTiposMovimiento";
import { getApiErrorMessage } from "@/lib/apiClient";
import Toast from "@/components/ui/Toast";

export function MovimientoCajaDialog({
  open,
  onOpenChange,
  idCaja,
  dialogTitle = "Movimiento manual de caja",
}) {
  const movQ = useCajaMovimientosQuery(idCaja, { enabled: open && idCaja > 0 });
  const regM = useRegistrarMovimientoCajaMutation();

  const [idTipo, setIdTipo] = useState("");
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [nipOpen, setNipOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  const tipos = useMemo(
    () => mergeTiposMovimiento(getTiposMovimientoCajaConfig(), movQ.data?.data ?? []),
    [movQ.data?.data]
  );

  const tipoSel = tipos.find((t) => String(t.idTipoMovimientoCaja) === idTipo);

  useEffect(() => {
    if (!open) {
      setIdTipo("");
      setMonto("");
      setMotivo("");
      setObservacion("");
    }
  }, [open]);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!idTipo || !monto || Number(monto) <= 0) return;
    if (tipoSel?.requiereMotivo && !motivo.trim()) return;
    setNipOpen(true);
  };

  const handleConfirmNip = async (nip) => {
    try {
      await regM.mutateAsync({
        idCaja,
        body: {
          nip,
          idTipoMovimientoCaja: Number(idTipo),
          monto: Number(monto),
          motivo: motivo.trim() || null,
          observacion: observacion.trim() || null,
        },
      });
      setNipOpen(false);
      setToast({ open: true, message: "Movimiento registrado correctamente.", type: "success" });
      onOpenChange(false);
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err, "No se pudo registrar el movimiento."),
        type: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handlePreSubmit}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {tipos.length === 0 ? (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle className="size-5 shrink-0" />
                  <p>
                    Configure los tipos en VITE_TIPOS_MOVIMIENTO_CAJA en su archivo .env, o registre un
                    movimiento previo para detectar tipos usados.
                  </p>
                </div>
              ) : (
                <div>
                  <Label>Tipo de movimiento</Label>
                  <select
                    value={idTipo}
                    onChange={(e) => setIdTipo(e.target.value)}
                    required
                    className="mt-1 w-full h-10 rounded-md border border-(--color-gris-claro-2) bg-(--color-blanco) px-3 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-pagina)/40"
                  >
                    <option value="">Seleccione…</option>
                    {tipos.map((t) => (
                      <option key={t.idTipoMovimientoCaja} value={t.idTipoMovimientoCaja}>
                        {t.nombre} ({t.naturaleza})
                      </option>
                    ))}
                  </select>
                  {tipoSel && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-(--color-gris-letra)">
                      {tipoSel.naturaleza === "ENTRADA" ? (
                        <ArrowDownCircle className="size-3.5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="size-3.5 text-(--color-rojo)" />
                      )}
                      Naturaleza: {tipoSel.naturaleza}
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label>Monto (Q)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>
                  Motivo
                  {tipoSel?.requiereMotivo && <span className="text-(--color-rojo)"> *</span>}
                </Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required={tipoSel?.requiereMotivo}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Observación</Label>
                <Input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!tipos.length || regM.isPending}
                className="bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
              >
                Continuar con NIP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <NipDialog
        open={nipOpen}
        onOpenChange={setNipOpen}
        title="Confirmar movimiento"
        isLoading={regM.isPending}
        onConfirm={handleConfirmNip}
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
