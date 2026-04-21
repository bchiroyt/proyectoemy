import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, User, Edit2 } from "lucide-react";
import { useUsuariosQuery, useRolesQuery } from "@/hooks/queries/useSeguridadQueries";
import { getApiErrorMessage } from "@/lib/apiClient";
import { AsignarRolesUsuarioDialog } from "./AsignarRolesUsuarioDialog";

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

export function UsuariosListaPanel() {
  const [openCommand, setOpenCommand] = useState(false);
  const [rolDialogUser, setRolDialogUser] = useState(null);
  const usuariosQ = useUsuariosQuery();
  const rolesQ = useRolesQuery();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const lista = usuariosQ.data ?? [];

  const filteredHint = useMemo(() => `${lista.length} usuario(s)`, [lista.length]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-1 cursor-text items-center rounded-md border border-border bg-(--color-pagina-3) px-3 py-2 text-muted-foreground shadow-inner max-w-md transition-colors hover:bg-(--color-gris-claro-2)/50"
          onClick={() => setOpenCommand(true)}
        >
          <Search className="mr-3 size-5 text-(--color-gris-letra)" />
          <span className="text-sm font-medium text-(--color-gris-letra)">Buscar usuarios…</span>
          <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-border bg-(--color-blanco) px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <p className="text-xs text-(--color-gris-letra)">{filteredHint}</p>
      </div>

      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Nombre, correo o usuario…" />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Usuarios">
            {lista.map((u) => (
              <CommandItem
                key={u.idUsuario}
                onSelect={() => setOpenCommand(false)}
                className="cursor-pointer"
              >
                <User className="mr-2 size-4" />
                <span>
                  {u.nombres} {u.apellidos}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

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
        <div className="overflow-hidden rounded-b-lg border border-t border-border bg-(--color-blanco) shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[72px] text-center font-bold"> </TableHead>
                <TableHead className="font-bold">Usuario</TableHead>
                <TableHead className="font-bold">Correo</TableHead>
                <TableHead className="font-bold">Roles</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-center font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((u) => {
                const rolItems = roleBadgeItems(u);
                return (
                <TableRow key={u.idUsuario} className="hover:bg-muted/30">
                  <TableCell className="text-center">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-border bg-(--color-pagina-4)">
                      <User className="size-6 text-foreground" strokeWidth={1.2} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">
                      {u.nombres} {u.apellidos}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.username}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rolItems.length ? (
                        rolItems.map((item) => (
                          <Badge key={item.key} variant="secondary" className="bg-(--color-pagina-3) text-foreground">
                            {item.label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin rol asignado</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.activo ? "default" : "destructive"} className={u.activo ? "bg-(--color-pagina-2) text-(--color-blanco)" : ""}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-(--color-pagina-2) text-(--color-pagina-2) hover:bg-(--color-pagina-2)/10"
                      onClick={() => setRolDialogUser(u)}
                    >
                      <Edit2 className="size-4" />
                      Roles
                    </Button>
                  </TableCell>
                </TableRow>
              );
              })}
              {!lista.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No hay usuarios o la API devolvió una lista vacía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AsignarRolesUsuarioDialog
        open={Boolean(rolDialogUser)}
        onOpenChange={(v) => {
          if (!v) setRolDialogUser(null);
        }}
        usuario={rolDialogUser}
        rolesCatalogo={rolesQ.data ?? []}
      />
    </div>
  );
}
