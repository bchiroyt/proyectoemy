import { LayoutDashboard, List } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";import { useEffect, useState } from "react";
import { useMiCajaActivaQuery } from "@/hooks/queries/useCajaQueries";
import { MiCajaPanel } from "../caja/components/MiCajaPanel";
import { CajasAbiertasPanel } from "../caja/components/CajasAbiertasPanel";
import { SinCajaActivaCard } from "../caja/components/SinCajaActivaCard";
import { Skeleton } from "@/components/ui/skeleton";

const POS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const { data: cajaRes, isLoading } = useMiCajaActivaQuery();  const [page, setPage] = useState(1);

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
              <SinCajaActivaCard variant="pos" showUltimoCierre />
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
