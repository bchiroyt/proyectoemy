import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserPlus, Edit2, Shield, UserX, Search } from "lucide-react";
import { useUsuariosQuery, useRolesQuery } from "@/hooks/queries/useSeguridadQueries";
import { useAuthStore } from "@/context/useAuthStore";
import { getApiErrorMessage } from "@/lib/apiClient";
import { AsignarRolesUsuarioDialog } from "./AsignarRolesUsuarioDialog";
import { EditarUsuarioDialog } from "./EditarUsuarioDialog";
import { PermisosUsuarioDialog } from "./PermisosUsuarioDialog";
import { DesactivarUsuarioDialog } from "./DesactivarUsuarioDialog";
import { NuevoUsuarioDialog } from "./NuevoUsuarioDialog";

function roleBadgeItems(u) {
  if (u.roles?.length) {
    return u.roles
      .filter((r) => r?.nombre)
      .map((r) => ({ key: `rol-${r.idRol}`, label: r.nombre }));
  }
  if (u.nombreRol) return [{ key: "rol-nombre", label: u.nombreRol }];
  if (u.nombreTipoUsuario) return [{ key: "tipo", label: u.nombreTipoUsuario }];
  return [];
}

function matchesQuery(u, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [
    u.idUsuario,
    u.username,
    u.email,
    u.nombres,
    u.apellidos,
    u.telefono,
    u.nombreTipoUsuario,
    ...(u.roles?.map((r) => r.nombre) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

export function UsuariosListaPanel() {
  const [query, setQuery] = useState("");
  const [openNuevo, setOpenNuevo] = useState(false);
  const [rolDialogUser, setRolDialogUser] = useState(null);
  const [editId, setEditId] = useState(null);
  const [permisosId, setPermisosId] = useState(null);
  const [desactivarUsuario, setDesactivarUsuario] = useState(null);
  const searchInputRef = useRef(null);
  const miUsuarioId = useAuthStore((s) => s.user?.idUsuario);
  const usuariosQ = useUsuariosQuery();
  const rolesQ = useRolesQuery();

  const lista = usuariosQ.data ?? [];
  const filtrados = useMemo(() => lista.filter((u) => matchesQuery(u, query)), [lista, query]);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.querySelector?.("input")?.focus?.();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filteredHint = useMemo(
    () => `${filtrados.length} de ${lista.length} usuario(s) en la tabla`,
    [filtrados.length, lista.length]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-md space-y-1">
          <label className="text-xs font-bold uppercase text-(--color-pagina-2)">Filtrar listado</label>
          <div ref={searchInputRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-(--color-gris-letra)" />
            <Input
              placeholder="Nombre, correo, usuario, teléfono, id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 border-border border-(--color-pagina-2) bg-(--color-pagina-2)/20 pl-9 shadow-sm"
            />
          </div>
          <p className="text-xs text-(--color-pagina-2)">
            {filteredHint}
            <span className="ml-2 rounded border border-border bg-(--color-pagina-3) px-1.5 font-mono text-[10px] text-muted-foreground">
              Ctrl+K
            </span>
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
          onClick={() => setOpenNuevo(true)}
        >
          <UserPlus className="mr-2 size-4" />
          Nuevo usuario
        </Button>
      </div>

      {usuariosQ.isLoading ? (
        <div className="space-y-2 rounded-lg border border-border bg-(--color-blanco) p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : usuariosQ.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-(--color-blanco) p-4 text-sm text-(--color-rojo)">
          {getApiErrorMessage(usuariosQ.error, "No se pudieron cargar los usuarios.")}
        </div>
      ) : (
        <ScrollArea className="w-full rounded-lg border border-border bg-(--color-blanco) shadow-sm">
          <div className="min-w-[1100px]">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="whitespace-nowrap font-bold">ID</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Username</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Correo</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Nombres</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Apellidos</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Teléfono</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Tipo usuario</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Roles</TableHead>
                  <TableHead className="whitespace-nowrap font-bold">Estado</TableHead>
                  <TableHead className="min-w-[220px] text-center font-bold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((u) => {
                  const rolItems = roleBadgeItems(u);
                  const esMiUsuario = sameUserId(miUsuarioId, u.idUsuario);
                  return (
                    <TableRow key={u.idUsuario} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap font-mono text-xs">{u.idUsuario}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">{u.username}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{u.nombres}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{u.apellidos || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{u.telefono || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {u.idTipoUsuario != null ? (
                          <span>
                            {u.idTipoUsuario}
                            {u.nombreTipoUsuario ? (
                              <span className="ml-1 text-muted-foreground">({u.nombreTipoUsuario})</span>
                            ) : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {rolItems.length ? (
                            rolItems.map((item) => (
                              <Badge
                                key={item.key}
                                variant="secondary"
                                className="bg-(--color-pagina-3) text-foreground"
                              >
                                {item.label}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin rol</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.activo ? "default" : "destructive"}
                          className={u.activo ? "bg-(--color-pagina-2) text-(--color-blanco)" : ""}
                        >
                          {u.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-(--color-pagina-2) text-(--color-pagina-2) hover:bg-(--color-pagina-2)/10"
                            onClick={() => setEditId(u.idUsuario)}
                          >
                            <Edit2 className="size-3.5" />
                            Editar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-(--color-pagina-2) text-(--color-pagina-2) hover:bg-(--color-pagina-2)/10"
                            onClick={() => setRolDialogUser(u)}
                          >
                            Roles
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-(--color-pagina) text-(--color-pagina) hover:bg-(--color-pagina)/10"
                            onClick={() => setPermisosId(u.idUsuario)}
                          >
                            <Shield className="size-3.5" />
                            Permisos
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!u.activo || esMiUsuario}
                            title={
                              esMiUsuario
                                ? "No puedes desactivar tu propia cuenta mientras tienes sesión iniciada."
                                : undefined
                            }
                            className="border-(--color-rojo)/40 text-(--color-rojo) hover:bg-(--color-rojo)/5 disabled:opacity-50"
                            onClick={() => !esMiUsuario && setDesactivarUsuario(u)}
                          >
                            <UserX className="size-3.5" />
                            Desactivar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtrados.length && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      {lista.length ? "Ningún usuario coincide con el filtro." : "No hay usuarios en esta página."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <p className="text-xs text-(--color-gris-letra)">
        Nota: la lista paginada puede no incluir todos los campos; al pulsar <strong>Editar</strong> se cargan los datos
        completos con <code className="text-[11px]">GET /api/Usuarios/{"{id}"}</code>.
      </p>

      <NuevoUsuarioDialog open={openNuevo} onOpenChange={setOpenNuevo} />

      <AsignarRolesUsuarioDialog
        open={Boolean(rolDialogUser)}
        onOpenChange={(v) => {
          if (!v) setRolDialogUser(null);
        }}
        usuario={rolDialogUser}
        rolesCatalogo={rolesQ.data ?? []}
      />

      <EditarUsuarioDialog open={Boolean(editId)} onOpenChange={(v) => !v && setEditId(null)} idUsuario={editId} />

      <PermisosUsuarioDialog
        open={Boolean(permisosId)}
        onOpenChange={(v) => !v && setPermisosId(null)}
        idUsuario={permisosId}
      />

      <DesactivarUsuarioDialog
        open={Boolean(desactivarUsuario)}
        onOpenChange={(v) => !v && setDesactivarUsuario(null)}
        usuario={desactivarUsuario}
        idUsuarioSesion={miUsuarioId}
      />
    </div>
  );
}
