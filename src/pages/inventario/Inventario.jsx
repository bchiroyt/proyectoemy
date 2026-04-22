import { useState } from "react";
import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import ModalNuevoProducto from "./components/ModalNuevoProducto";

const Inventario = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="bg-(--color-pagina-4) min-h-full w-full p-6 space-y-6">

      <BarraHerramientas onNuevoProducto={() => setOpenModal(true)} />

      <Modulos />
      <TablaProductos />

      <ModalNuevoProducto
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
};

export default Inventario;