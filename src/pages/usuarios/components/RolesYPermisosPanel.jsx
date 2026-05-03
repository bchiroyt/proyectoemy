import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useActualizarPermisosRolMutation, usePermisosCatalogoQuery, useRolPermisosQuery, 
useRolesQuery } from "@/hooks/queries/useSeguridadQueries";
import { validateActualizarPermisosRol } from "@/lib/seguridadValidations";
import { getApiErrorMessage } from "@/lib/apiClient";
import { buildPermisoRows, permisosMapFromServer, permKey, sortAcciones } from "@/pages/usuarios/permisosMatrix";
import { CopiarRolDialog } from "./CopiarRolDialog";
import { NuevoRolDialog } from "./NuevoRolDialog";
import { Copy, Plus, Shield } from "lucide-react";

export function RolesYPermisosPanel() {
  const [selectedRolId, setSelectedRolId] = useState(null);
  const [localMap, setLocalMap] = useState(() => new Map());
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
      setLocalMap(new Map());
      return;
    }
    const fromServer = permisosMapFromServer(permsQ.data ?? []);
    const next = new Map();
    for (const row of rows) {
      const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
      next.set(k, fromServer.has(k) ? Boolean(fromServer.get(k)) : false);
    }
    setLocalMap(next);
  }, [selectedRolId, rows, permsQ.data]);

  const toggle = (row) => {
    const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
    setLocalMap((prev) => {
      const n = new Map(prev);
      n.set(k, !Boolean(n.get(k)));
      return n;
    });
  };

  const handleGuardarPermisos = async () => {
    setPermError("");
    const permisos = rows.map((row) => ({
      idModulo: row.idModulo,
      idSubmodulo: row.idSubmodulo,
      idAccion: row.idAccion,
      permitido: Boolean(localMap.get(permKey(row.idModulo, row.idSubmodulo, row.idAccion))),
    }));
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
    <div className="space-y-4">
      <Card className="border-border bg-(--color-pagina-4) shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-sm text-foreground">Cómo encajan roles y permisos por usuario</CardTitle>
          <CardDescription className="text-xs text-(--color-gris-letra) leading-relaxed">
            Los <strong>roles</strong> agrupan permisos por defecto (matriz a la derecha cuando eliges un rol). Las{" "}
            <strong>excepciones por usuario</strong> se gestionan en la pestaña <strong>Usuarios</strong>: botón{" "}
            <strong>Permisos</strong> en cada fila. Ahí defines módulo × acción solo para esa persona (API: permisos
            sin submódulo). Así los roles pueden mantenerse simples y las variaciones quedan a nivel usuario.
          </CardDescription>
        </CardHeader>
      </Card>

    <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
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
            <p className="p-4 text-sm text-(--color-rojo)">{getApiErrorMessage(loadErr)}</p>
          ) : (
            <ScrollArea className="h-[min(70vh,520px)]">
              <ul className="p-2">
                {(rolesQ.data ?? []).map((r) => (
                  <li key={r.idRol}>
                    <button
                      type="button"
                      onClick={() => setSelectedRolId(r.idRol)}
                      className={
                        selectedRolId === r.idRol
                          ? "mb-1 w-full rounded-md border border-(--color-pagina-2) bg-(--color-pagina-3) p-3 text-left text-sm font-semibold text-foreground"
                          : "mb-1 w-full rounded-md border border-transparent p-3 text-left text-sm text-foreground hover:bg-muted/80"
                      }
                    >
                      <span className="block">{r.nombre}</span>
                      <span className="text-xs text-muted-foreground">{r.codigo}</span>
                    </button>
                  </li>
                ))}
                {!rolesQ.data?.length && <li className="p-4 text-sm text-muted-foreground">Sin roles.</li>}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-(--color-blanco) shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-(--color-pagina-2)">Permisos por módulo y acción</CardTitle>
          <CardDescription className="text-(--color-gris-letra)">
            Basado en <code className="text-xs">modulos</code>, <code className="text-xs">submodulos</code> y{" "}
            <code className="text-xs">acciones</code> (CREATE, READ, UPDATE, DELETE) de tu base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRolId ? (
            <p className="text-sm text-muted-foreground">Selecciona un rol a la izquierda.</p>
          ) : permsQ.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : permsQ.isError ? (
            <p className="text-sm text-(--color-rojo)">{getApiErrorMessage(permsQ.error)}</p>
          ) : !rows.length ? (
            <p className="text-sm text-muted-foreground">
              El catálogo de permisos está vacío o la API no devolvió módulos/acciones. Verifica{" "}
              <code className="text-xs">GET /api/Permisos/catalogo</code>.
            </p>
          ) : (
            <>
              <ScrollArea className="h-[min(60vh,480px)] pr-3">
                <div className="space-y-4">
                  {groupedRows.map(({ meta, acciones: ars }) => (
                    <div key={`${meta.idModulo}|${meta.idSubmodulo ?? "null"}`} className="rounded-lg border border-border">
                      <div className="bg-(--color-pagina-4) px-3 py-2 text-sm font-semibold text-foreground">
                        {meta.etiquetaModulo}
                        {meta.etiquetaSub ? (
                          <span className="text-muted-foreground"> · {meta.etiquetaSub}</span>
                        ) : null}
                      </div>
                      <Separator />
                      <ul className="divide-y divide-border">
                        {ars.map((row) => (
                          <li key={permKey(row.idModulo, row.idSubmodulo, row.idAccion)} className="flex items-center justify-between gap-3 px-3 py-2">
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
              {permError ? <p className="mt-3 text-sm text-(--color-rojo)">{permError}</p> : null}
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={saveMut.isPending}
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
