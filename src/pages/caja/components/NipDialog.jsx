import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export function NipDialog({
  open,
  onOpenChange,
  title = "Confirmar con NIP",
  description = "Ingrese su NIP de caja para continuar.",
  confirmLabel = "Confirmar",
  isLoading = false,
  onConfirm,
}) {
  const [nip, setNip] = useState("");

  useEffect(() => {
    if (!open) setNip("");
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nip.trim()) return;
    onConfirm?.(nip.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-4 text-(--color-pagina)" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="nip-caja" className="text-(--color-negro)">
              NIP de caja
            </Label>
            <Input
              id="nip-caja"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={nip}
              onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
              className="mt-1.5 border-(--color-gris-claro-2) focus-visible:ring-(--color-pagina)"
              placeholder="••••"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!nip.trim() || isLoading}
              className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
            >
              {isLoading ? "Procesando…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
