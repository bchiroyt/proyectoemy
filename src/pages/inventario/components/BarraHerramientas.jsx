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

const BarraHerramientas = ({
  onNuevoProducto,
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
    <div className="flex items-center w-full gap-4">

      {/* IZQUIERDA */}
      <div className="flex items-center gap-3 flex-1">

        <button
          onClick={onNuevoProducto}
          className="bg-(--color-pagina) text-white px-5 py-2 rounded-xl hover:opacity-90 transition cursor-pointer"
        >
          + Crear Producto
        </button>

        <button
          onClick={() =>
            navigate("/inventario/compras")
          }
          className="bg-(--color-pagina-2) text-white px-5 py-2 rounded-xl hover:opacity-90 transition cursor-pointer"
        >
          Nueva Compra
        </button>

      </div>

      {/* CENTRO */}
      <div className="flex justify-center flex-1">

        <div className="relative w-64">

          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

          <input
            type="text"
            placeholder="Buscar producto..."
            className="
              w-full
              pl-9
              pr-3
              py-2
              rounded-xl
              border
              border-gray-200
              focus:outline-none
              focus:ring-2
              focus:ring-[#E8307E]
              focus:border-[#E8307E]
              text-sm
            "
          />

        </div>

      </div>

      {/* DERECHA */}
      <div className="flex items-center gap-3 flex-1 justify-end">

        {/* PAGINACIÓN */}
        <div className="flex items-center gap-2">

          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-500">
            Página 1
          </span>

          <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

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