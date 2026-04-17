import { Home, Package, PlusCircle, Calculator,
    ShoppingCart, Landmark, Users, LayoutDashboard,
    Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
    //useSidebar, Hook para saber si está abierto o cerrado
    //importamos el separator para separar los items del sidebar
import { Separator } from "@/components/ui/separator";
import logoImg from "@/assets/tran1.png";
import logo1Img from "@/assets/logo1.jpeg";

const menuItems = [
    { icon: Home, label: "Inicio" },
    { icon: Package, label: "Inventario" },
    { icon: PlusCircle, label: "Nuevo Producto" },
    { icon: Calculator, label: "Caja" },
    { icon: ShoppingCart, label: "Ventas" },
    { icon: Landmark, label: "Contabilidad" },
    { icon: Users, label: "Usuarios" },
    { icon: LayoutDashboard, label: "Dashboard" },
];

const AppSidebar = () => {
    const { open } = useSidebar(); // Detecta si el sidebar está desplegado

    return (
        <Sidebar collapsible="icon" className="bg-(--color-blanco) border-r">
            <SidebarHeader className="p-1 flex items-center justify-center h-[80px]">
            <img src={logoImg} 
                 alt="Logo" 
                 className="h-20 w-auto object-contain group-data-[collapsible=icon]:hidden" />
                
                <img src={logo1Img} 
                 alt="Logo2" 
                 className="h-6 w-auto object-contain hidden group-data-[state=collapsed]:block" />
                {/*
                sidebarheader p-5 h-[40px] flex items-center justify-center
                {open ? (
                   
                    <h1 className="text-xl font-bold text-pagina italic">MI POS</h1>

                ) : (
                    <span className="font-bold text-pagina">P</span>
                )}*/}
            </SidebarHeader>
            {/* EL BOTÓN DE DESPLEGAR/COLAPSAR ABAJO */}
            <SidebarMenuItem className="mt-6 flex justify-end">
                        <SidebarTrigger className=" felx justify-center hover:bg-(--color-pagina) hover:text-(--color-blanco)" />
                    </SidebarMenuItem>

            <Separator />

            <SidebarContent className="p-2 ">
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton
                                tooltip={item.label}
                                className="h-12 hover:bg-(--color-pagina) hover:text-(--color-blanco) transition-colors py-6"
                            >
                                <item.icon className="w-6 h-6" />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="h-12 hover:bg-(--color-pagina) hover:text-(--color-blanco) py-6">
                            <Settings className="w-10 h-10" />
                            <span>Configuraciones</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton className="text-(--color-pagina) hover:bg-(--color-pagina) hover:text-(--color-blanco) py-6">
                            <LogOut className="w-5 h-5" />
                            <span className="font-bold">Salir del Sistema</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>                    
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;