import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Package,
    DollarSign,
    Calculator,
    ShoppingCart,
    BarChart3,
    Grid2x2,
    Settings,
    Store,
    Users,
} from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { cn } from "@/lib/utils";

const datosPanel = [
    {
        id: 1,
        titulo: "Inventario",
        descripcion: "Existencias, movimientos y catálogo de productos.",
        icono: Package,
        to: "/inventario",
    },
    {
        id: 2,
        titulo: "Caja",
        descripcion: "Apertura, arqueo y control de efectivo en caja.",
        icono: DollarSign,
        to: "/apertura",
    },
    {
        id: 3,
        titulo: "Ventas",
        descripcion: "Punto de venta y registro de transacciones.",
        icono: Store,
        to: "/ventas",
    },
    {
        id: 4,
        titulo: "Contabilidad",
        descripcion: "Gastos, deudas y pagos del negocio.",
        icono: Calculator,
        to: "/contabilidad",
    },
    {
        id: 5,
        titulo: "Compras",
        descripcion: "Órdenes a proveedores y recepción de mercadería.",
        icono: ShoppingCart,
        to: "/compras",
    },
    {
        id: 6,
        titulo: "Dashboard",
        descripcion: "Indicadores y resumen general del sistema.",
        icono: BarChart3,
        to: "/dashboard",
    },
    {
        id: 7,
        titulo: "Usuarios",
        descripcion: "Administración de cuentas y permisos.",
        icono: Users,
        to: "/usuarios",
    },
    {
        id: 8,
        titulo: "Configuración",
        descripcion: "Preferencias del sistema (próximamente).",
        icono: Settings,
        to: null,
    },
];

const PanelControl = () => {
    const setTitulo = useNavigationStore((s) => s.setTitulo);
    const navigate = useNavigate();

    useEffect(() => {
        setTitulo("Panel de Control");
    }, [setTitulo]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-200/80 rounded-xl md:rounded-2xl border border-slate-200/60">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 md:p-8">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl w-full mx-auto pb-2">
                    
                    {datosPanel.map((item) => {
                        const Icon = item.icono;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "bg-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col items-center text-center min-h-[220px] sm:min-h-[260px] border border-slate-100/80",
                                    !item.to && "opacity-75"
                                )}
                            >
                                {/* 🔥 SOLO ESTE CONTENEDOR ES INTERACTIVO */}
                                <div
                                    onClick={() => item.to && navigate(item.to)}
                                    className={cn(
                                        "bg-slate-100 w-full aspect-[5/3] max-h-36 rounded-xl flex items-center justify-center mb-3 shrink-0 transition-all duration-300",
                                        item.to
                                            ? "cursor-pointer hover:bg-(--color-pagina)/10 hover:shadow-md"
                                            : "cursor-not-allowed"
                                    )}
                                >
                                    <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-(--color-pagina)" />
                                </div>

                                {/* TEXTO (NO CLICKEABLE) */}
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                                    {item.titulo}
                                </h3>

                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {item.descripcion}
                                </p>
                            </div>
                        );
                    })}

                </div>

            </div>
        </div>
    );
};

export default PanelControl;