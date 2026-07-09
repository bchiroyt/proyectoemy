import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, Boxes, ShoppingCart, Landmark, Users, LayoutDashboard,
    Settings, LogOut, Store, PanelLeft, Briefcase, ChevronDown, Truck, BarChart3, SlidersHorizontal } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuAction,
    SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/tran1.png";
import logo1Img from "@/assets/logo1.jpeg";
import { useAuthStore } from "@/context/useAuthStore";
import { esUsuarioAdmin } from "@/lib/authz";
import { useNavigationStore } from "@/context/useNavigationStore";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
    { icon: Home, label: "Panel de Control", to: "/panel-control" },
    {
        icon: Boxes,
        label: "Inventario",
        to: "/inventario",
        children: [
            { icon: Truck, label: "Proveedores", to: "/inventario/proveedores" },
            { icon: BarChart3, label: "Reporte de Stock", to: "/inventario/reporte-stock" },
            { icon: SlidersHorizontal, label: "Ajustes", to: "/inventario/ajuste" },
        ],
    },
    { icon: ShoppingCart, label: "Compras", to: "/compras" },
    { icon: Store, label: "POS", to: "/pos" },
    { icon: Briefcase, label: "Mayoreo", to: "/mayoreo" },
    { icon: Landmark, label: "Contabilidad", to: "/contabilidad" },
    { icon: Users, label: "Usuarios", to: "/usuarios" },
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
];

const isRouteActive = (pathname, to) => {
    if (to === "/inventario") return pathname === "/inventario" || pathname.startsWith("/inventario/");
    if (to === "/compras") return pathname === "/compras" || pathname.startsWith("/compras/");
    if (to === "/pos") return pathname === "/pos" || pathname.startsWith("/pos/");
    if (to === "/mayoreo") return pathname === "/mayoreo" || pathname.startsWith("/mayoreo/");
    return pathname === to;
};

const AppSidebar = () => {
    const { isMobile, open, setOpen, setOpenMobile, state, toggleSidebar } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore((s) => s.user);
    const attemptNavigation = useNavigationStore((s) => s.attemptNavigation);
    const menuItemsVisibles = useMemo(
        () =>
            menuItems.filter(
                (item) => item.to !== "/dashboard" || esUsuarioAdmin(user)
            ),
        [user]
    );
    const [logoutOpen, setLogoutOpen] = useState(false);
    const sidebarColapsada = !isMobile && state === "collapsed";
    const [inventarioMenuOpen, setInventarioMenuOpen] = useState(false);
    const [inventarioDropdownOpen, setInventarioDropdownOpen] = useState(false);

    useEffect(() => {
        if (!sidebarColapsada) {
            setInventarioDropdownOpen(false);
        }
    }, [sidebarColapsada]);

    useEffect(() => {
        setInventarioDropdownOpen(false);
    }, [location.pathname]);

    const handleParentMenuClick = (item) => {
        setOpenMobile(false);

        if (sidebarColapsada) {
            setInventarioDropdownOpen((prev) => !prev);
            return;
        }

        if (location.pathname === item.to) return;
        if (!attemptNavigation(item.to)) return;
        navigate(item.to);
    };

    const handleMenuNavigate = (event, item) => {
        setOpenMobile(false);
        const to = item.to;
        if (location.pathname === to) return;
        if (!attemptNavigation(to)) {
            event.preventDefault();
        }
    };

    const handleCollapsedSubmenuSelect = (event, item) => {
        if (location.pathname === item.to) {
            setInventarioDropdownOpen(false);
            return;
        }

        if (!attemptNavigation(item.to)) {
            event.preventDefault();
            return;
        }

        setInventarioDropdownOpen(false);
        navigate(item.to);
    };

    const handleToggleInventarioMenu = () => {
        if (!isMobile && !open) {
            setOpen(true);
        }
        setInventarioMenuOpen((prev) => !prev);
    };

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

            <Sidebar collapsible="icon" className="z-40 bg-(--color-blanco) border-r">

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
                        {menuItemsVisibles.map((item) => {
                            const itemActivo = isRouteActive(location.pathname, item.to);
                            const tieneSubmenu = item.children?.length > 0;

                            return (
                                <SidebarMenuItem key={item.to}>
                                    {tieneSubmenu && sidebarColapsada ? (
                                        <DropdownMenu open={inventarioDropdownOpen} onOpenChange={setInventarioDropdownOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuButton
                                                    type="button"
                                                    size="lg"
                                                    isActive={itemActivo}
                                                    aria-label={item.label}
                                                    className={cn(
                                                        "min-h-11 data-[active=true]:bg-(--color-pagina) data-[active=true]:text-(--color-blanco) [&_svg]:size-7",
                                                        "hover:bg-(--color-pagina)/10 hover:text-(--color-pagina) data-[active=true]:hover:bg-(--color-pagina) data-[active=true]:hover:text-(--color-blanco)"
                                                    )}
                                                >
                                                    <item.icon className="size-8 shrink-0" />
                                                    <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">
                                                        {item.label}
                                                    </span>
                                                </SidebarMenuButton>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                side="right"
                                                align="start"
                                                sideOffset={12}
                                                className="w-60 rounded-xl border border-(--color-gris-claro-2) bg-(--color-blanco) p-1.5 shadow-xl"
                                            >
                                                <DropdownMenuLabel className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-(--color-gris-letra)">
                                                    {item.label}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator className="mx-0 my-1 bg-(--color-gris-claro-2)" />
                                                <DropdownMenuItem
                                                    onSelect={(event) => handleCollapsedSubmenuSelect(event, item)}
                                                    className="cursor-pointer rounded-lg px-2 py-2 text-sm font-semibold text-(--color-negro) focus:bg-(--color-pagina)/10 focus:text-(--color-pagina)"
                                                >
                                                    <item.icon className="size-4" />
                                                    <span>Ver inventario</span>
                                                </DropdownMenuItem>
                                                {item.children.map((subitem) => (
                                                    <DropdownMenuItem
                                                        key={subitem.to}
                                                        onSelect={(event) => handleCollapsedSubmenuSelect(event, subitem)}
                                                        className={cn(
                                                            "cursor-pointer rounded-lg px-2 py-2 text-sm text-(--color-gris-letra) focus:bg-(--color-pagina)/10 focus:text-(--color-pagina)",
                                                            isRouteActive(location.pathname, subitem.to) && "bg-(--color-pagina) font-semibold text-(--color-blanco) focus:bg-(--color-pagina) focus:text-(--color-blanco)"
                                                        )}
                                                    >
                                                        {subitem.icon ? <subitem.icon className="size-4" /> : null}
                                                        <span>{subitem.label}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : tieneSubmenu ? (
                                        <div className="relative">
                                            <SidebarMenuButton
                                                type="button"
                                                size="lg"
                                                isActive={itemActivo || inventarioMenuOpen}
                                                tooltip={item.label}
                                                onClick={() => handleParentMenuClick(item)}
                                                className={cn(
                                                    "min-h-11 data-[active=true]:bg-(--color-pagina) data-[active=true]:text-(--color-blanco) [&_svg]:size-7",
                                                    "hover:bg-(--color-pagina)/10 hover:text-(--color-pagina) data-[active=true]:hover:bg-(--color-pagina) data-[active=true]:hover:text-(--color-blanco)"
                                                )}
                                            >
                                                <item.icon className="size-8 shrink-0" />
                                                <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">
                                                    {item.label}
                                                </span>
                                            </SidebarMenuButton>

                                            <SidebarMenuAction
                                                aria-label={inventarioMenuOpen ? "Contraer submenú de inventario" : "Expandir submenú de inventario"}
                                                aria-expanded={inventarioMenuOpen}
                                                onClick={handleToggleInventarioMenu}
                                                className={cn(
                                                    "right-1 h-8 w-8 rounded-lg border border-(--color-gris-claro-2) bg-(--color-gris-fondo-suave) px-1.5 text-(--color-gris-oscuro) shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-(--color-gris-borde) hover:bg-(--color-gris-fondo) hover:text-(--color-gris-oscuro) focus:bg-(--color-gris-fondo) focus:text-(--color-gris-oscuro) peer-data-[size=lg]/menu-button:top-1/2 peer-data-[size=lg]/menu-button:-translate-y-1/2",
                                                    (itemActivo || inventarioMenuOpen) &&
                                                      "border-(--color-gris-borde) bg-(--color-gris-fondo) text-(--color-gris-oscuro) hover:bg-(--color-gris-claro-2) hover:text-(--color-gris-oscuro)"
                                                )}
                                            >
                                                <ChevronDown
                                                    className={cn(
                                                        "size-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                                        inventarioMenuOpen && "rotate-180"
                                                    )}
                                                />
                                            </SidebarMenuAction>
                                        </div>
                                    ) : (
                                        <SidebarMenuButton
                                            asChild
                                            size="lg"
                                            isActive={itemActivo}
                                            tooltip={item.label}
                                            className={cn(
                                                "min-h-11 data-[active=true]:bg-(--color-pagina) data-[active=true]:text-(--color-blanco)",
                                                "hover:bg-(--color-pagina)/10 hover:text-(--color-pagina) data-[active=true]:hover:bg-(--color-pagina) data-[active=true]:hover:text-(--color-blanco)"
                                            )}
                                        >
                                            <NavLink
                                                to={item.to}
                                                onClick={(event) => handleMenuNavigate(event, item)}
                                                className="flex w-full items-center gap-2 outline-none ring-sidebar-ring [&_svg]:size-7"
                                            >
                                                <item.icon className="size-8 shrink-0" />
                                                <span className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] max-w-40 opacity-100 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:-translate-x-1 group-data-[state=collapsed]:opacity-0">
                                                    {item.label}
                                                </span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    )}

                                    {tieneSubmenu && !sidebarColapsada ? (
                                        <div
                                            className={cn(
                                                "grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[state=collapsed]:hidden",
                                                inventarioMenuOpen ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                            )}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                <SidebarMenuSub className="border-l-(--color-gris-claro-2) py-1">
                                                    {item.children.map((subitem) => (
                                                        <SidebarMenuSubItem key={subitem.to}>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={isRouteActive(location.pathname, subitem.to)}
                                                                className={cn(
                                                                    "h-8 rounded-lg text-[13px] text-(--color-gris-letra) hover:bg-(--color-pagina)/10 hover:text-(--color-pagina)",
                                                                    "data-[active=true]:bg-(--color-pagina) data-[active=true]:font-semibold data-[active=true]:text-(--color-blanco)"
                                                                )}
                                                            >
                                                                <NavLink
                                                                    to={subitem.to}
                                                                    onClick={(event) => handleMenuNavigate(event, subitem)}
                                                                    className="flex w-full items-center gap-2"
                                                                >
                                                                    {subitem.icon ? <subitem.icon className="size-4 shrink-0" /> : null}
                                                                    <span>{subitem.label}</span>
                                                                </NavLink>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </div>
                                        </div>
                                    ) : null}
                                </SidebarMenuItem>
                            );
                        })}
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
