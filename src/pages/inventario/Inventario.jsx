import { useCallback, useEffect, useMemo, useState } from "react";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { obtenerProductos, buscarVariantesCompra } from "@/services/productos";
import { useNavigationStore } from "@/context/useNavigationStore";
import { Skeleton } from "@/components/ui/skeleton";
import { unwrapVariantesBuscar } from "@/lib/productoUtils";

const PAGE_SIZE = 15;

const Inventario = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [openModal, setOpenModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setDebouncedQuery(busqueda);
      setPage(1);
    }, 500);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const fetchProductos = useCallback(async () => {
    try {
      setLoadingProductos(true);

      if (debouncedQuery.trim() !== "") {
        const res = await buscarVariantesCompra(debouncedQuery);
        const listaFiltrada = unwrapVariantesBuscar(res);

        setProductos(listaFiltrada);
        setTotalRecords(listaFiltrada.length);
        setTotalPages(1);
      } else {
        const data = await obtenerProductos({
          Page: page,
          PageSize: PAGE_SIZE,
        });

        setProductos(data.items || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error obteniendo productos/variantes:", error);
      setProductos([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoadingProductos(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    setTitulo("Inventario");
    const timer = setTimeout(() => setLoading(false), 1000);
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
      disablePrev: page <= 1 || debouncedQuery.trim() !== "",
      disableNext: page >= totalPages || debouncedQuery.trim() !== "",
      isLoading: loadingProductos,
    }),
    [from, to, totalRecords, totalPages, page, loadingProductos, debouncedQuery]
  );

  const handleProductoCreado = useCallback(() => {
    if (page === 1) {
      fetchProductos();
      return;
    }
    setPage(1);
  }, [fetchProductos, page]);

  const handleSearchChange = (e) => {
    setBusqueda(e.target.value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-30 flex w-full shrink-0 flex-wrap items-center gap-1 overflow-visible border-b border-border bg-(--color-blanco) p-2 shadow-sm">
        {loading ? (
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
        {loading ? (
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
            <TablaProductos
              productos={productos}
              loading={loadingProductos}
              onRefresh={fetchProductos}
            />
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
