import { Eye, PackageSearch, Clock } from "lucide-react";

const productos = [
  {
    nombre: "Blusa Guess",
    categoria: "Ropa",
    costo: "Q15.00",
    precio: "Q35.00",
    stock: 45,
    estado: "Activo",
  },
  {
    nombre: "Zapatilla Running Pro",
    categoria: "Calzado",
    costo: "Q40.00",
    precio: "Q85.00",
    stock: 12,
    estado: "Activo",
  },
  {
    nombre: "Labial Mate",
    categoria: "Cosméticos",
    costo: "Q5.00",
    precio: "Q12.00",
    stock: 120,
    estado: "Activo",
  },
];

const TablaProductos = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="p-4 text-left">Producto</th>
            <th className="p-4 text-left">Categoría</th>
            <th className="p-4 text-left">Costo</th>
            <th className="p-4 text-left">Precio</th>
            <th className="p-4 text-left">Stock</th>
            <th className="p-4 text-left">Estado</th>
            <th className="p-4 text-left">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((item, i) => (
            <tr key={i} className="border-t hover:bg-gray-50 transition">

              <td className="p-4 font-medium text-gray-700">
                {item.nombre}
              </td>

              <td className="p-4">
                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                  {item.categoria}
                </span>
              </td>

              <td className="p-4 text-gray-600">{item.costo}</td>

              <td className="p-4 text-(--color-pagina) font-semibold">
                {item.precio}
              </td>

              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <span>{item.stock}</span>

                  <div className="w-full bg-gray-200 h-1 rounded">
                    <div
                      className="bg-(--color-pagina-2) h-1 rounded"
                      style={{ width: `${Math.min(item.stock, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </td>

              <td className="p-4">
                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                  {item.estado}
                </span>
              </td>

              <td className="p-4">
                <div className="flex items-center gap-3">

                  <button className="text-gray-500 hover:text-(--color-pagina) transition">
                    <Eye className="w-5 h-5" />
                  </button>

                  <button className="text-gray-500 hover:text-blue-500 transition">
                    <PackageSearch className="w-5 h-5" />
                  </button>

                  <button className="text-gray-500 hover:text-yellow-500 transition">
                    <Clock className="w-5 h-5" />
                  </button>

                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaProductos;