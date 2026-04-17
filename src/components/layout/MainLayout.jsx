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
                    <div className="flex-1 flex flex-col min-w-0">
                        <Header />

                        <main className="flex-1 overflow-y-auto p-0 md:p-0">
                            <div className="max-w-[1600px] mx-auto">
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