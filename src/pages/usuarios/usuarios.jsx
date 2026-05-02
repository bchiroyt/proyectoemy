import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigationStore } from "@/context/useNavigationStore";
import { UsuariosListaPanel } from "./components/UsuariosListaPanel";
import { RolesYPermisosPanel } from "./components/RolesYPermisosPanel";
import { Users, Shield, Search, UserPlus } from "lucide-react";

const Usuarios = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const [tab, setTab] = useState("usuarios");
  const [searchQuery, setSearchQuery] = useState("");
  const [openNuevoUsuario, setOpenNuevoUsuario] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setTitulo("Usuarios y seguridad");
  }, [setTitulo]);

  useEffect(() => {
    const down = (e) => {
      if (tab !== "usuarios") return;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.querySelector?.("input")?.focus?.();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [tab]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <Button
            type="button"
            variant={tab === "usuarios" ? "default" : "outline"}
            className={
              tab === "usuarios"
                ? "bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("usuarios")}
          >
            <Users className="mr-2 size-4" />
            Usuarios
          </Button>
          <Button
            type="button"
            variant={tab === "roles" ? "default" : "outline"}
            className={
              tab === "roles"
                ? "bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("roles")}
          >
            <Shield className="mr-2 size-4" />
            Permisos
          </Button>
        </div>

        {tab === "usuarios" ? (
          <>
            <div className="flex flex-1 justify-center -4">
            <div ref={searchInputRef} className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-(--color-gris-letra)" />
              <Input
                placeholder="Buscar: nombre, correo, usuario, teléfono, id…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full border-border border-(--color-pagina-2) bg-(--color-pagina-2)/20 pl-9 shadow-sm"
                aria-label="Filtrar listado de usuarios"
              />
            </div>
            </div>

            <div className="flex flex-1 justify-end">
            <Button
              type="button"
              className="ml-auto shrink-0 bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
              onClick={() => setOpenNuevoUsuario(true)}
            >
              <UserPlus className="mr-2 size-4" />
              Nuevo usuario
            </Button>
            </div>
          </>
        ) : null}
      </div>

      {tab === "usuarios" ? (
        <UsuariosListaPanel
          searchQuery={searchQuery}
          nuevoUsuarioOpen={openNuevoUsuario}
          onNuevoUsuarioOpenChange={setOpenNuevoUsuario}
        />
      ) : (
        <RolesYPermisosPanel />
      )}
    </div>
  );
};

export default Usuarios;
