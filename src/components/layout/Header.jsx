import React from 'react';
import { useAuthStore } from "@/context/useAuthStore";
import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigationStore } from "@/context/useNavigationStore";

const Header = () => {
    // Optionally access user state if available
    const userRole = "admin POS";
    const userName = "Administrador";
    const titulo = useNavigationStore((state) => state.titulo);


    return (
        <header className="h-[65px] w-full bg-(--color-pagina) flex items-center justify-between px-8 shadow-sm border-b z-10 sticky top-0">
            <div className="flex items-center gap-4 text-center">
                <h1 className="text-[20px] text-(--color-blanco) font-bold"> <span className="text-pagina">{titulo}</span></h1>
            </div>

            <div className="flex items-center gap-5">
                <button className="relative p-2 rounded-full cursor-pointer bg-(--color-blanco) hover:bg-(--color-rosa-hover) transition-colors">
                    <Bell className="w-5 h-5 text-(--color-gris-letra)" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-(--color-pagina) rounded-full ring-2 ring-(--color-blanco)"></span>
                </button>
                <div className="h-8 w-[1px] bg-(--color-blanco) hidden sm:block"></div>
                <div className="flex items-center gap-3 cursor-pointer bg-(--color-blanco) hover:bg-(--color-rosa-hover) p-1.5 rounded-full pr-4 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-(--color-pagina) flex items-center justify-center text-(--color-blanco)">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-col hidden sm:flex">
                        <span className="text-sm font-bold text-(--color-negro)/85 leading-none">{userName}</span>
                        <span className="text-[11px] text-(--color-gris-letra) mt-1 uppercase font-semibold">{userRole}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;