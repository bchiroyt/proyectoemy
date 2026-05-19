import { useEffect, useState } from "react";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/context/useNavigationStore";
import { MiCajaPanel } from "./components/MiCajaPanel";
import { CajasAbiertasPanel } from "./components/CajasAbiertasPanel";
import { LayoutDashboard, List } from "lucide-react";

const CajaPage = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const [tab, setTab] = useState("mi_caja");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setTitulo("Gestión de cajas");
  }, [setTitulo]);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <Button
            type="button"
            variant={tab === "mi_caja" ? "default" : "outline"}
            className={
              tab === "mi_caja"
                ? "bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("mi_caja")}
          >
            <LayoutDashboard className="mr-2 size-4" />
            Mi caja activa
          </Button>
          <Button
            type="button"
            variant={tab === "abiertas" ? "default" : "outline"}
            className={
              tab === "abiertas"
                ? "bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-borde-button)"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("abiertas")}
          >
            <List className="mr-2 size-4" />
            Cajas abiertas
          </Button>
        </div>

        {tab === "abiertas" && (
          <div className="flex flex-1 justify-center px-4">
            <BuscadorPrincipal
              placeholder="Buscar caja por usuario o ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-(--color-pagina-4)">
        {tab === "mi_caja" ? (
          <MiCajaPanel />
        ) : (
          <CajasAbiertasPanel searchQuery={searchQuery} page={page} setPage={setPage} />
        )}
      </div>
    </div>
  );
};

export default CajaPage;
