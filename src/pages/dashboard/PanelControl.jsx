import {
    Package,
    DollarSign,
    Tag,
    Calculator,
    ShoppingCart,
    BarChart3,
    Grid2x2,
    Settings
} from "lucide-react";

const datosPanel = [
    { id: 1, titulo: "Inventario", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: Package },
    { id: 2, titulo: "Caja", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: DollarSign },
    { id: 3, titulo: "Ventas", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: Tag },
    { id: 4, titulo: "Contabilidad", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: Calculator },
    { id: 5, titulo: "Compras", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: ShoppingCart },
    { id: 6, titulo: "Dashboard", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: BarChart3 },
    { id: 7, titulo: "Productos", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: Grid2x2 },
    { id: 8, titulo: "Configuración", descripcion: "Descripción corta Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icono: Settings },
];

const PanelControl = () => {
    return (
        <div className="bg-gray-200 min-h-full flex flex-col p-0 md:p-12.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl w-full mx-auto">
                {datosPanel.map((item) => {
                    const Icon = item.icono;

                    return (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl p-4 shadow-md flex flex-col items-center text-center min-h-[280px]"
                        >
                            <div className="bg-gray-100 w-48 h-35 rounded-xl flex items-center justify-center mb-3">
                                <Icon className="w-10 h-10 text-blue-500" />
                            </div>

                            <h3 className="text-lg font-semibold mb-2">
                                {item.titulo}
                            </h3>

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

export default PanelControl;