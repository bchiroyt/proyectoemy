import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { useNavigationStore } from "@/context/useNavigationStore";
import { Skeleton } from "@/components/ui/skeleton";
import { QK_PRODUCTOS, useProductosListQuery } from "@/hooks/queries/useProductosQueries";

const PAGE_SIZE = 50;

const Inventario = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const [skeletonMaxElapsed, setSkeletonMaxElapsed] = useState(false);

  const productosQ = useProductosListQuery({ page, pageSize: PAGE_SIZE });
  const productos = productosQ.data?.items ?? [];
  const totalRecords = productosQ.data?.totalRecords ?? 0;
  const totalPages = productosQ.data?.totalPages ?? 1;
  const loadingProductos = productosQ.isLoading || productosQ.isFetching;
  const datosListos = productosQ.isFetched || productosQ.isError;
  const showSkeleton = !skeletonMaxElapsed && !datosListos;

  useEffect(() => {
    setTitulo("Inventario");
    const timer = setTimeout(() => setSkeletonMaxElapsed(true), 1000);
    return () => clearTimeout(timer);
  }, [setTitulo]);

  const from = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalRecords);

  const pagination = useMemo(
    () => ({
      from,
      to,
      total: totalRecords,
      onPrev: () => setPage((p) => Math.max(1, p - 1)),
      onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
      disablePrev: page <= 1,
      disableNext: page >= totalPages,
      isLoading: loadingProductos,
    }),
    [from, to, totalRecords, totalPages, page, loadingProductos]
  );

  const handleProductoCreado = useCallback(() => {
    if (page === 1) {
      queryClient.invalidateQueries({ queryKey: [QK_PRODUCTOS, "lista"] });
      return;
    }

    setPage(1);
  }, [page, queryClient]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-30 flex w-full shrink-0 flex-wrap items-center gap-1 overflow-visible border-b border-border bg-(--color-blanco) p-2 shadow-sm">

        {showSkeleton ? (
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        ) : (
          <BarraHerramientas
            onNuevoProducto={() => setOpenModal(true)}
            pagination={pagination}
          />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showSkeleton ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
            <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-24 flex-col justify-between rounded-2xl border border-border bg-(--color-blanco) p-4"
                >
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ))}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-(--color-blanco) shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-12" />
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border/40 py-2 last:border-0"
                  >
                    <div className="flex w-1/4 items-center gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0">
              <Modulos />
            </div>
            <TablaProductos productos={productos} loading={loadingProductos} />
          </>
        )}
      </div>

      <ModalNuevoProducto
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleProductoCreado}
      />
    </div>
  );
};

export default Inventario;
