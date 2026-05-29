import React from "react";
import { permKey } from "@/pages/usuarios/permisosMatrix";

/**
 * Matriz compacta: módulos en 3 columnas; acciones en rejilla 2×2 por módulo.
 */
export function PermisosMatrizGrid({ groupedRows, localMap, onToggle, onToggleGroup, renderAccionExtra }) {
  if (!groupedRows.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {groupedRows.map(({ meta, acciones: ars }) => {
        const groupAllChecked = ars.every((row) =>
          Boolean(localMap.get(permKey(row.idModulo, row.idSubmodulo, row.idAccion)))
        );

        return (
        <div
          key={`${meta.idModulo}|${meta.idSubmodulo ?? "null"}`}
          className="rounded-lg border border-border bg-(--color-blanco)"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-(--color-pagina-4) px-2.5 py-1.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight text-foreground">{meta.etiquetaModulo}</p>
              {meta.etiquetaSub ? (
                <p className="text-xs text-muted-foreground leading-tight">{meta.etiquetaSub}</p>
              ) : null}
            </div>
            {onToggleGroup ? (
              <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 accent-(--color-pagina-2)"
                  checked={groupAllChecked}
                  onChange={() => onToggleGroup(ars, !groupAllChecked)}
                />
                Todos
              </label>
            ) : null}
          </div>
          <ul className="grid grid-cols-2 gap-1 p-2">
            {ars.map((row) => {
              const k = permKey(row.idModulo, row.idSubmodulo, row.idAccion);
              const checked = Boolean(localMap.get(k));

              return (
                <li key={k}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted/50">
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0 accent-(--color-pagina-2)"
                      checked={checked}
                      onChange={() => onToggle(row)}
                    />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-foreground">{row.etiquetaAccion}</span>
                      {renderAccionExtra ? renderAccionExtra(row, k, checked) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </div>
  );
}
