import React, { useEffect, useState } from "react";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/context/useNavigationStore";
import { UsuariosListaPanel } from "./components/UsuariosListaPanel";
import { RolesYPermisosPanel } from "./components/RolesYPermisosPanel";
import { Users, Shield, UserPlus } from "lucide-react";
import Paginacion from "@/components/shared/Paginacion";
import { useUsuariosQuery } from "@/hooks/queries/useSeguridadQueries";

const Usuarios = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const [tab, setTab] = useState("usuarios");
  const [searchQuery, setSearchQuery] = useState("");
  const [openNuevoUsuario, setOpenNuevoUsuario] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const usuariosQ = useUsuariosQuery({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery,
  });

  const totalRegistros = usuariosQ.data?.totalCount ?? 0; // Esto debería venir de tu query de usuarios
  const totalPages = usuariosQ.data?.totalPages ?? 1;
  const from = totalRegistros === 0 ? 0 : (page - 1 ) * PAGE_SIZE + 1;
  const to = Math.min(from + PAGE_SIZE - 1, totalRegistros);
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    setTitulo("Usuarios y seguridad");
  }, [setTitulo]);



  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
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
            <div className="flex flex-1 justify-center px-4">
            <BuscadorPrincipal 
              placeholder="Buscar: nombre, correo, usuario..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
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
            <div className="p-2"></div>
            <Paginacion
                from={from}
                to={to}
                total={totalRegistros}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                disablePrev={page <= 1}
                disableNext={page >= totalPages}
                isLoading={usuariosQ.isLoading}
              />

            </div>
          </>
        ) : null}



      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-4">
      {tab === "usuarios" ? (
        <UsuariosListaPanel
          usuarios={usuariosQ.data?.items ?? []}
          isLoading={usuariosQ.isLoading}
          isError={usuariosQ.isError}
          error={usuariosQ.error}
          searchQuery={searchQuery}
          nuevoUsuarioOpen={openNuevoUsuario}
          onNuevoUsuarioOpenChange={setOpenNuevoUsuario}
        />
      ) : (
        <RolesYPermisosPanel />
      )}
      </div>
    </div>
  );
};

export default Usuarios;
