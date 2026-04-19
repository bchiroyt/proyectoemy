import { useState, useEffect } from "react";
import { Minus, Plus, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "@/context/useNavigationStore"


const denominaciones = [
  { valor: 200, label: "Q200" },
  { valor: 100, label: "Q100" },
  { valor: 50, label: "Q50" },
  { valor: 20, label: "Q20" },
  { valor: 10, label: "Q10" },
  { valor: 5, label: "Q5" },
];

const AperturaCaja = () => {

    const [openCommand, setOpenCommand] = useState(false);
    const setTitulo = useNavigationStore((state) => state.setTitulo);
    
    useEffect(() => {
        setTitulo("Caja");
    }, [setTitulo]);

  const [cantidades, setCantidades] = useState(
    denominaciones.reduce((acc, d) => ({ ...acc, [d.valor]: 0 }), {})
  );

  const [monedas, setMonedas] = useState(0);
  const [observaciones, setObservaciones] = useState("");

  const cambiarCantidad = (valor, delta) => {
    setCantidades((prev) => ({
      ...prev,
      [valor]: Math.max(0, prev[valor] + delta),
    }));
  };

  const totalBilletes = denominaciones.reduce(
    (acc, d) => acc + d.valor * cantidades[d.valor],
    0
  );

  const total = totalBilletes + monedas;

  return (
    <div>

      {/* Contenedor principal */}
      <div className="bg-(--color-blanco) rounded-2xl shadow-lg p-1 md:p-2">

        {/* Sección billetes */}
        <h2 className="text-xl font-semibold mb-1">Conteo Inicial</h2>
        <p className="text-gray-500 mb-4">
          Ingresa la cantidad de efectivo en caja para iniciar el turno.
        </p>

        <p className="text-(--color-pagina) font-semibold mb-4">
          BILLETES (QUETZALES)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {denominaciones.map((d) => (
            <div
              key={d.valor}
              className="bg-pink-50 rounded-xl p-1 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{d.label}</p>
                <p className="text-sm text-gray-500">
                  Total: Q{(d.valor * cantidades[d.valor]).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => cambiarCantidad(d.valor, -1)}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  <Minus size={16} />
                </button>

                <span className="w-6 text-center font-semibold">
                  {cantidades[d.valor]}
                </span>

                <button
                  onClick={() => cambiarCantidad(d.valor, 1)}
                  className="p-1 rounded bg-pink-500 text-white hover:bg-pink-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Monedas */}
          <div className="bg-gray-100 rounded-xl p-2 flex flex-col justify-center items-center">
            <p className="font-semibold mb-2">Monedas</p>
            <input
              type="number"
              value={monedas}
              onChange={(e) => setMonedas(Number(e.target.value))}
              className="w-24 text-center border rounded p-1"
            />
          </div>
        </div>

        {/* Observaciones + resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Observaciones */}
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">Observaciones</h3>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe aquí cualquier nota importante..."
              className="w-full h-32 p-3 border rounded-lg resize-none"
            />
          </div>

          {/* Resumen */}
          <div className="bg-(--color-pagina) text-(--color-blanco) rounded-xl p-3 flex flex-col justify-between">

            <div>
              <p className="font-semibold text-lg">
                Balance Total Apertura
              </p>
              <p className="text-3xl font-bold mt-2">
                Q {total.toFixed(2)}
              </p>
            </div>

            <div className="text-sm mt-4">
              <p>Billetes: Q{totalBilletes.toFixed(2)}</p>
              <p>Monedas: Q{monedas.toFixed(2)}</p>
            </div>

            <button className="mt-4 bg-(--color-blanco) text-(--color-pagina) rounded-lg py-2 flex items-center justify-center gap-2 font-semibold hover:bg-gray-100">
              <Lock size={18} />
              Confirmar Apertura
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AperturaCaja;