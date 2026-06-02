import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "./AppSidebar";
import Header from "./Header";

/** POS en operación: sin menú lateral (ventas y cierre de turno). */
const RUTAS_SIN_SIDEBAR = new Set(["/pos/ventas", "/pos/cierre"]);
const ocultarSidebarEnRuta = (pathname) => RUTAS_SIN_SIDEBAR.has(pathname);

const MainLayout = ({ children }) => {
    const { pathname } = useLocation();
    const ocultarSidebar = ocultarSidebarEnRuta(pathname);

    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={!ocultarSidebar}>
                <div className="flex w-full h-screen overflow-hidden bg-(--color-pagina-4)">
                    {!ocultarSidebar ? <AppSidebar /> : null}

                    <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full">
                        <Header />

                        {/*<main className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="max-w-[1600px] mx-auto w-full flex-1 min-h-0 flex flex-col px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                                {children}
                            </div>
                        </main>
                        */}
                        <main className="flex-1 min-h-0 flex flex-col overflow-hidden overflow-y-auto ">
                        {/* Quitamos max-w, mx-auto y los px/py de aquí */}
                            <div className="w-full flex-1 min-h-0 flex flex-col">
                                {children}
                            </div>
                        </main>
                    </div>

                </div>
            </SidebarProvider>
        </TooltipProvider>
    );
};

export default MainLayout;