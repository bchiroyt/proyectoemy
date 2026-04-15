import BarraHerramientas from "./components/BarraHerramientas";
import Modulos from "./components/Modulos";
import TablaProductos from "./components/TablaProductos";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useEffect, useState } from "react"

const Inventario = () => {
        const [openCommand, setOpenCommand] = useState(false);
        const setTitulo = useNavigationStore((state) => state.setTitulo);
        
        useEffect(() => {
            setTitulo("Inventario");
        },);

    
  return (
    <div className="bg-(--color-pagina-4) min-h-full w-full p-6 space-y-6">

      <h1 className="text-2xl font-semibold text-(--color-pagina)">
        Inventario de Productos
      </h1>

      <BarraHerramientas />
      <Modulos />
      <TablaProductos />

    </div>
  );
  
};


export default Inventario;