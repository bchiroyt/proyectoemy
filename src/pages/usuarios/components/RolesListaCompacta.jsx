import React from "react";

/** Lista de roles en 3 columnas, solo nombre en español. */
export function RolesListaCompacta({ roles, selectedRolId, onSelect }) {
  if (!roles.length) {
    return <p className="p-3 text-sm text-muted-foreground">Sin roles.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {roles.map((r) => {
        const selected = selectedRolId === r.idRol;
        return (
          <li key={r.idRol}>
            <button
              type="button"
              onClick={() => onSelect(r.idRol)}
              className={
                selected
                  ? "w-full rounded-md border border-(--color-pagina-2) bg-(--color-pagina-3) px-2.5 py-2 text-left text-sm font-semibold text-foreground"
                  : "w-full rounded-md border border-transparent px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted/80"
              }
            >
              {r.nombre}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
