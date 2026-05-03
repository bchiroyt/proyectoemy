import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermisosCatalogoQuery, useUsuarioPermisosExcepcionalesMutation, useUsuarioQuery } from "@/hooks/queries/useSeguridadQueries";
import { validateActualizarPermisosUsuario } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";
import { buildUsuarioExcepcionRows, permisosMapFromUsuarioExcepciones, permKey, sortAcciones } from "@/pages/usuarios/permisosMatrix";


export function PermisosUsuarioDialog({ open, onOpenChange, idUsuario }) {
  const [localMap, setLocalMap] = useState(() => new Map());
  const [permError, setPermError] = useState("");
  const userQ = useUsuarioQuery(idUsuario, { enabled: open && Number(idUsuario) > 0 });
  const catQ = usePermisosCatalogoQuery({ enabled: open });
  const saveMut = useUsuarioPermisosExcepcionalesMutation();

  const acciones = useMemo(() => sortAcciones(catQ.data?.acciones ?? []), [catQ.data?.acciones]);
  const modulos = catQ.data?.modulos ?? [];
  const rows = useMemo(() => buildUsuarioExcepcionRows(modulos, acciones), [modulos, acciones]);

  useEffect(() => {
    if (!open || !rows.length) {
      setLocalMap(new Map());
      return;
    }
    const fromServer = permisosMapFromUsuarioExcepciones(userQ.data?.permisosExcepcionales ?? []);
    const next = new Map();
    for (const row of rows) {
      const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
      next.set(k, fromServer.has(k) ? Boolean(fromServer.get(k)) : false);
    }
    setLocalMap(next);
  }, [open, rows, userQ.data?.permisosExcepcionales]);

  const toggle = (row) => {
    const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
    setLocalMap((prev) => {
      const n = new Map(prev);
      n.set(k, !Boolean(n.get(k)));
      return n;
    });
  };

  const groupedRows = useMemo(() => {
    const m = new Map();
    for (const row of rows) {
      const key = String(row.idModulo);
      if (!m.has(key)) m.set(key, { meta: row, acciones: [] });
      m.get(key).acciones.push(row);
    }
    return [...m.values()];
  }, [rows]);

  const handleGuardar = async () => {
    setPermError("");
    const permisosExcepcionales = rows.map((row) => ({
      idModulo: row.idModulo,
      idAccion: row.idAccion,
      permitido: Boolean(localMap.get(permKey(row.idModulo, row.idSubmodulo, row.idAccion))),
    }));
    const parsed = validateActualizarPermisosUsuario({ idUsuario, permisosExcepcionales });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      setPermError(first || "Datos inconsistentes");
      return;
    }
    try {
      await saveMut.mutateAsync({
        idUsuario: parsed.data.idUsuario,
        permisosExcepcionales: parsed.data.permisosExcepcionales,
      });
      onOpenChange(false);
    } catch (e) {
      setPermError(getApiErrorMessage(e, "No se pudieron guardar los permisos."));
    }
  };

  const loading = userQ.isLoading || catQ.isLoading;
  const loadErr = userQ.error || catQ.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,760px)] overflow-hidden bg-(--color-blanco) sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Permisos por usuario (excepciones)</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Matriz <strong>módulo × acción</strong> (CREATE, READ, UPDATE, DELETE) al nivel de módulo, compatible con{" "}
            <code className="text-xs">PUT /api/Usuarios/{"{id}"}/permisos-excepcionales</code>. Los roles siguen definiendo
            permisos base; aquí ajustas excepciones solo para este usuario.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : loadErr ? (
          <p className="text-sm text-(--color-rojo)">{getApiErrorMessage(loadErr)}</p>
        ) : !rows.length ? (
          <p className="text-sm text-muted-foreground">
            No hay catálogo de módulos/acciones (GET /api/Permisos/catalogo). La estructura quedará lista cuando el
            backend exponga datos.
          </p>
        ) : (
          <>
            <ScrollArea className="h-[min(55vh,420px)] pr-3">
              <div className="space-y-4">
                {groupedRows.map(({ meta, acciones: ars }) => (
                  <div key={meta.idModulo} className="rounded-lg border border-border">
                    <div className="bg-(--color-pagina-4) px-3 py-2 text-sm font-semibold text-foreground">
                      {meta.etiquetaModulo}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">Módulo · acciones</span>
                    </div>
                    <Separator />
                    <ul className="divide-y divide-border">
                      {ars.map((row) => (
                        <li
                          key={permKey(row.idModulo, row.idSubmodulo, row.idAccion)}
                          className="flex items-center justify-between gap-3 px-3 py-2"
                        >
                          <div>
                            <span className="text-sm font-medium text-foreground">{row.etiquetaAccion}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{row.codigoAccion}</span>
                          </div>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-(--color-gris-letra)">
                            <span className="text-xs uppercase">Permitido</span>
                            <input
                              type="checkbox"
                              className="size-4 accent-(--color-pagina-2)"
                              checked={Boolean(localMap.get(permKey(row.idModulo, row.idSubmodulo, row.idAccion)))}
                              onChange={() => toggle(row)}
                            />
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {permError ? <p className="text-sm text-(--color-rojo)">{permError}</p> : null}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            disabled={saveMut.isPending || !rows.length}
            className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
            onClick={handleGuardar}
          >
            {saveMut.isPending ? "Guardando…" : "Guardar permisos del usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
