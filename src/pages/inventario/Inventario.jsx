import { useCallback, useEffect, useMemo, useState } from "react";

import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { obtenerProductos } from "@/services/productos";
import { useNavigationStore } from "@/context/useNavigationStore";

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
      
      <BarraHerramientas
        onNuevoProducto={() =>
          setOpenModal(true)
        }
        pagination={pagination}
      />
      
    </div>

      <Modulos />

      <TablaProductos
        productos={productos}
        loading={loadingProductos}
      />

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
