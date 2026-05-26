import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tarjeta cuadrada del catálogo POS.
 */
export function CatalogoProductoCard({ producto, onAgregar, className }) {
  const sinStock = producto.stockActual != null && producto.stockActual <= 0;

  return (
    <button
      type="button"
      onClick={() => onAgregar(producto)}
      className={cn(
        "text-left bg-(--color-pos-panel) rounded-xl p-3 shadow-sm border border-(--color-pos-borde-suave)",
        "hover:shadow-md hover:border-(--color-pagina)/35 transition cursor-pointer",
        "flex flex-col min-h-[9.5rem]",
        className
      )}
    >
      <div className="aspect-square max-h-24 w-full bg-(--color-pagina-3) rounded-lg mb-2 overflow-hidden flex items-center justify-center">
        <Package
          className="size-8 text-(--color-pagina)/40 shrink-0"
          strokeWidth={1.25}
          aria-hidden
        />
      </div>
      <p className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{producto.nombre}</p>
      <p className="text-sm text-(--color-pos-texto-muted) mt-1 tabular-nums">
        Q {producto.precio.toFixed(2)}
      </p>
      {producto.marca && (
        <p className="text-[10px] text-(--color-pos-texto-muted) mt-0.5 truncate">{producto.marca}</p>
      )}
      {producto.stockActual != null && (
        <p
          className={cn(
            "text-[10px] font-medium mt-1 tabular-nums",
            sinStock ? "text-(--color-rojo-obscuro)" : "text-(--color-pos-texto-muted)"
          )}
        >
          {sinStock ? "Sin stock" : `Stock: ${producto.stockActual}`}
        </p>
      )}
    </button>
  );
}
