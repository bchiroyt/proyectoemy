import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { useNavigationStore } from "@/context/useNavigationStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  QK_PRODUCTOS,
  useProductosBuscarQuery,
  useProductosListQuery,
} from "@/hooks/queries/useProductosQueries";

const PAGE_SIZE = 50;

const Inventario = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [page, setPage] = useState(1);
  const [skeletonMaxElapsed, setSkeletonMaxElapsed] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const isSearching = debouncedQuery.trim() !== "";

  const productosQ = useProductosListQuery(
    { page, pageSize: PAGE_SIZE },
    { enabled: !isSearching }
  );
  const buscarQ = useProductosBuscarQuery(debouncedQuery, { enabled: isSearching });

  const productos = isSearching ? (buscarQ.data ?? []) : (productosQ.data?.items ?? []);
  const totalRecords = isSearching
    ? productos.length
    : (productosQ.data?.totalRecords ?? 0);
  const totalPages = isSearching ? 1 : (productosQ.data?.totalPages ?? 1);
  const loadingProductos = isSearching
    ? buscarQ.isLoading || buscarQ.isFetching
    : productosQ.isLoading || productosQ.isFetching;
  const datosListos = isSearching
    ? buscarQ.isFetched || buscarQ.isError
    : productosQ.isFetched || productosQ.isError;
  const showSkeleton = !skeletonMaxElapsed && !datosListos;

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setDebouncedQuery(busqueda);
      setPage(1);
    }, 500);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

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
      disablePrev: page <= 1 || isSearching,
      disableNext: page >= totalPages || isSearching,
      isLoading: loadingProductos,
    }),
    [from, to, totalRecords, totalPages, page, loadingProductos, isSearching]
  );

  const handleProductoCreado = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK_PRODUCTOS] });
    if (page !== 1) {
      setPage(1);
    }
  }, [page, queryClient]);

  const handleSearchChange = (e) => {
    setBusqueda(e.target.value);
  };

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
            busqueda={busqueda}
            setBusqueda={handleSearchChange}
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
