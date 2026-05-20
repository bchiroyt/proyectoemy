import { useState } from "react";

import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";

const Inventario = () => {
  const [openModal, setOpenModal] =
    useState(false);

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
      />
      
    </div>

      <Modulos />

      <TablaProductos />

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