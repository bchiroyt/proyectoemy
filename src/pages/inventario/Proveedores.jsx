import { useState } from "react";
import { ArrowLeft, Plus, Search, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const proveedoresMock = [
  {
    idProveedor: 1,
    nombre: "Distribuidora Central",
    telefono: "5555-5555",
    correo: "ventas@central.com",
    contacto: "Juan Pérez",
    estado: true,
  },
  {
    idProveedor: 2,
    nombre: "Importadora Fashion",
    telefono: "4444-2222",
    correo: "info@fashion.com",
    contacto: "María López",
    estado: true,
  },
];

const Proveedores = () => {
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState("");

  const proveedoresFiltrados = proveedoresMock.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold text-(--color-pagina)">
            Gestión de Proveedores
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Administra los proveedores del sistema.
          </p>
        </div>

        <button
          onClick={() => navigate("/inventario")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>

      </div>

      {/* ACCIONES */}
      <div className="flex justify-between items-center gap-4">

        <div className="relative w-full max-w-md">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar proveedor"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--color-pagina)"
          />

        </div>

        <button
          className="flex items-center gap-2 bg-(--color-pagina) text-white px-5 py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </button>

      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="p-4 text-left">Proveedor</th>
              <th className="p-4 text-left">Contacto</th>
              <th className="p-4 text-left">Teléfono</th>
              <th className="p-4 text-left">Correo</th>
              <th className="p-4 text-left">Estado</th>
            </tr>
          </thead>

          <tbody>

            {proveedoresFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-10 text-center text-gray-400"
                >
                  No se encontraron proveedores.
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map((proveedor) => (
                <tr
                  key={proveedor.idProveedor}
                  className="border-t hover:bg-gray-50 transition-colors"
                >

                  <td className="p-4 font-medium text-gray-700">
                    {proveedor.nombre}
                  </td>

                  <td className="p-4 text-gray-600">
                    {proveedor.contacto}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {proveedor.telefono}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {proveedor.correo}
                    </div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        proveedor.estado
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {proveedor.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Proveedores;