import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function fmtIso(v) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  } catch {
    return String(v);
  }
}

const emptyNipFields = {
  nip: "",
  confirmacionNip: "",
  credencialActivo: true,
};

export function getEmptyCredencialCajaForm() {
  return { assignNip: false, ...emptyNipFields };
}

/**
 * Sección reutilizable para NIP de caja (POS).
 * - create: checkbox para asignar al crear usuario
 * - edit: muestra credencial existente o formulario para crear una nueva
 */
export function CredencialCajaFormSection({
  mode = "create",
  assignNip,
  onAssignNipChange,
  nip,
  confirmacionNip,
  credencialActivo,
  onNipChange,
  onConfirmacionNipChange,
  onCredencialActivoChange,
  fieldErrors = {},
  credencial = null,
  credencialLoading = false,
  credencialError = null,
  changeNip = false,
  onChangeNipToggle,
}) {
  const showFields =
    mode === "create" ? assignNip : credencial ? changeNip : assignNip;

  return (
    <div className="space-y-3 rounded-md border border-border bg-(--color-pagina-4)/50 p-3">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase text-(--color-pagina)">NIP de caja (POS)</p>
        <p className="text-xs text-(--color-gris-letra)">
          PIN numérico de 4 a 10 dígitos para abrir caja, movimientos y acciones sensibles en punto de venta.
        </p>
      </div>

      {mode === "edit" && credencialLoading ? <Skeleton className="h-16 w-full" /> : null}

      {mode === "edit" && credencialError ? (
        <p className="text-xs text-(--color-rojo)">{credencialError}</p>
      ) : null}

      {mode === "edit" && !credencialLoading && credencial ? (
        <div className="rounded-md border border-border bg-(--color-blanco) px-3 py-2 text-xs text-(--color-gris-letra)">
          <p>
            <span className="font-semibold text-foreground">Estado credencial:</span>{" "}
            {credencial.activo ? (
              <span className="text-(--color-verde)">Activa</span>
            ) : (
              <span className="text-(--color-rojo)">Inactiva</span>
            )}
          </p>
          <p>
            <span className="font-semibold text-foreground">Creada:</span> {fmtIso(credencial.fechaCreacion)}
          </p>
          {credencial.fechaActualizacion ? (
            <p>
              <span className="font-semibold text-foreground">Actualizada:</span>{" "}
              {fmtIso(credencial.fechaActualizacion)}
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "create" ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
          <input
            type="checkbox"
            className="size-4 accent-(--color-pagina-2)"
            checked={assignNip}
            onChange={(e) => onAssignNipChange?.(e.target.checked)}
          />
          Asignar NIP de caja al crear
        </label>
      ) : null}

      {mode === "edit" && !credencialLoading && !credencial ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
          <input
            type="checkbox"
            className="size-4 accent-(--color-pagina-2)"
            checked={assignNip}
            onChange={(e) => onAssignNipChange?.(e.target.checked)}
          />
          Crear credencial de caja para este usuario
        </label>
      ) : null}

      {mode === "edit" && credencial ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
          <input
            type="checkbox"
            className="size-4 accent-(--color-pagina-2)"
            checked={changeNip}
            onChange={(e) => onChangeNipToggle?.(e.target.checked)}
          />
          Cambiar NIP
        </label>
      ) : null}

      {showFields ? (
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div className="grid gap-2">
              <Label htmlFor="cc-nip" className="text-xs font-bold uppercase text-(--color-pagina)">
                NIP
              </Label>
              <Input
                id="cc-nip"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="4–10 dígitos"
                value={nip}
                onChange={(e) => onNipChange?.(e.target.value.replace(/\D/g, ""))}
              />
              {fieldErrors.nip?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.nip[0]}</p>
              ) : null}
              {fieldErrors.nipNuevo?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.nipNuevo[0]}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cc-nip2" className="text-xs font-bold uppercase text-(--color-pagina)">
                Confirmar NIP
              </Label>
              <Input
                id="cc-nip2"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                placeholder="Repetir NIP"
                value={confirmacionNip}
                onChange={(e) => onConfirmacionNipChange?.(e.target.value.replace(/\D/g, ""))}
              />
              {fieldErrors.confirmacionNip?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.confirmacionNip[0]}</p>
              ) : null}
              {fieldErrors.confirmacionNipNuevo?.[0] ? (
                <p className="text-xs text-(--color-rojo)">{fieldErrors.confirmacionNipNuevo[0]}</p>
              ) : null}
            </div>
          </div>
          {(mode === "create" && assignNip) || (mode === "edit" && !credencial && assignNip) ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
              <input
                type="checkbox"
                className="size-4 accent-(--color-pagina-2)"
                checked={credencialActivo}
                onChange={(e) => onCredencialActivoChange?.(e.target.checked)}
              />
              Credencial de caja activa
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
