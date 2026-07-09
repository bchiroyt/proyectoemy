import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/apiClient";
import { pick } from "@/lib/apiNormalizer";
import {
  buildNombreCatalogoPos,
  CLASES_ETIQUETA_VARIANTE,
  obtenerEtiquetasVariante,
  pickNombreVariante,
} from "@/lib/varianteUtils";

/**
 * Tarjeta cuadrada del catálogo POS.
 */
export function CatalogoProductoCard({ producto, onAgregar, className }) {
  const sinStock = producto.stockActual != null && producto.stockActual <= 0;
  const [imgError, setImgError] = useState(false);
  const nombreCompleto = buildNombreCatalogoPos(producto);
  const nombreBase =
    pickNombreVariante(producto) ||
    pick(
      producto,
      "nombreProducto",
      "NombreProducto",
      "productoNombre",
      "ProductoNombre",
      "nombre",
      "Nombre"
    ) ||
    "Producto";
  const etiquetas = obtenerEtiquetasVariante(producto).filter(
    (etiqueta) => etiqueta.key !== "nombreVariante"
  );

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
        {producto.urlImagen && !imgError ? (
          <img
            src={`${API_BASE_URL}${producto.urlImagen}`}
            alt={nombreCompleto}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Package
            className="size-8 text-(--color-pagina)/40 shrink-0"
            strokeWidth={1.25}
            aria-hidden
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-normal leading-snug line-clamp-2">{nombreBase}</p>
        {etiquetas.length > 0 ? (
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
            {etiquetas.map((etiqueta) => (
              <span
                key={etiqueta.key}
                className={cn(
                  "min-w-0 max-w-full truncate rounded border px-1.5 py-px text-[10px] leading-none font-medium",
                  CLASES_ETIQUETA_VARIANTE[etiqueta.key]
                )}
                title={etiqueta.value}
              >
                {etiqueta.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
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
