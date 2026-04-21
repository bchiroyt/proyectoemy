import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/context/useNavigationStore";
import { UsuariosListaPanel } from "./components/UsuariosListaPanel";
import { RolesYPermisosPanel } from "./components/RolesYPermisosPanel";
import { Users, Shield } from "lucide-react";

const Usuarios = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const [tab, setTab] = useState("usuarios");

  useEffect(() => {
    setTitulo("Usuarios y seguridad");
  }, [setTitulo]);

  return (
    <div className="flex h-full flex-col bg-(--color-fondo-pagina)">
      <div className="mx-auto w-full max-w-7xl flex-1 p-6">
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-border bg-(--color-blanco) p-2 shadow-sm">
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
            Roles y permisos
          </Button>
        </div>

        {tab === "usuarios" ? <UsuariosListaPanel /> : <RolesYPermisosPanel />}
      </div>
    </div>
  );
};

export default Usuarios;
