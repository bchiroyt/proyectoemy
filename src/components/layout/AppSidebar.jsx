import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    Home,
    Package,
    PlusCircle,
    ShoppingCart,
    Landmark,
    Users,
    LayoutDashboard,
    Settings,
    LogOut,
    Store,
    PanelLeft,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/tran1.png";
import logo1Img from "@/assets/logo1.jpeg";
import { useAuthStore } from "@/context/useAuthStore";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const menuItems = [
    { icon: Home, label: "Panel de Control", to: "/panel-control" },
    { icon: Package, label: "Inventario", to: "/inventario" },
    { icon: PlusCircle, label: "Nuevo Producto", to: "/nuevo-producto" },
    { icon: Store, label: "POS", to: "/pos" },
    { icon: ShoppingCart, label: "Compras", to: "/compras" },
    { icon: Landmark, label: "Contabilidad", to: "/contabilidad" },
    { icon: Users, label: "Usuarios", to: "/usuarios" },
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
];

const isRouteActive = (pathname, to) => {
    if (to === "/compras") return pathname === "/compras" || pathname.startsWith("/compras/");
    if (to === "/pos") return pathname === "/pos" || pathname.startsWith("/pos/");
    return pathname === to;
};

const AppSidebar = () => {
    const { setOpenMobile, state, toggleSidebar } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);
    const [logoutOpen, setLogoutOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setLogoutOpen(false);
        navigate("/login", { replace: true });
    };

    return (
        <>
            <button
                type="button"
                aria-label="Toggle Sidebar"
                onClick={toggleSidebar}
                className={cn(
                    "fixed left-4 top-4 z-50 inline-flex size-9 items-center justify-center rounded-full border border-(--color-gris-claro-2) bg-(--color-blanco) p-0 text-(--color-gris-letra) shadow-lg md:hidden",
                    "transition-[background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                    "hover:bg-(--color-pagina) hover:text-(--color-blanco) hover:shadow-xl",
                    "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    "[&_svg]:size-4"
                )}
            >
                <PanelLeft aria-hidden="true" />
            </button>

            <Sidebar collapsible="icon" className="z-30 bg-(--color-blanco) border-r">

                <button
                    type="button"
                    aria-label="Toggle Sidebar"
                    onClick={toggleSidebar}
                    className={cn(
                        "absolute right-0 top-10 z-50 hidden size-9 translate-x-1/2 items-center justify-center rounded-full border border-(--color-gris-claro-2) bg-(--color-blanco) p-0 text-(--color-gris-letra) shadow-lg md:inline-flex",
                        "transition-[background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                        "hover:bg-(--color-pagina) hover:text-(--color-blanco) hover:shadow-xl",
                        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        "[&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:[&_svg]:transition-none",
                        state === "collapsed" && "[&_svg]:rotate-180"
                    )}
                >
                    <PanelLeft aria-hidden="true" />
                </button>

                <SidebarHeader className="p-1 flex items-center justify-center h-[80px]">
                    <div className="relative flex h-20 w-full items-center justify-center overflow-hidden">
                        <img
                            src={logoImg}
                            alt="Logo"
                            className="absolute h-20 w-auto object-contain transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=collapsed]:scale-95 group-data-[state=collapsed]:opacity-0"
                        />

                        <img
                            src={logo1Img}
                            alt="Logo2"
                            className="absolute h-6 w-auto object-contain opacity-0 scale-95 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=collapsed]:scale-100 group-data-[state=collapsed]:opacity-100"
                        />
                    </div>
                </SidebarHeader>

                <Separator />

                <SidebarContent className="p-2">
                    <SidebarMenu className="gap-1">
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.to}>
                                <SidebarMenuButton
                                    asChild
                                    size="lg"
                                    isActive={isRouteActive(location.pathname, item.to)}
                                    tooltip={item.label}
                                    className={cn(
                                        "min-h-11 data-[active=true]:bg-(--color-pagina) data-[active=true]:text-(--color-blanco)",
                                        "hover:bg-(--color-pagina)/10 hover:text-(--color-pagina) data-[active=true]:hover:bg-(--color-pagina) data-[active=true]:hover:text-(--color-blanco)"
                                    )}
                                >
                                    <NavLink
                                        to={item.to}
                                        onClick={() => setOpenMobile(false)}
                                        className="flex w-full items-center gap-2 outline-none ring-sidebar-ring [&_svg]:size-7"
                                    >
                                        <item.icon className="size-8 shrink-0" />
                                        <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">
                                            {item.label}
                                        </span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>

                <SidebarFooter className="p-4 border-t">
                    <SidebarMenu className="gap-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Configuraciones"
                                className="min-h-12 py-3 hover:bg-(--color-pagina) hover:text-(--color-blanco)"
                            >
                                <Settings className="size-7 shrink-0" />
                                <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">Configuraciones</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Salir del sistema"
                                className="min-h-12 py-3 text-(--color-pagina) hover:bg-(--color-pagina) hover:text-(--color-blanco)"
                                onClick={() => setLogoutOpen(true)}
                            >
                                <LogOut className="size-7 shrink-0" />
                                <span className="overflow-hidden whitespace-nowrap font-bold transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">Salir del Sistema</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cerrar sesión</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Desea salir del sistema? Deberá volver a iniciar sesión para acceder al panel.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button
                            type="button"
                            className="bg-(--color-pagina) hover:bg-(--color-borde-button) text-white"
                            onClick={handleLogout}
                        >
                            Salir
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AppSidebar;
