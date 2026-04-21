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
import { useCrearRolMutation } from "@/hooks/queries/useSeguridadQueries";
import { validateCrearRol } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";

const empty = { codigo: "", nombre: "", descripcion: "" };

export function NuevoRolDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const mut = useCrearRolMutation();

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
    const parsed = validateCrearRol({
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
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
      });
      onClose(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo crear el rol."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-(--color-blanco)">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Nuevo rol</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Define código y nombre. Los permisos podrás ajustarlos después en la matriz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nr-codigo" className="text-xs font-bold uppercase text-(--color-pagina)">
              Código
            </Label>
            <Input
              id="nr-codigo"
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            />
            {fieldErrors.codigo?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.codigo[0]}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nr-nombre" className="text-xs font-bold uppercase text-(--color-pagina)">
              Nombre
            </Label>
            <Input id="nr-nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            {fieldErrors.nombre?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.nombre[0]}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nr-desc" className="text-xs font-bold uppercase text-(--color-pagina)">
              Descripción
            </Label>
            <Textarea id="nr-desc" rows={2} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
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
            className="bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
            onClick={handleSubmit}
          >
            {mut.isPending ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
