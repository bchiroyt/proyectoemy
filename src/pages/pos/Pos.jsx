import { LayoutDashboard, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useEffect, useState } from "react";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { MiCajaPanel } from "../caja/components/MiCajaPanel";
import { CajasAbiertasPanel } from "../caja/components/CajasAbiertasPanel";
import { Skeleton } from "@/components/ui/skeleton";

const ULTIMO_CIERRE_MOCK = {
  fecha: "6 de Marzo",
  balanceEfectivo: 2840.5,
};

const POS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();
  const { data: cajaRes, isLoading } = useMiCajaActivaQuery();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setTitulo("POS");
  }, [setTitulo]);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const tieneCajaActiva = cajaRes?.data != null;

  return (
    <div className="flex h-full flex-col bg-gray-200">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="size-5 text-(--color-pagina-2)" />
              <h2 className="text-lg font-bold text-(--color-negro)">Mi caja</h2>
            </div>

            {tieneCajaActiva ? (
              <MiCajaPanel />
            ) : (
              <div className="rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">Modas y Variedades EMY</h3>
                <p className="mb-8 text-sm text-(--color-gris-letra)">
                  No tienes una caja activa en este equipo. Abre tu turno con un arqueo inicial para operar.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/pos/apertura")}
                  className="rounded-xl bg-pink-200 px-10 py-3 font-bold text-gray-900 shadow-sm transition hover:bg-pink-300"
                >
                  Abrir Caja
                </button>

                <div className="mx-auto my-8 max-w-md border-t border-gray-200" />

                <div className="mx-auto max-w-md space-y-3 text-left text-base">
                  <div className="flex items-center justify-between gap-4 text-gray-900">
                    <span className="font-bold">Fecha de cierre</span>
                    <span className="font-bold">{ULTIMO_CIERRE_MOCK.fecha}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-gray-900">
                    <span className="font-bold">Último balance de cierre de efectivo</span>
                    <span className="font-bold tabular-nums">
                      Q {ULTIMO_CIERRE_MOCK.balanceEfectivo.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <List className="size-5 text-(--color-pagina-2)" />
              <h2 className="text-lg font-bold text-(--color-negro)">Cajas abiertas</h2>
            </div>
            <CajasAbiertasPanel page={page} setPage={setPage} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default POS;
