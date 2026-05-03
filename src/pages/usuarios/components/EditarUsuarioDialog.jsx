import React, { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { usePatchUsuarioMutation, useUsuarioQuery } from "@/hooks/queries/useSeguridadQueries";
import { validateUsuarioEditForm } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";

function fmtIso(v) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  } catch {
    return String(v);
  }
}

const emptyForm = {
  idTipoUsuario: "",
  username: "",
  email: "",
  nombres: "",
  apellidos: "",
  telefono: "",
  requiereCambioPassword: false,
  activo: true,
  password: "",
};

export function EditarUsuarioDialog({ open, onOpenChange, idUsuario }) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const userQ = useUsuarioQuery(idUsuario, { enabled: open && Number(idUsuario) > 0 });
  const patchMut = usePatchUsuarioMutation();

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setFieldErrors({});
      setLocalError("");
      return;
    }
    const u = userQ.data;
    if (!u) return;
    setForm({
      idTipoUsuario: u.idTipoUsuario != null ? String(u.idTipoUsuario) : "",
      username: u.username ?? "",
      email: u.email ?? "",
      nombres: u.nombres ?? "",
      apellidos: u.apellidos ?? "",
      telefono: u.telefono ?? "",
      requiereCambioPassword: Boolean(u.requiereCambioPassword),
      activo: Boolean(u.activo),
      password: "",
    });
  }, [open, userQ.data]);

  const handleSubmit = async () => {
    setLocalError("");
    setFieldErrors({});
    const parsed = validateUsuarioEditForm({
      ...form,
      idTipoUsuario: form.idTipoUsuario,
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    const d = parsed.data;
    const body = {
      idTipoUsuario: d.idTipoUsuario,
      username: d.username,
      email: d.email,
      nombres: d.nombres,
      apellidos: d.apellidos || null,
      telefono: d.telefono || null,
      requiereCambioPassword: d.requiereCambioPassword,
      activo: d.activo,
    };
    if (d.password?.trim()) {
      body.password = d.password.trim();
    }
    try {
      await patchMut.mutateAsync({ idUsuario, body });
      onOpenChange(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo guardar el usuario."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto bg-(--color-blanco) sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Editar usuario</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Datos completos desde la API. Los cambios se envían con PATCH (parcial).
          </DialogDescription>
        </DialogHeader>

        {userQ.isLoading ? (
          <div className="grid gap-2 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : userQ.isError ? (
          <p className="text-sm text-(--color-rojo)">{getApiErrorMessage(userQ.error, "Error al cargar usuario.")}</p>
        ) : (
          <div className="grid gap-3 py-2">
            <div className="rounded-md border border-border bg-(--color-pagina-4) px-3 py-2 text-xs text-(--color-gris-letra)">
              <p>
                <span className="font-semibold text-foreground">ID:</span> {idUsuario}
              </p>
              <p>
                <span className="font-semibold text-foreground">Último acceso:</span>{" "}
                {fmtIso(userQ.data?.ultimoAcceso)}
              </p>
              <p>
                <span className="font-semibold text-foreground">Creado:</span> {fmtIso(userQ.data?.fechaCreacion)}
              </p>
              <p>
                <span className="font-semibold text-foreground">Actualizado:</span>{" "}
                {fmtIso(userQ.data?.fechaActualizacion)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eu-tipo" className="text-xs font-bold uppercase text-(--color-pagina)">
                Id tipo usuario
              </Label>
              <Input
                id="eu-tipo"
                type="number"
                min={1}
                value={form.idTipoUsuario}
                onChange={(e) => setForm((f) => ({ ...f, idTipoUsuario: e.target.value }))}
              />
              {fieldErrors.idTipoUsuario?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.idTipoUsuario[0]}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eu-user" className="text-xs font-bold uppercase text-(--color-pagina)">
                Username
              </Label>
              <Input
                id="eu-user"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              {fieldErrors.username?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.username[0]}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eu-email" className="text-xs font-bold uppercase text-(--color-pagina)">
                Correo
              </Label>
              <Input
                id="eu-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {fieldErrors.email?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.email[0]}</p> : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="eu-nom" className="text-xs font-bold uppercase text-(--color-pagina)">
                  Nombres
                </Label>
                <Input id="eu-nom" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />
                {fieldErrors.nombres?.[0] ? (
                  <p className="text-xs text-(--color-rojo)">{fieldErrors.nombres[0]}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eu-ape" className="text-xs font-bold uppercase text-(--color-pagina)">
                  Apellidos
                </Label>
                <Input id="eu-ape" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />
                {fieldErrors.apellidos?.[0] ? (
                  <p className="text-xs text-(--color-rojo)">{fieldErrors.apellidos[0]}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eu-tel" className="text-xs font-bold uppercase text-(--color-pagina)">
                Teléfono
              </Label>
              <Input id="eu-tel" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
              {fieldErrors.telefono?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.telefono[0]}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
                <input
                  type="checkbox"
                  className="size-4 accent-(--color-pagina-2)"
                  checked={form.requiereCambioPassword}
                  onChange={(e) => setForm((f) => ({ ...f, requiereCambioPassword: e.target.checked }))}
                />
                Requiere cambio de contraseña
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
                <input
                  type="checkbox"
                  className="size-4 accent-(--color-pagina-2)"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                />
                Activo
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eu-pass" className="text-xs font-bold uppercase text-(--color-pagina)">
                Nueva contraseña (opcional)
              </Label>
              <Input
                id="eu-pass"
                type="password"
                autoComplete="new-password"
                placeholder="Dejar vacío para no cambiar"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              {fieldErrors.password?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.password[0]}</p>
              ) : null}
            </div>
          </div>
        )}

        {localError ? <p className="text-sm text-(--color-rojo)">{localError}</p> : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={patchMut.isPending || userQ.isLoading || userQ.isError}
            className="bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
            onClick={handleSubmit}
          >
            {patchMut.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
