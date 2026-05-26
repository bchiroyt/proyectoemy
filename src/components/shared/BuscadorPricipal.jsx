import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const BuscadorPrincipal = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...", 
  className = "" 
}) => {
  const searchInputRef = useRef(null);

  // Atajo de teclado global Ctrl + K
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-(--color-gris-letra)" />
      <Input
        ref={searchInputRef}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-10 w-full border-(--color-pagina-2) bg-(--color-pagina-2)/10 pl-9 shadow-sm focus-visible:ring-(--color-pagina-2)"
      />
      {/* Indicador visual del atajo */}
      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-(--color-gris-claro-2) bg-white px-1.5 font-mono text-[10px] font-medium text-(--color-gris-letra) sm:flex">
        <span>Ctrl</span><span>K</span>
      </div>
    </div>
  );
};

export default BuscadorPrincipal;