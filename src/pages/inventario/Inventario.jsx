import React, { useEffect, useState } from "react";
import { useNavigationStore } from "@/context/useNavigationStore";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";
import { Skeleton } from "@/components/ui/skeleton";

const Inventario = () => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const setTitulo = useNavigationStore((state) => state.setTitulo);

  useEffect(() => {
    setTitulo("Inventario");
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [setTitulo]);

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
          <TablaProductos />
        </>
      )}

      <ModalNuevoProducto
        open={openModal}
        onClose={() =>
          setOpenModal(false)
        }
      />
    </div>
  );
};

export default Inventario;