import { useCallback, useEffect, useMemo, useState } from "react";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { obtenerProductos } from "@/services/productos";
import { useNavigationStore } from "@/context/useNavigationStore";
import { Skeleton } from "@/components/ui/skeleton";
const PAGE_SIZE = 50;

const Inventario = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [openModal, setOpenModal] =
    useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchProductos = useCallback(async () => {
    try {
      setLoadingProductos(true);

      const data = await obtenerProductos({
        Page: page,
        PageSize: PAGE_SIZE,
      });

      console.info("[Inventario] Data recibida de /api/Productos:", data);

      setProductos(data.items || []);
      setTotalRecords(data.totalRecords || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      setProductos([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoadingProductos(false);
    }
  }, [page]);

  useEffect(() => {
    setTitulo("Inventario");
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [setTitulo]);


  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

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
      fetchProductos();
      return;
    }

    setPage(1);
  }, [fetchProductos, page]);

  

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-1 border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        <div className="flex flex-1 justify-start gap-2">
          <div></div>
        </div>
        
        {loading ? (
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        ) : (
          <BarraHerramientas
            onNuevoProducto={() =>
              setOpenModal(true)
            }
            pagination={pagination}
          />
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border h-24 rounded-2xl p-4 flex flex-col justify-between bg-(--color-blanco)">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>

          <div className="bg-(--color-blanco) border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3 w-1/4">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
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
          <Modulos />
          <TablaProductos
            productos={productos}
            loading={loadingProductos}
          />
        </>
      )}

      <ModalNuevoProducto
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
        onSuccess={handleProductoCreado}
      />
    </div>
  );
};

export default Inventario;
