import React, { useMemo, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrearUsuarioMutation, useRolesQuery } from "@/hooks/queries/useSeguridadQueries";
import { validateCrearUsuario } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";

const empty = {
  idTipoUsuario: "",
  username: "",
  email: "",
  password: "",
  nombres: "",
  apellidos: "",
  telefono: "",
  requiereCambioPassword: false,
  activo: true,
};

export function NuevoUsuarioDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(empty);
  const [rolesSel, setRolesSel] = useState(() => new Set());
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState("");
  const rolesQ = useRolesQuery({ enabled: open });
  const mut = useCrearUsuarioMutation();

  const rolesActivos = useMemo(
    () => (rolesQ.data ?? []).filter((r) => r.activo !== false),
    [rolesQ.data]
  );

  const onClose = (v) => {
    if (!v) {
      setForm(empty);
      setRolesSel(new Set());
      setFieldErrors({});
      setLocalError("");
    }
    onOpenChange(v);
  };

  const toggleRol = (idRol) => {
    setRolesSel((prev) => {
      const n = new Set(prev);
      if (n.has(idRol)) n.delete(idRol);
      else n.add(idRol);
      return n;
    });
  };

  const handleSubmit = async () => {
    setLocalError("");
    setFieldErrors({});
    const idRoles = [...rolesSel];
    const parsed = validateCrearUsuario({
      idTipoUsuario: form.idTipoUsuario ? Number(form.idTipoUsuario) : NaN,
      username: form.username,
      email: form.email,
      password: form.password,
      nombres: form.nombres,
      apellidos: form.apellidos || undefined,
      telefono: form.telefono || undefined,
      requiereCambioPassword: form.requiereCambioPassword,
      activo: form.activo,
      idRoles,
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    const d = parsed.data;
    try {
      await mut.mutateAsync({
        idTipoUsuario: d.idTipoUsuario,
        username: d.username,
        email: d.email,
        password: d.password,
        nombres: d.nombres,
        apellidos: d.apellidos ?? null,
        telefono: d.telefono ?? null,
        requiereCambioPassword: d.requiereCambioPassword,
        activo: d.activo,
        idRoles: d.idRoles,
        permisosExcepcionales: [],
      });
      onClose(false);
    } catch (e) {
      setLocalError(getApiErrorMessage(e, "No se pudo crear el usuario."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto bg-(--color-blanco) sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Nuevo usuario</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Se envía a <code className="text-xs">POST /api/Usuarios</code>. Contraseña mínimo 8 caracteres. Puedes
            asignar roles ahora o después desde la lista.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[55vh] gap-3 overflow-y-auto py-2 pr-1">
          <div className="grid gap-2">
            <Label htmlFor="nu-tipo" className="text-xs font-bold uppercase text-(--color-pagina)">
              Id tipo usuario
            </Label>
            <Input
              id="nu-tipo"
              type="number"
              min={1}
              value={form.idTipoUsuario}
              onChange={(e) => setForm((f) => ({ ...f, idTipoUsuario: e.target.value }))}
            />
            {fieldErrors.idTipoUsuario?.[0] ? (
              <p className="text-xs text-(--color-rojo)">{fieldErrors.idTipoUsuario[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nu-user" className="text-xs font-bold uppercase text-(--color-pagina)">
                Username
              </Label>
              <Input
                id="nu-user"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              {fieldErrors.username?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.username[0]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-email" className="text-xs font-bold uppercase text-(--color-pagina)">
                Correo
              </Label>
              <Input
                id="nu-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {fieldErrors.email?.[0] ? <p className="text-xs text-(--color-rojo)">{fieldErrors.email[0]}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nu-pass" className="text-xs font-bold uppercase text-(--color-pagina)">
              Contraseña
            </Label>
            <Input
              id="nu-pass"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {fieldErrors.password?.[0] ? (
              <p className="text-xs text-(--color-rojo)">{fieldErrors.password[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nu-nom" className="text-xs font-bold uppercase text-(--color-pagina)">
                Nombres
              </Label>
              <Input id="nu-nom" value={form.nombres} onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))} />
              {fieldErrors.nombres?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.nombres[0]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nu-ape" className="text-xs font-bold uppercase text-(--color-pagina)">
                Apellidos
              </Label>
              <Input id="nu-ape" value={form.apellidos} onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))} />
              {fieldErrors.apellidos?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.apellidos[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nu-tel" className="text-xs font-bold uppercase text-(--color-pagina)">
              Teléfono
            </Label>
            <Input id="nu-tel" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
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

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-(--color-pagina)">Roles iniciales (opcional)</Label>
            <ScrollArea className="h-40 rounded-md border border-border pr-2">
              <ul className="space-y-1 p-2">
                {rolesActivos.map((r) => (
                  <li key={r.idRol}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/80">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-(--color-pagina-2) shrink-0"
                        checked={rolesSel.has(r.idRol)}
                        onChange={() => toggleRol(r.idRol)}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{r.nombre}</span>
                        <span className="text-xs text-muted-foreground">{r.codigo}</span>
                      </span>
                    </label>
                  </li>
                ))}
                {!rolesActivos.length ? (
                  <li className="p-4 text-sm text-muted-foreground">No hay roles disponibles.</li>
                ) : null}
              </ul>
            </ScrollArea>
            {fieldErrors.idRoles?.[0] ? (
              <p className="text-xs text-(--color-rojo)">{fieldErrors.idRoles[0]}</p>
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
            {mut.isPending ? "Creando…" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
