import { Search, Settings, ChevronLeft, ChevronRight } from "lucide-react";

const BarraHerramientas = () => {
  return (
    <div className="flex flex-col gap-4">

      {/* FILA SUPERIOR */}
      <div className="flex flex-wrap justify-between items-center gap-4">

        {/* BOTONES */}
        <div className="flex gap-3 flex-wrap">
          <button className="bg-(--color-pagina) hover:bg-(--color-borde-button) text-white px-5 py-2 rounded-xl shadow-sm transition">
            + Crear Producto
          </button>

          <button className="bg-(--color-pagina-2) hover:opacity-90 text-white px-5 py-2 rounded-xl shadow-sm transition">
            Nueva Compra
          </button>
        </div>

        {/* BUSCADOR + CONFIG */}
        <div className="flex items-center gap-3 w-full sm:w-auto">

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-(--color-pagina) text-sm"
            />
          </div>

          <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

        </div>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-end items-center gap-2">

        <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm text-gray-500">
          Página 1
        </span>

        <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
};

export default BarraHerramientas;