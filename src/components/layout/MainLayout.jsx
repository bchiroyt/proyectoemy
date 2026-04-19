import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
const MainLayout = ({ children }) => {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <div className="flex w-full h-screen overflow-hidden bg-(--color-pagina-4)">
                    {/* El Sidebar se queda fijo a la izquierda */}

                    <AppSidebar />


                    {/* El resto de la pantalla es flexible */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">
                        <Header />

                        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="max-w-[1600px] mx-auto w-full flex-1 min-h-0 flex flex-col px-2 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
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