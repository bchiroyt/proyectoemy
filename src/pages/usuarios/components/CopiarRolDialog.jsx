import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCopiarRolMutation } from "@/hooks/queries/useSeguridadQueries";
import { validateCopiarRol } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";

const empty = { idRolOrigen: "", codigo: "", nombre: "", descripcion: "" };

export function CopiarRolDialog({ open, onOpenChange, roles }) {
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const mut = useCopiarRolMutation();

  const onClose = (v) => {
    if (!v) {
      setForm(empty);
      setFieldErrors({});
      setLocalError("");
    }
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    setLocalError("");
    setFieldErrors({});
    const idRolOrigen = form.idRolOrigen ? Number(form.idRolOrigen) : NaN;
    const parsed = validateCopiarRol({
      idRolOrigen,
      codigo: form.codigo,
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    try {
      await mut.mutateAsync({
        idRolOrigen: parsed.data.idRolOrigen,
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || undefined,
      });
      onClose(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo copiar el rol."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-(--color-blanco)">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Copiar rol</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Crea un rol nuevo copiando los permisos del rol origen. Código y nombre deben ser únicos en base de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase text-(--color-pagina)">Rol origen</Label>
            <Select
              value={form.idRolOrigen ? String(form.idRolOrigen) : undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, idRolOrigen: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un rol…" />
              </SelectTrigger>
              <SelectContent>
                {(roles ?? []).map((r) => (
                  <SelectItem key={r.idRol} value={String(r.idRol)}>
                    {r.nombre} ({r.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.idRolOrigen?.[0] ? (
              <p className="text-xs text-(--color-rojo)">{fieldErrors.idRolOrigen[0]}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-codigo" className="text-xs font-bold uppercase text-(--color-pagina)">
              Código nuevo
            </Label>
            <Input
              id="cr-codigo"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="EJ_VENDEDOR"
            />
            {fieldErrors.codigo?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.codigo[0]}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-nombre" className="text-xs font-bold uppercase text-(--color-pagina)">
              Nombre
            </Label>
            <Input
              id="cr-nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Vendedor mostrador"
            />
            {fieldErrors.nombre?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.nombre[0]}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cr-desc" className="text-xs font-bold uppercase text-(--color-pagina)">
              Descripción (opcional)
            </Label>
            <Textarea id="cr-desc" rows={2} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            {fieldErrors.descripcion?.[0] ? (
              <p className="text-xs text-(--color-rojo)">{fieldErrors.descripcion[0]}</p>
            ) : null}
          </div>
        </div>

        {localError ? <p className="text-sm text-(--color-rojo)">{localError}</p> : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={mut.isPending}
            className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
            onClick={handleSubmit}
          >
            {mut.isPending ? "Copiando…" : "Copiar rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
