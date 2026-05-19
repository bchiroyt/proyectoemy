import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useEffect, useState } from "react";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { MiCajaPanel } from "../caja/components/MiCajaPanel";
import { CajasAbiertasPanel } from "../caja/components/CajasAbiertasPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, List } from "lucide-react";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";

const ULTIMO_CIERRE_MOCK = {
  fecha: "6 de Marzo",
  balanceEfectivo: 2840.5,
};

const POS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const { data: cajaRes, isLoading, isError } = useMiCajaActivaQuery();
  const [tab, setTab] = useState("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setTitulo("POS");
  }, [setTitulo]);

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;
  }

  const tieneCajaActiva = cajaRes?.data != null;

  return (
    <div className="flex h-full flex-col bg-gray-200">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <Button
            type="button"
            variant={tab === "inicio" ? "default" : "outline"}
            className={
              tab === "inicio"
                ? "bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("inicio")}
          >
            <LayoutDashboard className="mr-2 size-4" />
            Panel POS
          </Button>
          <Button
            type="button"
            variant={tab === "abiertas" ? "default" : "outline"}
            className={
              tab === "abiertas"
                ? "bg-(--color-pagina-2) text-(--color-blanco) hover:bg-(--color-pagina-2)/90"
                : "border-(--color-gris-claro-2) text-(--color-gris-letra)"
            }
            onClick={() => setTab("abiertas")}
          >
            <List className="mr-2 size-4" />
            Cajas Abiertas
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

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {tab === "abiertas" ? (
          <CajasAbiertasPanel searchQuery={searchQuery} page={page} setPage={setPage} />
        ) : tieneCajaActiva ? (
          <div className="max-w-6xl mx-auto space-y-6">
            <MiCajaPanel />
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => navigate("/pos/ventas")}
                className="bg-(--color-pagina) hover:bg-(--color-pagina)/90 text-white font-bold px-12 py-4 rounded-xl shadow-md transition text-lg"
              >
                Ir a Ventas
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-full w-full flex items-center justify-center relative px-4 py-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10 sm:px-10 sm:py-12 w-full max-w-xl text-center relative">
              <button
                type="button"
                onClick={() => navigate("/panel-control")}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2 bg-(--color-pos-boton-primario) text-(--color-blanco) px-3 py-1.5 text-sm rounded-lg shadow-sm hover:bg-(--color-pos-boton-primario-hover) transition"
              >
                Regresar
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-8 mt-4">
                Modas y Variedades EMY
              </h2>

              <button
                type="button"
                onClick={() => navigate("/pos/apertura")}
                className="bg-pink-200 hover:bg-pink-300 text-gray-900 font-bold px-10 py-3 rounded-xl shadow-sm transition"
              >
                Abrir Caja
              </button>

              <div className="my-10 border-t border-gray-200" />

              <div className="space-y-4 text-left text-lg">
                <div className="flex justify-between items-center gap-4 text-gray-900">
                  <span className="font-bold">Fecha de cierre</span>
                  <span className="font-bold">{ULTIMO_CIERRE_MOCK.fecha}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-gray-900">
                  <span className="font-bold">Último balance de cierre de efectivo</span>
                  <span className="font-bold tabular-nums">
                    Q {ULTIMO_CIERRE_MOCK.balanceEfectivo.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
