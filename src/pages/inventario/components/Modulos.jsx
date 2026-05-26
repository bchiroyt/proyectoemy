import { Tag, Boxes, MapPin, Ruler, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  { nombre: "Marcas", icono: Tag, ruta: "/inventario/marcas" },
  { nombre: "Categorías", icono: Boxes, ruta: "/inventario/categorias" },
  { nombre: "Ubicaciones", icono: MapPin, ruta: "/inventario/ubicaciones" },
  { nombre: "Tallas", icono: Ruler, ruta: "/inventario/tallas" },
  { nombre: "Presentación", icono: Package, ruta: "/inventario/presentaciones" },
];

const Modulos = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center">

      

      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {items.map((item, i) => {
          const Icon = item.icono;

          return (
            <div
              key={i}
              onClick={() => navigate(item.ruta)}
              className="bg-white px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-(--color-rosa-hover) p-2 rounded-lg">
                <Icon className="text-(--color-pagina) w-5 h-5" />
              </div>

              <span className="text-sm font-medium text-gray-700">
                {item.nombre}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Modulos;