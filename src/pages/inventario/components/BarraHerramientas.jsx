import { Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BuscadorPrincipal from "@/components/shared/BuscadorPricipal";
import Paginacion from "@/components/shared/Paginacion";

const BarraHerramientas = ({
  onNuevoProducto,
  pagination,
  busqueda,
  setBusqueda,
}) => {
  const [openConfig, setOpenConfig] = useState(false);
  const navigate = useNavigate();
  const configRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setOpenConfig(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex w-full flex-wrap items-center gap-4">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onNuevoProducto}
          className="rounded-xl bg-(--color-pagina) px-5 py-2 text-white transition hover:opacity-90 xl:text-sm"
        >
          + Crear Producto
        </button>
      </div>

      <div className="flex flex-1 justify-center">
        <BuscadorPrincipal value={busqueda} onChange={setBusqueda} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <Paginacion {...pagination} />

        <div className="relative z-50" ref={configRef}>
          <button
            type="button"
            onClick={() => setOpenConfig(!openConfig)}
            className="rounded-xl bg-gray-100 p-2 transition hover:bg-gray-200"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>

          {openConfig && (
            <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  navigate("/inventario/reporte-stock");
                  setOpenConfig(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100"
              >
                Reporte de Stock
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate("/inventario/ajuste");
                  setOpenConfig(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100"
              >
                Ajuste de Inventario
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate("/inventario/proveedores");
                  setOpenConfig(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100"
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
