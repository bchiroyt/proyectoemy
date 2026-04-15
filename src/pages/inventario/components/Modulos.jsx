import { Tag, Boxes, MapPin, Ruler, Package } from "lucide-react";

const items = [
  { nombre: "Marcas", icono: Tag },
  { nombre: "Categorías", icono: Boxes },
  { nombre: "Ubicaciones", icono: MapPin },
  { nombre: "Tallas", icono: Ruler },
  { nombre: "Presentación", icono: Package },
];

const Modulos = () => {
  return (
    <div>
      <p className="text-xs text-(--color-gris-letra) mb-4 tracking-wider">
        MÓDULOS DE GESTIÓN
      </p>

      <div className="flex flex-wrap gap-4">
        {items.map((item, i) => {
          const Icon = item.icono;

          return (
            <div
              key={i}
              className="bg-(--color-blanco) px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="bg-(--color-rosa-hover)/25 p-2 rounded-lg">
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