import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAsignarRolesUsuarioMutation } from "@/hooks/queries/useSeguridadQueries";
import { validateAsignarRoles } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";

export function AsignarRolesUsuarioDialog({ open, onOpenChange, usuario, rolesCatalogo }) {
  const [selected, setSelected] = useState(() => new Set());
  const [localError, setLocalError] = useState("");
  const mut = useAsignarRolesUsuarioMutation();

  useEffect(() => {
    if (!open || !usuario) return;
    const ids = new Set((usuario.roles ?? []).map((r) => r.idRol).filter(Boolean));
    setSelected(ids);
    setLocalError("");
  }, [open, usuario]);

  const toggle = (idRol) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idRol)) next.delete(idRol);
      else next.add(idRol);
      return next;
    });
  };

  const rolesActivos = useMemo(
    () => (rolesCatalogo ?? []).filter((r) => r.activo !== false),
    [rolesCatalogo]
  );

  const handleGuardar = async () => {
    setLocalError("");
    const idRoles = [...selected];
    const parsed = validateAsignarRoles({ idUsuario: usuario?.idUsuario, idRoles });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      setLocalError(first || "Datos inválidos");
      return;
    }
    try {
      await mut.mutateAsync({ idUsuario: parsed.data.idUsuario, idRoles: parsed.data.idRoles });
      onOpenChange(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo actualizar los roles."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-(--color-blanco)">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Roles del usuario</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Marca uno o varios roles para{" "}
            <span className="font-semibold text-foreground">
              {usuario?.nombres} {usuario?.apellidos}
            </span>
            . Los cambios se envían a la API solo si la validación es correcta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-(--color-pagina)">Roles disponibles</Label>
          <ScrollArea className="h-56 rounded-md border border-border pr-2">
            <ul className="space-y-1 p-2">
              {rolesActivos.map((r) => (
                <li key={r.idRol}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/80">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-(--color-pagina-2) shrink-0"
                      checked={selected.has(r.idRol)}
                      onChange={() => toggle(r.idRol)}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{r.nombre}</span>
                      <span className="text-xs text-muted-foreground">{r.codigo}</span>
                    </span>
                  </label>
                </li>
              ))}
              {!rolesActivos.length && (
                <li className="p-4 text-sm text-muted-foreground">No hay roles en el catálogo.</li>
              )}
            </ul>
          </ScrollArea>
        </div>

        {localError ? <p className="text-sm text-(--color-rojo)">{localError}</p> : null}
        {mut.isError ? (
          <p className="text-sm text-(--color-rojo)">{getApiErrorMessage(mut.error)}</p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={mut.isPending}
            className="bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
            onClick={handleGuardar}
          >
            {mut.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
