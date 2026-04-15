import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useEffect, useState } from "react"

const POS = () => {
  const [openCommand, setOpenCommand] = useState(false);
  const setTitulo = useNavigationStore((state) => state.setTitulo);
        
        useEffect(() => {
            setTitulo("POS");
        },);

  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-full w-full flex items-center justify-center relative px-4">

      {/* Botón regresar */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 right-6 flex items-center gap-2 bg-green-700 text-(--color-blanco) px-4 py-2 rounded-lg shadow-md hover:bg-green-800 transition"
      >
        Regresar
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Card principal */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-10 py-12 w-full max-w-xl text-center">

        {/* Título negocio */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Modas y Variedades EMY
        </h2>

        {/* Botón abrir caja */}
        <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
          Abrir Caja
        </button>

        {/* Divider */}
        <div className="my-10 border-t border-gray-200"></div>

        {/* Información */}
        <div className="flex justify-between items-center text-gray-700 text-lg">
          <span className="font-medium">Fecha de cierre</span>
          <span className="font-semibold text-gray-900">14 de Abril</span>
        </div>

      </div>
    </div>
  );
};

export default POS;