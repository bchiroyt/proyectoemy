import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useActualizarPermisosRolMutation, usePermisosCatalogoQuery, useRolPermisosQuery, 
useRolesQuery } from "@/hooks/queries/useSeguridadQueries";
import { validateActualizarPermisosRol } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";
import { EstadoErrorCarga } from "@/components/shared/EstadoErrorCarga";
import { buildPermisoRows, buildPermisosRolPayload, permisosMapFromServer, permisosMapsEqual,
  permisosRolPayloadEqual, permKey, sortAcciones } from "@/pages/usuarios/permisosMatrix";
import { CopiarRolDialog } from "./CopiarRolDialog";
import { NuevoRolDialog } from "./NuevoRolDialog";
import { PermisosMatrizGrid } from "./PermisosMatrizGrid";
import { RolesListaCompacta } from "./RolesListaCompacta";
import { Copy, Plus, Shield } from "lucide-react";

export function RolesYPermisosPanel() {
  const [selectedRolId, setSelectedRolId] = useState(null);
  const [localMap, setLocalMap] = useState(() => new Map());
  const [initialPayload, setInitialPayload] = useState([]);
  const [permError, setPermError] = useState("");
  const [openCopiar, setOpenCopiar] = useState(false);
  const [openNuevo, setOpenNuevo] = useState(false);

  const rolesQ = useRolesQuery();
  const catQ = usePermisosCatalogoQuery();
  const permsQ = useRolPermisosQuery(selectedRolId);
  const saveMut = useActualizarPermisosRolMutation();

  const acciones = useMemo(() => sortAcciones(catQ.data?.acciones ?? []), [catQ.data?.acciones]);
  const modulos = catQ.data?.modulos ?? [];
  const rows = useMemo(() => buildPermisoRows(modulos, acciones), [modulos, acciones]);

  useEffect(() => {
    if (!selectedRolId || !rows.length) {
      setLocalMap((prev) => (prev.size === 0 ? prev : new Map()));
      setInitialPayload((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (permsQ.isLoading) {
      return;
    }

    const fromServer = permisosMapFromServer(permsQ.data ?? []);
    const next = new Map();
    for (const row of rows) {
      const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
      next.set(k, fromServer.has(k) ? Boolean(fromServer.get(k)) : false);
    }
    const payloadInicial = buildPermisosRolPayload(rows, next);

    setLocalMap((prev) => (permisosMapsEqual(prev, next) ? prev : next));
    setInitialPayload((prev) =>
      permisosRolPayloadEqual(prev, payloadInicial) ? prev : payloadInicial
    );
  }, [selectedRolId, rows, permsQ.data, permsQ.isLoading]);

  const payloadActual = useMemo(
    () => buildPermisosRolPayload(rows, localMap),
    [rows, localMap]
  );

  const hayCambios = useMemo(
    () => Boolean(selectedRolId) && !permisosRolPayloadEqual(initialPayload, payloadActual),
    [selectedRolId, initialPayload, payloadActual]
  );

  const toggle = (row) => {
    const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
    setLocalMap((prev) => {
      const n = new Map(prev);
      n.set(k, !Boolean(n.get(k)));
      return n;
    });
  };

  const setRowsChecked = (targetRows, value) => {
    setLocalMap((prev) => {
      const n = new Map(prev);
      for (const row of targetRows) {
        n.set(permKey(row.idModulo, row.idSubmodulo, row.idAccion), value);
      }
      return n;
    });
  };

  const allChecked = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((r) => Boolean(localMap.get(permKey(r.idModulo, r.idSubmodulo, r.idAccion)))),
    [rows, localMap]
  );

  const toggleAll = () => setRowsChecked(rows, !allChecked);
  const toggleGroup = (groupRows, value) => setRowsChecked(groupRows, value);

  const handleGuardarPermisos = async () => {
    if (!hayCambios) return;

    setPermError("");
    const permisos = payloadActual;
    const parsed = validateActualizarPermisosRol({ idRol: selectedRolId, permisos });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      setPermError(first || "Datos inconsistentes");
      return;
    }
    try {
      await saveMut.mutateAsync({ idRol: parsed.data.idRol, permisos: parsed.data.permisos });
    } catch (e) {
      setPermError(getApiErrorMessage(e, "No se pudieron guardar los permisos."));
    }
  };

  const groupedRows = useMemo(() => {
    const m = new Map();
    for (const row of rows) {
      const key = `${row.idModulo}|${row.idSubmodulo ?? "null"}`;
      if (!m.has(key)) m.set(key, { meta: row, acciones: [] });
      m.get(key).acciones.push(row);
    }
    return [...m.values()];
  }, [rows]);

  const loading = rolesQ.isLoading || catQ.isLoading;
  const loadErr = rolesQ.error || catQ.error;

  return (
    <div className="space-y-2">
      <Card className="border-border bg-(--color-pagina-4) shadow-sm">
        <CardHeader className="py-0">
          <CardTitle className="text-sm text-foreground">Cómo encajan roles y permisos por usuario</CardTitle>
          <CardDescription className="text-xs text-(--color-gris-letra) leading-relaxed">
            Los <strong>roles</strong> agrupan permisos por defecto (matriz a la derecha cuando eliges un rol). Las{" "}
            <strong>excepciones por usuario</strong> se gestionan en la pestaña <strong>Usuarios</strong>: botón{" "}
            <strong>Permisos</strong> en cada fila. Ahí defines módulo × acción solo para esa persona. Así los roles pueden mantenerse simples y las variaciones quedan a nivel usuario.
          </CardDescription>
        </CardHeader>
      </Card>

    <div className="grid gap-4 lg:grid-cols-[minmax(200px,240px)_1fr]">
      <Card className="border-border bg-(--color-blanco) shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-(--color-pagina-2)">
            <Shield className="size-5" />
            Roles
          </CardTitle>
          <CardDescription className="text-(--color-gris-letra)">Selecciona un rol para editar permisos.</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              className="bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
              onClick={() => setOpenNuevo(true)}
            >
              <Plus className="size-4" />
              Nuevo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-(--color-pagina) text-(--color-pagina) hover:bg-(--color-pagina)/10"
              onClick={() => setOpenCopiar(true)}
            >
              <Copy className="size-4" />
              Copiar rol
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : loadErr ? (
            <div className="p-4">
              <EstadoErrorCarga
                compact
                error={loadErr}
                nombreModulo="Roles"
                fallbackGenerico="No se pudieron cargar los roles."
              />
            </div>
          ) : (
            <ScrollArea className="h-[min(50vh,400px)]">
              <RolesListaCompacta
                roles={rolesQ.data ?? []}
                selectedRolId={selectedRolId}
                onSelect={setSelectedRolId}
              />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-(--color-blanco) shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-(--color-pagina-2)">Permisos del rol</CardTitle>
            {selectedRolId && !permsQ.isLoading && !permsQ.isError && rows.length ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-(--color-pagina) text-(--color-pagina) hover:bg-(--color-pagina)/10"
                onClick={toggleAll}
              >
                {allChecked ? "Desmarcar todo" : "Marcar todo"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!selectedRolId ? (
            <p className="text-sm text-muted-foreground">Selecciona un rol a la izquierda.</p>
          ) : permsQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : permsQ.isError ? (
            <EstadoErrorCarga
              compact
              error={permsQ.error}
              nombreModulo="permisos del rol"
              fallbackGenerico="No se pudieron cargar los permisos."
              onReintentar={() => permsQ.refetch()}
            />
          ) : !rows.length ? (
            <p className="text-sm text-muted-foreground">
              El catálogo de permisos está vacío o la API no devolvió módulos/acciones. Verifica
            </p>
          ) : (
            <>
              <ScrollArea className="h-[min(55vh,520px)] pr-2">
                <PermisosMatrizGrid
                  groupedRows={groupedRows}
                  localMap={localMap}
                  onToggle={toggle}
                  onToggleGroup={toggleGroup}
                />
              </ScrollArea>
              {permError ? <p className="mt-3 text-sm text-(--color-rojo)">{permError}</p> : null}
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={saveMut.isPending || permsQ.isLoading || !hayCambios}
                  className="bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
                  onClick={handleGuardarPermisos}
                >
                  {saveMut.isPending ? "Guardando…" : "Guardar permisos"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CopiarRolDialog open={openCopiar} onOpenChange={setOpenCopiar} roles={rolesQ.data ?? []} />
      <NuevoRolDialog open={openNuevo} onOpenChange={setOpenNuevo} />
    </div>
    </div>
  );
}
