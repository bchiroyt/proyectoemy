import { Wallet, Users, CreditCard } from "lucide-react";

const datosContabilidad = [
  {
    id: 1,
    titulo: "Gastos",
    descripcion: "Gestiona egresos, registra compras y controla los movimientos de salida de dinero.",
    icono: Wallet,
  },
  {
    id: 2,
    titulo: "Deudas",
    descripcion: "Administra deudas pendientes, clientes con saldo y compromisos financieros.",
    icono: Users,
  },
  {
    id: 3,
    titulo: "Pagos",
    descripcion: "Registra pagos realizados, controla abonos y mantiene el flujo financiero actualizado.",
    icono: CreditCard,
  },
];

const Contabilidad = () => {
  return (
    <div className="bg-(--color-pagina-4) min-h-full w-full flex flex-col p-6 md:p-10">

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-semibold text-(--color-pagina) text-center mb-10">
        Bienvenido al módulo de Contabilidad
      </h1>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl w-full mx-auto">

        {datosContabilidad.map((item) => {
          const Icon = item.icono;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-md flex flex-col items-center text-center min-h-260px"
            >
              {/* Contenedor gris con hover */}
              <div className="bg-gray-100 w-40 h-32 rounded-xl flex items-center justify-center mb-5 transition hover:shadow-[0_0_20px_var(--color-pagina)] cursor-pointer">
                <Icon className="w-10 h-10 text-(--color-pagina)" />
              </div>

              {/* Título */}
              <h3 className="text-lg font-semibold mb-2">
                {item.titulo}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-gray-600">
                {item.descripcion}
              </p>
            </div>
          );
        })}

      </div>

    </div>
  );
};

export default Contabilidad;