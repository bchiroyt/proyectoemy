import React, { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDesactivarUsuarioMutation } from "@/hooks/queries/useSeguridadQueries";
import { getApiErrorMessage } from "@/lib/apiClient";

function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

export function DesactivarUsuarioDialog({ open, onOpenChange, usuario, idUsuarioSesion }) {
  const [localError, setLocalError] = useState("");
  const mut = useDesactivarUsuarioMutation();

  const esPropioUsuario = useMemo(
    () => sameUserId(idUsuarioSesion, usuario?.idUsuario),
    [idUsuarioSesion, usuario?.idUsuario]
  );

  const handleConfirm = async () => {
    if (!usuario?.idUsuario) return;
    if (esPropioUsuario) {
      setLocalError("No puedes desactivar tu propia cuenta mientras tienes sesión iniciada.");
      return;
    }
    setLocalError("");
    try {
      await mut.mutateAsync(usuario.idUsuario);
      onOpenChange(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo desactivar el usuario."));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-(--color-blanco)">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-(--color-pagina-2)">Desactivar usuario</AlertDialogTitle>
          <AlertDialogDescription className="text-(--color-gris-letra)">
            Se llamará a <code className="text-xs">DELETE /api/Usuarios/{usuario?.idUsuario}</code>, que en el backend
            marca al usuario como <strong>inactivo</strong> (no borra el registro).
          </AlertDialogDescription>
          <p className="text-sm text-foreground">
            ¿Desactivar a{" "}
            <span className="font-semibold">
              {usuario?.nombres} {usuario?.apellidos}
            </span>{" "}
            ({usuario?.email})?
          </p>
          {localError ? <p className="text-sm text-(--color-rojo)">{localError}</p> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={mut.isPending || esPropioUsuario}
            className="bg-(--color-rojo) text-(--color-blanco) hover:bg-(--color-rojo-obscuro)"
            onClick={handleConfirm}
          >
            {mut.isPending ? "Procesando…" : "Sí, desactivar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
