import {
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import Paginacion from "@/components/shared/Paginacion";

const BarraHerramientas = ({
  onNuevoProducto,
  pagination,
}) => {
  const [openConfig, setOpenConfig] =
    useState(false);

  const navigate = useNavigate();

  const configRef = useRef(null);

  // CERRAR DROPDOWN AL HACER CLICK AFUERA
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        configRef.current &&
        !configRef.current.contains(event.target)
      ) {
        setOpenConfig(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div className="flex items-center w-full gap-4 flex-wrap">

      {/* IZQUIERDA */}
      <div className="flex items-center gap-3 flex-1">

        <button
          onClick={onNuevoProducto}
          className="xl:text-sm  bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition cursor-pointer"
        >
          + Crear Producto
        </button>

      </div>

      {/* CENTRO */}
      <div className="flex justify-center flex-1">

        <BuscadorPrincipal />
        

      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-3 flex-1 justify-end">

      <Paginacion {...pagination} />
      
        {/* CONFIGURACIÓN */}
        <div
          className="relative"
          ref={configRef}
        >

          <button
            onClick={() =>
              setOpenConfig(!openConfig)
            }
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {openConfig && (
            <div className="absolute right-0 top-12 bg-white shadow-lg rounded-xl p-2 w-52 z-10 border border-gray-100">

              <button
                onClick={() => {
                  navigate("/inventario/reporte-stock");
                  setOpenConfig(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm transition cursor-pointer"
              >
                Reporte de Stock
              </button>

              <button
                onClick={() => {
                  navigate("/inventario/ajuste");
                  setOpenConfig(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm transition cursor-pointer"
              >
                Ajuste de Inventario
              </button>

              <button
                onClick={() => {
                  navigate("/inventario/proveedores");
                  setOpenConfig(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm transition cursor-pointer"
              >
                Proveedores
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default BarraHerramientas;
