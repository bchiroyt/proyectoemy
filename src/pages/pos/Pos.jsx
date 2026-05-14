import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useEffect } from "react";

/** Datos de demostración; sustituir por API al conectar el backend. */
const ULTIMO_CIERRE_MOCK = {
  fecha: "6 de Marzo",
  balanceEfectivo: 2840.5,
};

const POS = () => {
  const setTitulo = useNavigationStore((state) => state.setTitulo);
  const navigate = useNavigate();

  useEffect(() => {
    setTitulo("POS");
  }, [setTitulo]);

  return (
    <div className="bg-gray-200 min-h-full w-full flex items-center justify-center relative px-4 py-8">
      <button
        type="button"
        onClick={() => navigate("/panel-control")}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2 bg-(--color-pos-boton-primario) text-(--color-blanco) px-4 py-2 rounded-lg shadow-md hover:bg-(--color-pos-boton-primario-hover) transition"
      >
        Regresar
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-10 sm:px-10 sm:py-12 w-full max-w-xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Modas y Variedades EMY
        </h2>

        <button
          type="button"
          onClick={() => navigate("/pos/apertura")}
          className="bg-pink-200 hover:bg-pink-300 text-gray-900 font-bold px-10 py-3 rounded-xl shadow-sm transition"
        >
          Abrir Caja
        </button>

        <div className="my-10 border-t border-gray-200" />

        <div className="space-y-4 text-left text-lg">
          <div className="flex justify-between items-center gap-4 text-gray-900">
            <span className="font-bold">Fecha de cierre</span>
            <span className="font-bold">{ULTIMO_CIERRE_MOCK.fecha}</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-gray-900">
            <span className="font-bold">Último balance de cierre de efectivo</span>
            <span className="font-bold tabular-nums">
              Q {ULTIMO_CIERRE_MOCK.balanceEfectivo.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
