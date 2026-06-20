import { useEffect, useState } from "react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Package,
  Receipt,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import ReporteInventarioPanel from "./components/ReporteInventarioPanel";
import ReporteVentasPanel from "./components/ReporteVentasPanel";
import ReporteCajaPanel from "./components/ReporteCajaPanel";
import ReporteComprasPanel from "./components/ReporteComprasPanel";

const TABS = [
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "ventas", label: "Ventas", icon: Receipt },
  { id: "caja", label: "Caja", icon: Wallet },
  { id: "compras", label: "Compras", icon: ShoppingCart },
];

const HomePage = () => {
  const setTitulo = useNavigationStore((s) => s.setTitulo);
  const [tab, setTab] = useState("inventario");

  useEffect(() => {
    setTitulo("Reportes/Dashboard");
  }, [setTitulo]);

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain space-y-6 px-6 sm:px-8 md:px-10 pt-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/*<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-(--color-pagina) mb-1">
            <BarChart3 className="size-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Centro de reportes</span>
          </div>
        </div>
        <span className="text-sm font-medium px-4 py-2 bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-full text-(--color-gris-letra) shadow-sm">
          {new Date().toLocaleDateString("es-GT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>*/}

      <div className="flex flex-wrap justify-center gap-4 border-b border-(--color-gris-claro-2) pb-4">

        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "bg-(--color-blanco) px-5 py-4 rounded-xl flex items-center gap-3 shadow-sm transition-all cursor-pointer border border-transparent",
              tab === id
                ? "ring-2 ring-(--color-pagina) shadow-md"
                : "hover:shadow-md hover:border-(--color-rosa-hover)"
            )}
          >

            <div className={cn(
              "p-2 rounded-lg transition-colors",
              tab === id ? "bg-(--color-pagina)" : "bg-(--color-rosa-hover)"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                tab === id ? "text-(--color-blanco)" : "text-(--color-pagina)"
              )} />
            </div>
            <span className={cn(
              "text-sm font-medium",
              tab === id ? "text-(--color-pagina) font-bold" : "text-(--color-gris-letra)"
            )}>
              {label}
            </span>
          </button>
        ))}
        <div className="">
          <span className="text-sm font-medium px-4 py-2 bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-full text-(--color-gris-letra) shadow-sm">
            {new Date().toLocaleDateString("es-GT", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <div className="">
        <span className="text-sm font-medium px-4 py-2 bg-(--color-blanco) border border-(--color-gris-claro-2) rounded-full text-(--color-gris-letra) shadow-sm">
          {new Date().toLocaleDateString("es-GT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="min-h-[400px]">
        {tab === "inventario" && <ReporteInventarioPanel />}
        {tab === "ventas" && <ReporteVentasPanel />}
        {tab === "caja" && <ReporteCajaPanel />}
        {tab === "compras" && <ReporteComprasPanel />}
      </div>
    </div>
  );
};

export default HomePage;
