import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolverEstadoErrorCarga } from "@/lib/permisoErrors";

/**
 * Empty state unificado para errores de carga / permisos en módulos.
 * - 403 / sin permiso → candado + Volver (sin Reintentar por defecto)
 * - Otros errores → alerta + Reintentar
 */
export function EstadoErrorCarga({
  error,
  mensaje,
  nombreModulo = "este módulo",
  fallbackGenerico = "No se pudo cargar la información.",
  onReintentar,
  onVolver,
  className = "",
  compact = false,
  colSpan,
}) {
  const navigate = useNavigate();
  const fuente = error ?? mensaje;
  const estado = resolverEstadoErrorCarga(fuente, { fallbackGenerico, nombreModulo });
  const esPermiso = estado.tipo === "permiso";

  const handleVolver = () => {
    if (typeof onVolver === "function") {
      onVolver();
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/panel-control");
  };

  const content = (
    <div
      role="alert"
      className={cn(
        "mx-auto flex w-full flex-col items-center text-center",
        compact ? "max-w-md gap-3 p-4" : "max-w-lg gap-4 p-6 sm:p-8",
        "rounded-2xl border border-(--color-gris-claro-2) bg-(--color-blanco) shadow-sm",
        esPermiso ? "bg-gradient-to-b from-(--color-pagina-4) to-(--color-blanco)" : "",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          compact ? "h-12 w-12" : "h-14 w-14",
          esPermiso
            ? "bg-(--color-pagina)/10 text-(--color-pagina)"
            : "bg-(--color-rojo)/10 text-(--color-rojo)"
        )}
      >
        {esPermiso ? (
          <Lock className={compact ? "h-5 w-5" : "h-6 w-6"} />
        ) : (
          <AlertCircle className={compact ? "h-5 w-5" : "h-6 w-6"} />
        )}
      </div>

      <div className="space-y-1.5">
        <h3
          className={cn(
            "font-semibold text-(--color-texto-principal)",
            compact ? "text-sm" : "text-base"
          )}
        >
          {estado.titulo}
        </h3>
        <p className={cn("text-(--color-gris-letra)", compact ? "text-xs" : "text-sm")}>
          {estado.mensaje}
        </p>
        {esPermiso && estado.detalleTecnico && estado.detalleTecnico !== estado.mensaje ? (
          <p className="pt-1 text-[10px] font-mono text-(--color-gris-claro) break-words">
            {estado.detalleTecnico}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {esPermiso ? (
          <button
            type="button"
            onClick={handleVolver}
            className="inline-flex items-center gap-1.5 rounded-xl border border-(--color-borde-button) bg-(--color-pagina) px-4 py-2 text-sm font-medium text-(--color-blanco) transition-colors hover:bg-(--color-rosa-hover) hover:text-(--color-negro)"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        ) : null}

        {onReintentar ? (
          <button
            type="button"
            onClick={onReintentar}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              esPermiso
                ? "border border-(--color-gris-claro-2) bg-(--color-blanco) text-(--color-texto-secundario) hover:bg-(--color-gris-fondo-suave)"
                : "border border-(--color-borde-button) bg-(--color-pagina) text-(--color-blanco) hover:bg-(--color-rosa-hover) hover:text-(--color-negro)"
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );

  if (colSpan != null) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-6 sm:p-10">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

export default EstadoErrorCarga;
