import React from "react";
import { useAuthStore } from "@/context/useAuthStore";
import { Bell, ChevronDown, User } from "lucide-react";
import { useNavigationStore } from "@/context/useNavigationStore";
import { useHeaderUserActionStore } from "@/context/useHeaderUserActionStore";
import { useHeaderTicketsStore } from "@/context/useHeaderTicketsStore";
import { PosTicketsHeaderDropdown } from "@/components/layout/PosTicketsHeaderDropdown";

const Header = () => {
    const user = useAuthStore((s) => s.user);
    const userName = user?.nombreMostrar || user?.nombres || "Usuario";
    const userRole = user?.rolesEtiqueta || user?.nombreRol || "—";
    const titulo = useNavigationStore((state) => state.titulo);
    const userAction = useHeaderUserActionStore((s) => s.onClick);
    const userHint = useHeaderUserActionStore((s) => s.hint);
    const ticketsVisible = useHeaderTicketsStore((s) => s.visible);

    return (
        <header className="h-[65px] w-full bg-(--color-pagina) flex items-center justify-between px-4 sm:px-8 shadow-sm border-b z-10 sticky top-0">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <h1 className="truncate text-[18px] sm:text-[20px] text-(--color-blanco) font-bold">
                    <span className="text-pagina">{titulo}</span>
                </h1>
                {ticketsVisible ? <PosTicketsHeaderDropdown /> : null}
            </div>

            <div className="flex items-center gap-5">
                <button className="relative p-2 rounded-full cursor-pointer bg-(--color-blanco) hover:bg-(--color-rosa-hover) transition-colors">
                    <Bell className="w-5 h-5 text-(--color-gris-letra)" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-(--color-pagina) rounded-full ring-2 ring-(--color-blanco)"></span>
                </button>
                <div className="h-8 w-[1px] bg-(--color-blanco) hidden sm:block"></div>
                <button
                    type="button"
                    onClick={userAction ?? undefined}
                    title={userHint ?? undefined}
                    disabled={!userAction}
                    className="flex items-center gap-3 bg-(--color-blanco) hover:bg-(--color-rosa-hover) p-1.5 rounded-full pr-4 transition-colors disabled:cursor-default text-left"
                >
                    <div className="w-9 h-9 rounded-full bg-(--color-pagina) flex items-center justify-center text-(--color-blanco)">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-col hidden sm:flex">
                        <span className="text-sm font-bold text-(--color-negro)/85 leading-none">{userName}</span>
                        <span className="text-[11px] text-(--color-gris-letra) mt-1 uppercase font-semibold">{userRole}</span>
                    </div>
                    {userAction ? (
                        <ChevronDown className="w-4 h-4 text-(--color-gris-letra) hidden sm:block" />
                    ) : null}
                </button>
            </div>
        </header>
    );
};

export default Header;