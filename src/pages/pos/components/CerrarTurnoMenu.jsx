import { ChevronDown, LayoutDashboard, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CerrarTurnoMenu({ className }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            className ??
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-(--color-pagina) text-(--color-blanco) text-sm font-semibold hover:opacity-90"
          }
        >
          Cerrar turno
          <ChevronDown className="size-4 opacity-90" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onSelect={() => navigate("/pos/cierre")}
          className="cursor-pointer gap-3 py-2.5"
        >
          <Lock className="size-4 shrink-0 text-(--color-pagina)" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Cerrar turno</span>
            <span className="text-xs text-(--color-gris-letra) leading-snug">
              Arqueo de efectivo y cierre de caja del día.
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => navigate("/pos")}
          className="cursor-pointer gap-3 py-2.5"
        >
          <LayoutDashboard className="size-4 shrink-0 text-(--color-pagina)" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Regresar a POS</span>
            <span className="text-xs text-(--color-gris-letra) leading-snug">
              Volver al menú principal sin cerrar el turno.
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
