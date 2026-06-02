import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReembolsoLineaConfig } from "@/pages/pos/components/ReembolsoLineaConfig";

export function ReembolsoLineaDetalleDialog({
  open,
  onOpenChange,
  item,
  onActualizar,
  onCantidadChange,
  motivo = "",
  onMotivoChange,
  observacion = "",
  onObservacionChange,
  onConfirm,
}) {
  if (!item) return null;

  const listo =
    item.cantidad > 0 && String(motivo || "").trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-barcode-listener="off">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina) pr-6">{item.nombre}</DialogTitle>
          <DialogDescription>
            {item.sku ? `SKU ${item.sku} · ` : ""}
            Configure el reembolso de esta línea.
          </DialogDescription>
        </DialogHeader>

        <ReembolsoLineaConfig
          item={item}
          onActualizar={onActualizar}
          onCantidadChange={onCantidadChange}
          mostrarCantidad
          motivo={motivo}
          onMotivoChange={onMotivoChange}
          observacion={observacion}
          onObservacionChange={onObservacionChange}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            className="bg-(--color-pos-boton-primario) text-(--color-blanco) hover:bg-(--color-pos-boton-primario-hover)"
            disabled={!listo}
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
