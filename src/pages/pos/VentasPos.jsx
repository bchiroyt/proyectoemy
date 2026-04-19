import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";

const productosMock = [
  { id: 1, nombre: "Labial Mate", precio: 10 },
  { id: 2, nombre: "Base", precio: 10 },
  { id: 3, nombre: "Suéter ecuatoriano", precio: 80 },
  { id: 4, nombre: "Zapatos", precio: 150 },
  { id: 5, nombre: "Maquillaje", precio: 65 },
  { id: 6, nombre: "Shampoo", precio: 40 },
  { id: 7, nombre: "Rubor", precio: 20 },
  { id: 8, nombre: "Ropa interior", precio: 10 },
];

const VentasPOS = () => {
  const [openCommand, setOpenCommand] = useState(false);
  const setTitulo = useNavigationStore((state) => state.setTitulo);
        
        useEffect(() => {
            setTitulo("Ventas");
        }, [setTitulo]);
  
        const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const agregarProducto = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const total = carrito.reduce(
    (acc, p) => acc + p.precio * p.cantidad,
    0
  );

  const productosFiltrados = productosMock.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex h-full bg-gray-100">

      {/* CARRITO */}
      <div className="w-80 bg-white p-4 flex flex-col justify-between border-r">

        <div>
          <h2 className="font-semibold mb-3">Carrito</h2>

          <div className="space-y-2">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between text-sm bg-gray-100 p-2 rounded">
                <span>{item.nombre}</span>
                <span>{item.cantidad} x {item.precio}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-lg font-semibold mt-4">
            <span>Total</span>
            <span>Q {total}</span>
          </div>

          <button className="w-full mt-4 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800">
            Confirmar Compra
          </button>
        </div>
      </div>

      {/* PRODUCTOS */}
      <div className="flex-1 p-6">

        {/* Buscador */}
        <div className="flex items-center bg-white rounded-lg px-3 py-2 mb-4 shadow-sm w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="ml-2 outline-none w-full"
          />
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-4">
          <button className="bg-pink-500 text-white px-4 py-1 rounded-full">Todo</button>
          <button className="bg-gray-200 px-4 py-1 rounded-full">Zapatos</button>
          <button className="bg-gray-200 px-4 py-1 rounded-full">Ropa</button>
        </div>

        {/* Grid productos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productosFiltrados.map((p) => (
            <div
              key={p.id}
              onClick={() => agregarProducto(p)}
              className="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition"
            >
              <div className="h-24 bg-gray-100 rounded mb-2"></div>

              <p className="text-sm font-medium">{p.nombre}</p>
              <p className="text-sm text-gray-500">Q {p.precio}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default VentasPOS;