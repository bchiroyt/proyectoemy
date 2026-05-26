import React, { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PermisosMatrizGrid } from "./PermisosMatrizGrid";
import {
  usePermisosCatalogoQuery,
  useUsuarioPermisosExcepcionalesMutation,
  useUsuarioQuery,
  qkPermisosRol,
} from "@/hooks/queries/useSeguridadQueries";
import { validateActualizarPermisosUsuario } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";
import { fetchPermisosByRol } from "@/services/permisosService";
import {
  buildPermisosExcepcionalesPayload,
  buildUsuarioExcepcionRows,
  excepcionKeysFromUsuario,
  permisosExcepcionalesPayloadEqual,
  permisosMapFromRoles,
  permisosMapFromUsuarioExcepciones,
  permisosMapsEqual,
  permKey,
  sortAcciones,
} from "@/pages/usuarios/permisosMatrix";

const EMPTY = [];

export function PermisosUsuarioDialog({ open, onOpenChange, idUsuario }) {
  const [localMap, setLocalMap] = useState(() => new Map());
  const [initialPayload, setInitialPayload] = useState([]);
  const [permError, setPermError] = useState("");
  const userQ = useUsuarioQuery(idUsuario, { enabled: open && Number(idUsuario) > 0 });
  const catQ = usePermisosCatalogoQuery({ enabled: open });
  const saveMut = useUsuarioPermisosExcepcionalesMutation();

  const roleIds = useMemo(
    () => (userQ.data?.roles ?? []).map((r) => r.idRol).filter((id) => Number(id) > 0),
    [userQ.data?.roles]
  );

  const rolPermsQueries = useQueries({
    queries: roleIds.map((idRol) => ({
      queryKey: qkPermisosRol(idRol),
      queryFn: () => fetchPermisosByRol(idRol),
      enabled: open && Number(idUsuario) > 0,
      staleTime: 15_000,
    })),
  });

  const acciones = useMemo(() => sortAcciones(catQ.data?.acciones ?? []), [catQ.data?.acciones]);
  const modulos = catQ.data?.modulos ?? EMPTY;
  const rows = useMemo(() => buildUsuarioExcepcionRows(modulos, acciones), [modulos, acciones]);

  const rolPermsLists = useMemo(
    () => rolPermsQueries.map((q) => q.data ?? []),
    [roleIds, rolPermsQueries.map((q) => q.dataUpdatedAt).join(",")]
  );

  const rolBaseMap = useMemo(() => permisosMapFromRoles(rolPermsLists), [rolPermsLists]);

  const excepcionKeys = useMemo(
    () => excepcionKeysFromUsuario(userQ.data?.permisosExcepcionales ?? []),
    [userQ.data?.permisosExcepcionales]
  );

  const rolPermsLoading = rolPermsQueries.some((q) => q.isLoading);
  const rolPermsError = rolPermsQueries.find((q) => q.error)?.error;

  useEffect(() => {
    if (!open) {
      setLocalMap((prev) => (prev.size === 0 ? prev : new Map()));
      setInitialPayload((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (!rows.length || userQ.isLoading || rolPermsLoading) {
      return;
    }

    const excepciones = permisosMapFromUsuarioExcepciones(userQ.data?.permisosExcepcionales ?? []);
    const next = new Map();

    for (const row of rows) {
      const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
      if (excepcionKeys.has(k)) {
        next.set(k, Boolean(excepciones.get(k)));
      } else {
        next.set(k, Boolean(rolBaseMap.get(k)));
      }
    }

    const payloadInicial = buildPermisosExcepcionalesPayload(rows, next, rolBaseMap);

    setLocalMap((prev) => (permisosMapsEqual(prev, next) ? prev : next));
    setInitialPayload((prev) =>
      permisosExcepcionalesPayloadEqual(prev, payloadInicial) ? prev : payloadInicial
    );
  }, [open, rows, userQ.data?.permisosExcepcionales, userQ.isLoading, rolPermsLoading, rolBaseMap, excepcionKeys]);

  const payloadActual = useMemo(
    () => buildPermisosExcepcionalesPayload(rows, localMap, rolBaseMap),
    [rows, localMap, rolBaseMap]
  );

  const hayCambios = useMemo(
    () => !permisosExcepcionalesPayloadEqual(initialPayload, payloadActual),
    [initialPayload, payloadActual]
  );

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
    if (!hayCambios) return;

    setPermError("");

    if (rolPermsLoading) {
      setPermError("Espere a que carguen los permisos del rol antes de guardar.");
      return;
    }

    const permisosExcepcionales = payloadActual;

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

  const loading = userQ.isLoading || catQ.isLoading || rolPermsLoading;
  const loadErr = userQ.error || catQ.error || rolPermsError;

  const rolesLabel = (userQ.data?.roles ?? []).map((r) => r.nombre).filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,760px)] overflow-hidden bg-(--color-blanco) sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-(--color-pagina-2)">Permisos por usuario</DialogTitle>
          <DialogDescription className="text-(--color-gris-letra)">
            Los permisos del <strong>rol</strong> se aplican automáticamente
            {rolesLabel ? (
              <>
                {" "}
                (<span className="font-medium">{rolesLabel}</span>)
              </>
            ) : (
              " (asigne un rol al usuario si aún no tiene)"
            )}
            . Aquí solo guarda <strong>excepciones</strong> que sumen o quiten permisos respecto al rol.
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
            No hay catálogo de módulos/acciones (GET /api/Permisos/catalogo).
          </p>
        ) : (
          <>
            <ScrollArea className="h-[min(55vh,480px)] pr-2">
              <PermisosMatrizGrid
                groupedRows={groupedRows}
                localMap={localMap}
                onToggle={toggle}
                renderAccionExtra={(row, k, checked) => {
                  const desdeRol = Boolean(rolBaseMap.get(k));
                  const esExcepcion = checked !== desdeRol;
                  const viaRol = desdeRol && checked && !esExcepcion;
                  if (!viaRol && !esExcepcion) return null;
                  return (
                    <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                      {viaRol ? (
                        <span className="text-(--color-pagina-2)">Del rol</span>
                      ) : (
                        <span className="text-amber-700">Excepción</span>
                      )}
                    </span>
                  );
                }}
              />
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
            disabled={saveMut.isPending || !rows.length || rolPermsLoading || !hayCambios}
            className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
            onClick={handleGuardar}
          >
            {saveMut.isPending ? "Guardando…" : "Guardar excepciones"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
