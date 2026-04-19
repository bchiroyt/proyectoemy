import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    Home,
    Package,
    PlusCircle,
    Calculator,
    ShoppingCart,
    Landmark,
    Users,
    LayoutDashboard,
    Settings,
    LogOut,
    Store,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
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
    { icon: Calculator, label: "Caja", to: "/apertura" },
    { icon: Store, label: "Ventas", to: "/ventas" },
    { icon: ShoppingCart, label: "Compras", to: "/compras" },
    { icon: Landmark, label: "Contabilidad", to: "/contabilidad" },
    { icon: Users, label: "Usuarios", to: "/usuarios" },
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
];

const isRouteActive = (pathname, to) => {
    if (to === "/compras") return pathname === "/compras" || pathname.startsWith("/compras/");
    return pathname === to;
};

const AppSidebar = () => {
    const { setOpenMobile } = useSidebar();
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
            <Sidebar collapsible="icon" className="bg-(--color-blanco) border-r">
                <SidebarHeader className="p-1 flex items-center justify-center h-[80px]">
                    <img
                        src={logoImg}
                        alt="Logo"
                        className="h-20 w-auto object-contain group-data-[collapsible=icon]:hidden"
                    />

                    <img
                        src={logo1Img}
                        alt="Logo2"
                        className="h-6 w-auto object-contain hidden group-data-[state=collapsed]:block"
                    />
                </SidebarHeader>

                <SidebarMenu className="px-2 mt-2">
                    <SidebarMenuItem>
                        <SidebarTrigger className="w-full justify-center hover:bg-(--color-pagina) hover:text-(--color-blanco)" />
                    </SidebarMenuItem>
                </SidebarMenu>

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
                                        <span className="group-data-[collapsible=icon]:hidden">
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
                                <span>Configuraciones</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Salir del sistema"
                                className="min-h-12 py-3 text-(--color-pagina) hover:bg-(--color-pagina) hover:text-(--color-blanco)"
                                onClick={() => setLogoutOpen(true)}
                            >
                                <LogOut className="size-7 shrink-0" />
                                <span className="font-bold">Salir del Sistema</span>
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
